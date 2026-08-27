import os
from datetime import datetime, timezone

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Consulting Offer Bootcamp API", version="0.1.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

delivered_enrollments: dict[str, dict[str, str | bool]] = {}


class EnrollmentDeliveryRequest(BaseModel):
    payment_reference: str = Field(min_length=3, max_length=160)
    email: str = Field(min_length=3, max_length=320)
    currency: str = Field(pattern="^(USD|NGN)$")
    vip: bool = False


@app.post("/enrollments/deliver")
def deliver_enrollment(
    request: EnrollmentDeliveryRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> dict[str, str | bool]:
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="Idempotency-Key header is required")
    if idempotency_key in delivered_enrollments:
        return {**delivered_enrollments[idempotency_key], "duplicate": True}

    record: dict[str, str | bool] = {
        "status": "pending_delivery",
        "payment_reference": request.payment_reference,
        "email": request.email,
        "currency": request.currency,
        "vip": request.vip,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    delivered_enrollments[idempotency_key] = record
    return {**record, "duplicate": False}


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "consulting-offer-bootcamp-api", "status": "online"}


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "phase": "2"}