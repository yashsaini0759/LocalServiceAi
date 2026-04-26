from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from engine import search_providers, build_cache_if_missing
import threading

app = FastAPI()

# Allow CORS for proxying from Node.js or direct client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Start cache checking in background so server turns on instantly
    threading.Thread(target=build_cache_if_missing, daemon=True).start()

@app.get("/search/semantic")
def search(q: str = ""):
    if not q:
        return []
    return search_providers(q)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
