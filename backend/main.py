"""
CausalGuard FastAPI backend.
Run: uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from api.routes import router

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CausalGuard API",
    description="Explainable Causal-Chain Fraud Detection — Razorpay Buildathon Track 2",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "CausalGuard", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "healthy"}
