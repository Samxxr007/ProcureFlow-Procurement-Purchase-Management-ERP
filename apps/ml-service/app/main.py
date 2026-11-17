from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import predict, train, status

app = FastAPI(
    title="ProcureFlow ML Quality Intelligence Service",
    description="Predictive Regression Test Selection & Confidence-Aware Adaptive Execution Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(train.router)
app.include_router(status.router)

@app.get("/")
def read_root():
    return {
        "service": "ProcureFlow ML Quality Intelligence Service",
        "status": "online",
        "endpoints": ["/status", "/predict", "/train"]
    }
