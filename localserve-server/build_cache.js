require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const CACHE_FILE = path.join(__dirname, 'embeddings_cache.json');

async function getGeminiEmbeddings(texts) {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: texts,
    });
    if (response.embeddings) return response.embeddings.map(e => e.values);
    return [];
}

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    console.log("Fetching providers...");
    const providers = await prisma.providerProfile.findMany({ include: { servicesOffered: true } });
    const chunks = [];
    const ids = [];

    providers.forEach(p => {
         const subServices = p.servicesOffered.map(s => s.category + " " + s.description).join(". ");
         chunks.push(`Category: ${p.service}. Description: ${p.description}. Tags: ${p.tags}. Specifics: ${subServices}`);
         ids.push(p.id);
    });

    console.log(`Found ${chunks.length} total providers. Building embeddings...`);
    const BATCH_SIZE = 5;
    const vectors = [];

    for(let i=0; i<chunks.length; i+=BATCH_SIZE) {
        console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(chunks.length/BATCH_SIZE)}...`);
        try {
            const batch = chunks.slice(i, i+BATCH_SIZE);
            const embs = await getGeminiEmbeddings(batch);
            vectors.push(...embs);
            await delay(2000); // Wait 2s to respect very tight quotas
        } catch (e) {
            console.error("Failed on batch", e);
            throw e;
        }
    }

    const cacheDataToSave = [];
    for(let i=0; i<ids.length; i++) {
        cacheDataToSave.push({ id: ids[i], vector: vectors[i] });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheDataToSave));
    console.log("Successfully wrote cache file!");
    process.exit(0);
}

run();
