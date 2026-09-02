import os
import hmac
import hashlib
import logging
import requests
from datetime import datetime, timezone
from typing import Optional, Any
from functools import lru_cache

from fastapi import FastAPI, Header, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import supabase

from kajabi_client import KajabiClient
from google_sheets import GoogleSheetsClient

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Consulting Offer Bootcamp API", version="0.2.0")

configured_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,https://bootcamp-eosin-iota.vercel.app",
)
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in configured_origins.split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# In-memory storage for Phase 2 (will be replaced by Supabase)
delivered_enrollments: dict[str, dict[str, str | bool]] = {}


# ============================================================================
# CONFIG & INITIALIZATION
# ============================================================================

@lru_cache(maxsize=1)
def get_supabase_client() -> supabase.Client:
    """Get or create Supabase client."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Supabase integration"
        )
    return supabase.create_client(url, key)


@lru_cache(maxsize=1)
def get_kajabi_client() -> KajabiClient:
    """Get or create Kajabi API client."""
    return KajabiClient()


@lru_cache(maxsize=1)
def get_google_sheets_client() -> Optional[GoogleSheetsClient]:
    """Get or create Google Sheets client (optional)."""
    try:
        return GoogleSheetsClient()
    except ValueError as e:
        logger.warning(f"Google Sheets not configured: {str(e)}")
        return None


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class EnrollmentDeliveryRequest(BaseModel):
    payment_reference: str = Field(min_length=3, max_length=160)
    email: str = Field(min_length=3, max_length=320)
    currency: str = Field(pattern="^(USD|NGN)$")
    vip: bool = False


class WaitlistLeadRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=320)
    country: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=40)


class KajabiWebhookPayload(BaseModel):
    """Kajabi webhook payload (schema may vary based on Kajabi documentation)."""
    event_type: str
    customer_id: str
    purchase_id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    amount: int  # in cents
    currency: str = "USD"
    timestamp: str


def _normalize_paystack_payload(payload: Any) -> dict[str, Any]:
    """Normalize Paystack objects and Pabbly list/key-value test payloads."""
    if isinstance(payload, dict):
        for nested_key in ("body", "payload", "data"):
            nested = payload.get(nested_key)
            if isinstance(nested, list):
                normalized = _normalize_paystack_payload(nested)
                return {**payload, **normalized}
        return payload
    if isinstance(payload, list):
        mapped: dict[str, Any] = {}
        for item in payload:
            if not isinstance(item, dict):
                continue
            key = item.get("key") or item.get("name") or item.get("field")
            if key and "value" in item:
                mapped[str(key)] = item["value"]
            elif any(field in item for field in ("event", "data", "reference", "transaction_reference")):
                mapped.update(item)
        return mapped
    return {}


def _paystack_reference(payload: Any) -> str | None:
    if isinstance(payload, dict):
        reference = payload.get("reference") or payload.get("transaction_reference")
        if reference:
            return str(reference)
        for value in payload.values():
            reference = _paystack_reference(value)
            if reference:
                return reference
    elif isinstance(payload, list):
        for value in payload:
            reference = _paystack_reference(value)
            if reference:
                return reference
    return None


def _verify_paystack_signature(
    raw_body: bytes,
    paystack_signature: str | None,
    pabbly_signature: str | None,
) -> None:
    paystack_webhook_secret = os.getenv("PAYSTACK_WEBHOOK_SECRET")
    pabbly_webhook_secret = os.getenv("PABBLY_WEBHOOK_SECRET")
    require_pabbly_signature = os.getenv("REQUIRE_PABBLY_WEBHOOK_SIGNATURE", "false").lower() == "true"
    if not paystack_webhook_secret and not pabbly_webhook_secret:
        logger.warning("Paystack webhook signature verification is disabled")
        return
    if paystack_webhook_secret and paystack_signature:
        expected = hmac.new(paystack_webhook_secret.encode(), raw_body, hashlib.sha512).hexdigest()
        if hmac.compare_digest(paystack_signature, expected):
            return
    if pabbly_webhook_secret and pabbly_signature:
        expected = hmac.new(pabbly_webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if hmac.compare_digest(pabbly_signature, expected):
            return
    if pabbly_webhook_secret and not pabbly_signature and not require_pabbly_signature:
        logger.warning("Pabbly signature not supplied; Paystack transaction verification remains required")
        return
    if not paystack_webhook_secret and not pabbly_webhook_secret:
        return
    raise HTTPException(status_code=401, detail="Invalid or missing webhook signature")


def _verify_paystack_transaction(reference: str) -> dict[str, Any]:
    secret_key = os.getenv("PAYSTACK_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    response = requests.get(
        f"https://api.paystack.co/transaction/verify/{reference}",
        headers={"Authorization": f"Bearer {secret_key}"},
        timeout=15,
    )
    response.raise_for_status()
    result = response.json()
    transaction = result.get("data") or {}
    if not result.get("status") or transaction.get("status") != "success":
        raise RuntimeError("Paystack transaction was not successful")
    return transaction


def _paystack_customer(transaction: dict[str, Any]) -> dict[str, str]:
    customer = transaction.get("customer") if isinstance(transaction.get("customer"), dict) else {}
    metadata = transaction.get("metadata") if isinstance(transaction.get("metadata"), dict) else {}
    return {
        "email": str(customer.get("email") or transaction.get("email") or ""),
        "first_name": str(metadata.get("first_name") or ""),
        "last_name": str(metadata.get("last_name") or ""),
        "full_name": str(metadata.get("full_name") or ""),
        "phone": str(customer.get("phone") or metadata.get("phone") or ""),
    }


# ============================================================================
# STRIPE/PAYSTACK ENDPOINTS (EXISTING)
# ============================================================================

@app.post("/waitlist")
def create_waitlist_lead(request: WaitlistLeadRequest) -> dict[str, str]:
    """Persist a Page 1 lead in Supabase and the dedicated Waitlist sheet tab."""
    normalized_email = request.email.strip().lower()
    lead_data = {
        "first_name": request.first_name.strip(),
        "last_name": request.last_name.strip(),
        "email": normalized_email,
        "country": request.country.strip(),
        "phone": request.phone.strip(),
        "source": "page-1-waitlist",
        "status": "waitlist",
    }
    try:
        supabase_client = get_supabase_client()
        response = supabase_client.table("waitlist_leads").insert(lead_data).execute()
        lead_id = str(response.data[0]["id"])

        sheets_client = get_google_sheets_client()
        spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        if not sheets_client or not spreadsheet_id:
            raise RuntimeError("Google Sheets is not configured")
        sheet_result = sheets_client.append_waitlist_lead(
            spreadsheet_id, worksheet_name="Waitlist", lead_data={**lead_data, "lead_id": lead_id}
        )
        if sheet_result.get("status") != "success":
            raise RuntimeError(sheet_result.get("error", "Waitlist sheet write failed"))
        return {"status": "success", "lead_id": lead_id}
    except Exception as error:
        logger.error("Waitlist lead processing failed: %s", error, exc_info=True)
        raise HTTPException(status_code=502, detail="We could not save your waitlist spot. Please try again.") from error

@app.post("/enrollments/deliver")
def deliver_enrollment(
    request: EnrollmentDeliveryRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
) -> dict[str, str | bool]:
    """Handle enrollment delivery after Stripe/Paystack payment."""
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


# ============================================================================
# KAJABI WEBHOOK ENDPOINT
# ============================================================================

@app.post("/webhooks/paystack")
async def handle_paystack_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_paystack_signature: Optional[str] = Header(None),
    x_pabbly_webhook_secret: Optional[str] = Header(None),
) -> dict[str, Any]:
    """Receive Paystack events directly or forwarded through Pabbly."""
    raw_body = await request.body()
    _verify_paystack_signature(raw_body, x_paystack_signature, x_pabbly_webhook_secret)
    try:
        payload = await request.json()
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Paystack webhook body must be valid JSON") from error

    normalized_payload = _normalize_paystack_payload(payload)
    reference = _paystack_reference(normalized_payload)
    if not reference:
        raise HTTPException(
            status_code=400,
            detail="Paystack webhook must include data.reference or transaction_reference",
        )
    event_id = str(normalized_payload.get("id") or reference or hashlib.sha256(raw_body).hexdigest())
    background_tasks.add_task(process_paystack_payment, normalized_payload, event_id, reference)
    return {"status": "received", "event_id": event_id}


async def process_paystack_payment(
    payload: dict[str, Any], event_id: str, reference: str | None
) -> None:
    """Verify and persist a successful Paystack charge from Pabbly."""
    if payload.get("event") not in (None, "charge.success"):
        logger.info("Ignoring non-successful Paystack event: %s", payload.get("event"))
        return
    if not reference:
        logger.error("Paystack event has no transaction reference: %s", event_id)
        return
    try:
        supabase_client = get_supabase_client()
        existing = supabase_client.table("payment_events").select("id").eq(
            "provider", "paystack"
        ).eq("provider_event_id", event_id).execute()
        if existing.data:
            logger.info("Paystack event %s already processed", event_id)
            return

        transaction = _verify_paystack_transaction(reference)
        customer = _paystack_customer(transaction)
        currency = str(transaction.get("currency", "")).upper()
        if currency not in {"NGN", "USD"} or not customer["email"]:
            raise RuntimeError("Paystack transaction is missing a supported currency or email")

        payment_reference = f"paystack-{reference}"
        enrollment_data = {
            "email": customer["email"],
            "first_name": customer["first_name"] or None,
            "last_name": customer["last_name"] or None,
            "full_name": customer["full_name"] or None,
            "phone_number": customer["phone"] or None,
            "amount_minor": transaction.get("amount"),
            "currency": currency,
            "provider": "paystack",
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_reference": payment_reference,
        }
        supabase_client.table("enrollments").upsert(
            enrollment_data, on_conflict="payment_reference"
        ).execute()
        supabase_client.table("payment_events").insert({
            "provider": "paystack",
            "provider_event_id": event_id,
            "payment_reference": payment_reference,
            "event_type": payload.get("event", "charge.success"),
            "payload": payload,
            "received_at": datetime.now(timezone.utc).isoformat(),
            "processed_at": datetime.now(timezone.utc).isoformat(),
        }).execute()

        sheets_client = get_google_sheets_client()
        spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
        if sheets_client and spreadsheet_id:
            sheet_result = sheets_client.append_enrollment(
                spreadsheet_id,
                worksheet_name="Enrollments",
                enrollment_data={
                    "email": customer["email"],
                    "full_name": customer["full_name"],
                    "phone": customer["phone"],
                    "amount": transaction.get("amount"),
                    "currency": currency,
                    "status": "paid",
                    "payment_reference": payment_reference,
                    "source": "paystack",
                },
            )
            if sheet_result.get("status") != "success":
                raise RuntimeError(sheet_result.get("error", "Enrollment sheet write failed"))
        logger.info("Processed Paystack payment %s", reference)
    except Exception:
        logger.error("Error processing Paystack payment %s", reference, exc_info=True)

@app.post("/webhooks/kajabi")
async def handle_kajabi_webhook(
    payload: dict[str, Any],
    background_tasks: BackgroundTasks,
    x_kajabi_signature: Optional[str] = Header(None),
) -> dict[str, Any]:
    """
    Handle Kajabi webhook for payment events.
    
    Kajabi will POST payment events to this endpoint.
    Optionally verifies HMAC signature if KAJABI_WEBHOOK_SECRET is set.
    """
    webhook_secret = os.getenv("KAJABI_WEBHOOK_SECRET")

    # Verify webhook signature if secret is configured
    if webhook_secret and x_kajabi_signature:
        try:
            # Note: Adjust based on Kajabi's actual signature format
            expected_signature = hmac.new(
                webhook_secret.encode(),
                str(payload).encode(),
                hashlib.sha256,
            ).hexdigest()

            if not hmac.compare_digest(x_kajabi_signature, expected_signature):
                raise HTTPException(status_code=401, detail="Invalid signature")
        except Exception as e:
            logger.error(f"Signature verification failed: {str(e)}")
            raise HTTPException(status_code=401, detail="Signature verification failed")

    logger.info(f"Received Kajabi webhook: {payload}")

    # Queue processing in background
    background_tasks.add_task(process_kajabi_payment, payload)

    return {"status": "received", "event_id": payload.get("id", "unknown")}


async def process_kajabi_payment(payload: dict[str, Any]) -> None:
    """
    Process a Kajabi payment event.
    - Store in Supabase payment_events table
    - Update enrollment status
    - Record in Google Sheets
    """
    try:
        event_type = payload.get("event_type", "unknown")
        customer_id = payload.get("customer_id")
        purchase_id = payload.get("purchase_id")

        logger.info(f"Processing Kajabi event: {event_type} for customer {customer_id}")

        # 1. Store raw event in Supabase payment_events table
        supabase_client = get_supabase_client()
        event_record = {
            "provider": "kajabi",
            "provider_event_id": f"{purchase_id}",
            "event_type": event_type,
            "payload": payload,
            "received_at": datetime.now(timezone.utc).isoformat(),
        }

        response = supabase_client.table("payment_events").insert(event_record).execute()
        logger.info(f"Stored payment event in Supabase: {response}")

        # 2. Update or create enrollment record
        if event_type in ["purchase.completed", "purchase.created"]:
            enrollment_data = {
                "email": payload.get("email"),
                "first_name": payload.get("first_name"),
                "last_name": payload.get("last_name"),
                "full_name": payload.get("full_name"),
                "phone_number": payload.get("phone"),
                "kajabi_customer_id": customer_id,
                "kajabi_purchase_id": purchase_id,
                "amount_minor": payload.get("amount"),  # in cents
                "currency": payload.get("currency", "USD"),
                "provider": "kajabi",
                "status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat(),
                "payment_reference": f"kajabi-{purchase_id}",
            }

            # Upsert enrollment (update if exists, create if not)
            response = supabase_client.table("enrollments").upsert(
                enrollment_data,
                on_conflict="payment_reference",
            ).execute()
            logger.info(f"Updated enrollment in Supabase: {response}")

            # 3. Record in Google Sheets
            sheets_client = get_google_sheets_client()
            if sheets_client:
                spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")
                if spreadsheet_id:
                    sheets_result = sheets_client.append_enrollment(
                        spreadsheet_id,
                        worksheet_name="Enrollments",
                        enrollment_data={
                            "email": payload.get("email"),
                            "full_name": payload.get("full_name"),
                            "phone": payload.get("phone"),
                            "amount": payload.get("amount"),
                            "currency": payload.get("currency", "USD"),
                            "status": "paid",
                            "payment_reference": f"kajabi-{purchase_id}",
                            "customer_id": customer_id,
                            "source": "kajabi",
                        },
                    )
                    logger.info(f"Recorded enrollment in Google Sheets: {sheets_result}")

    except Exception as e:
        logger.error(f"Error processing Kajabi payment: {str(e)}", exc_info=True)


# ============================================================================
# KAJABI API POLLING ENDPOINT
# ============================================================================

@app.post("/kajabi/sync/purchases")
async def sync_kajabi_purchases(
    background_tasks: BackgroundTasks,
) -> dict[str, Any]:
    """
    Manually trigger Kajabi API polling to sync purchases.
    This can be called by a cron job or manually for testing.
    """
    background_tasks.add_task(poll_kajabi_purchases)
    return {
        "status": "polling_started",
        "message": "Kajabi API polling started in background",
    }


async def poll_kajabi_purchases() -> None:
    """
    Poll Kajabi API for recent purchases and sync to Supabase and Google Sheets.
    """
    try:
        logger.info("Starting Kajabi purchases poll...")

        kajabi = get_kajabi_client()
        supabase_client = get_supabase_client()
        sheets_client = get_google_sheets_client()
        spreadsheet_id = os.getenv("GOOGLE_SHEETS_SPREADSHEET_ID")

        # Fetch purchases from Kajabi API
        purchases = kajabi.get_purchases(limit=100, offset=0)
        logger.info(f"Fetched {len(purchases)} purchases from Kajabi")

        enrolled = 0
        for purchase in purchases:
            try:
                purchase_id = purchase.get("id")
                customer_id = purchase.get("customer_id")

                # Fetch full customer details
                customer_data = kajabi.sync_enrollment_from_kajabi(customer_id, purchase_id)

                # Check if already enrolled
                existing = supabase_client.table("enrollments").select("id").eq(
                    "kajabi_purchase_id", purchase_id
                ).execute()

                if existing.data:
                    logger.info(f"Purchase {purchase_id} already enrolled")
                    continue

                # Create enrollment record
                enrollment_data = {
                    "email": customer_data.get("email"),
                    "first_name": customer_data.get("first_name"),
                    "last_name": customer_data.get("last_name"),
                    "full_name": customer_data.get("full_name"),
                    "phone_number": customer_data.get("phone"),
                    "kajabi_customer_id": customer_id,
                    "kajabi_purchase_id": purchase_id,
                    "amount_minor": customer_data.get("amount"),  # in cents
                    "currency": customer_data.get("currency", "USD"),
                    "provider": "kajabi",
                    "status": "paid",
                    "paid_at": customer_data.get("created_at"),
                    "payment_reference": f"kajabi-{purchase_id}",
                }

                response = supabase_client.table("enrollments").insert(
                    enrollment_data
                ).execute()
                logger.info(f"Created enrollment for purchase {purchase_id}")

                # Record in Google Sheets
                if sheets_client and spreadsheet_id:
                    sheets_result = sheets_client.append_enrollment(
                        spreadsheet_id,
                        worksheet_name="Enrollments",
                        enrollment_data={
                            "email": customer_data.get("email"),
                            "full_name": customer_data.get("full_name"),
                            "phone": customer_data.get("phone"),
                            "amount": customer_data.get("amount"),
                            "currency": customer_data.get("currency", "USD"),
                            "status": "paid",
                            "payment_reference": f"kajabi-{purchase_id}",
                            "customer_id": customer_id,
                            "source": "kajabi",
                        },
                    )
                    logger.info(f"Recorded to Google Sheets: {sheets_result}")

                enrolled += 1

            except Exception as e:
                logger.error(f"Error processing purchase {purchase.get('id')}: {str(e)}")
                continue

        logger.info(f"Kajabi poll completed. Enrolled {enrolled} new students.")

    except Exception as e:
        logger.error(f"Error polling Kajabi API: {str(e)}", exc_info=True)


# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": "consulting-offer-bootcamp-api",
        "status": "online",
        "version": "0.2.0",
    }


@app.get("/health")
def health_check() -> dict[str, str | bool]:
    """Check service health and integration status."""
    health = {
        "status": "ok",
        "phase": "3",
        "supabase": False,
        "kajabi": False,
        "google_sheets": False,
    }

    # Check Supabase
    try:
        get_supabase_client()
        health["supabase"] = True
    except Exception as e:
        logger.warning(f"Supabase not available: {str(e)}")

    # Check Kajabi
    try:
        get_kajabi_client()
        health["kajabi"] = True
    except Exception as e:
        logger.warning(f"Kajabi not available: {str(e)}")

    # Check Google Sheets
    try:
        if get_google_sheets_client():
            health["google_sheets"] = True
    except Exception as e:
        logger.warning(f"Google Sheets not available: {str(e)}")

    return health