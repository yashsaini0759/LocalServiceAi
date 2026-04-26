import os
import json
import time
import numpy as np
import pandas as pd
from database import engine
from google import genai
from datetime import datetime, timedelta

CACHE_FILE = "embeddings_cache.json"

def initialize_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in .env")
    return genai.Client(api_key=api_key)

def load_cache():
    try:
        if os.path.exists(CACHE_FILE):
             with open(CACHE_FILE, 'r') as f:
                 data = json.load(f)
             # Map provider_id -> numpy array
             return {item['id']: np.array(item['vector'], dtype=np.float32) for item in data}
    except Exception as e:
        print("Failed to read cache", e)
    return {}

def compute_cosine_similarity(vec1, vec2):
    dot = np.dot(vec1, vec2)
    norm = np.linalg.norm(vec1) * np.linalg.norm(vec2)
    return float(dot / norm) if norm != 0 else 0.0

QUERY_CACHE = {}  # in-memory cache: query_text -> embedding vector

def get_embeddings(texts):
    client = initialize_gemini()
    response = client.models.embed_content(
        model='gemini-embedding-2',
        contents=texts
    )
    if response and hasattr(response, 'embeddings'):
        return [emb.values for emb in response.embeddings]
    return []

def get_query_embedding(query: str):
    """Get embedding for a query, caching in memory to avoid repeated API calls."""
    key = query.strip().lower()
    if key in QUERY_CACHE:
        return QUERY_CACHE[key]
    vec = get_embeddings([query])[0]
    QUERY_CACHE[key] = vec
    return vec

# Build cache synchronously if missing
def build_cache_if_missing():
    cache = load_cache()
    if cache:
        print(f"[Semantic Engine Python] Loaded {len(cache)} providers from cache.")
        return cache

    print("[Semantic Engine Python] Building cache from scratch via DataFrame...")
    query_sql = """
    SELECT p.id, p.service, p.description, p.tags, s.category as s_cat, s.description as s_desc
    FROM "ProviderProfile" p
    LEFT JOIN "ProviderService" s ON p.id = s."providerProfileId"
    """
    df = pd.read_sql(query_sql, engine)
    if df.empty:
        return {}

    def build_text(group):
        service = group['service'].iloc[0]
        desc = group['description'].iloc[0]
        tags = group['tags'].iloc[0]
        subs = []
        for _, row in group.iterrows():
            if pd.notna(row['s_cat']):
                subs.append(f"{row['s_cat']} {row['s_desc']}")
        subs_text = ". ".join(subs)
        return f"Category: {service}. Description: {desc}. Tags: {tags}. Specifics: {subs_text}"

    grouped = df.groupby('id').apply(build_text).reset_index(name='text')
    chunks = grouped['text'].tolist()
    ids = grouped['id'].tolist()

    vectors = []
    BATCH_SIZE = 10
    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i+BATCH_SIZE]
        embs = get_embeddings(batch)
        vectors.extend(embs)
        time.sleep(1)

    cache_to_save = [{"id": pid, "vector": vec} for pid, vec in zip(ids, vectors)]
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache_to_save, f)
    return load_cache()

def keyword_fallback_search(query: str, cache: dict):
    """Score providers by keyword overlap when Gemini API is rate-limited."""
    query_words = set(query.lower().split())
    try:
        df = pd.read_sql("""
            SELECT p.id, p.service, p.description, s.category as s_cat
            FROM "ProviderProfile" p
            LEFT JOIN "ProviderService" s ON p.id = s."providerProfileId"
        """, engine)
        results = []
        seen = set()
        for pid in cache.keys():
            if pid in seen:
                continue
            seen.add(pid)
            rows = df[df['id'] == pid]
            if rows.empty:
                results.append({"id": pid, "score": 0.42})
                continue
            text = " ".join([
                str(rows['service'].iloc[0] or ''),
                str(rows['description'].iloc[0] or ''),
                " ".join(rows['s_cat'].dropna().tolist())
            ]).lower()
            matches = sum(1 for w in query_words if w in text)
            score = min(0.42 + (matches / max(len(query_words), 1)) * 0.30, 0.72)
            results.append({"id": pid, "score": score})
        results.sort(key=lambda x: x['score'], reverse=True)
        return results
    except Exception as e:
        print("Keyword fallback error:", e)
        return [{"id": pid, "score": 0.41} for pid in cache.keys()]

def search_providers(query: str):
    cache = build_cache_if_missing()
    if not cache:
        return []
    try:
        query_vec = get_query_embedding(query)
        query_vec_np = np.array(query_vec, dtype=np.float32)
        results = []
        for pid, vec in cache.items():
            score = compute_cosine_similarity(query_vec_np, vec)
            results.append({"id": pid, "score": score})
        results.sort(key=lambda x: x['score'], reverse=True)
        return results
    except Exception as e:
        print(f"[Semantic Search] Gemini API unavailable ({e}), using keyword fallback.")
        return keyword_fallback_search(query, cache)


