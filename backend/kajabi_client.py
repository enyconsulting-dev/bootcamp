"""
Kajabi API client for fetching customer, order, and purchase data.
Handles OAuth2 authentication and API interactions.
"""

import os
import json
import requests
from datetime import datetime, timezone
from typing import Optional, Any
from pydantic import BaseModel


class KajabiTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


class KajabiCustomer(BaseModel):
    id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    phone_number: Optional[str] = None


class KajabiOrder(BaseModel):
    id: str
    customer_id: str
    amount: float  # in cents/minor units
    currency: str
    status: str
    created_at: str
    updated_at: str


class KajabiPurchase(BaseModel):
    id: str
    customer_id: str
    order_id: str
    product_id: str
    amount: float  # in cents/minor units
    currency: str
    status: str
    created_at: str
    updated_at: str


class KajabiClient:
    """Kajabi API client with OAuth2 authentication."""

    BASE_URL = "https://api.kajabi.com/v1"
    TOKEN_URL = "https://oauth.kajabi.com/oauth/token"

    def __init__(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        self.client_id = client_id or os.getenv("KAJABI_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("KAJABI_CLIENT_SECRET")
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None

        if not self.client_id or not self.client_secret:
            raise ValueError("KAJABI_CLIENT_ID and KAJABI_CLIENT_SECRET are required")

    def _get_access_token(self) -> str:
        """Get or refresh the OAuth2 access token."""
        # Return cached token if still valid (with 5-min buffer)
        if self.access_token and self.token_expires_at:
            time_until_expiry = (
                self.token_expires_at - datetime.now(timezone.utc)
            ).total_seconds()
            if time_until_expiry > 300:  # 5 minutes buffer
                return self.access_token

        # Request new token
        payload = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }

        try:
            response = requests.post(self.TOKEN_URL, data=payload, timeout=10)
            response.raise_for_status()
            token_data = KajabiTokenResponse(**response.json())

            self.access_token = token_data.access_token
            self.token_expires_at = datetime.now(timezone.utc).replace(
                microsecond=0
            ) + __import__("datetime").timedelta(seconds=token_data.expires_in)

            return self.access_token
        except requests.RequestException as e:
            raise RuntimeError(f"Failed to obtain Kajabi access token: {str(e)}")

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[dict] = None,
        json_data: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Make an authenticated request to the Kajabi API."""
        token = self._get_access_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        url = f"{self.BASE_URL}{endpoint}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_data,
                timeout=15,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise RuntimeError(f"Kajabi API request failed: {str(e)}")

    def get_customers(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Fetch customers from Kajabi API."""
        params = {"limit": limit, "offset": offset}
        response = self._make_request("GET", "/customers", params=params)
        return response.get("data", [])

    def get_customer(self, customer_id: str) -> dict:
        """Fetch a single customer by ID."""
        response = self._make_request("GET", f"/customers/{customer_id}")
        return response.get("data", {})

    def get_orders(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Fetch orders from Kajabi API."""
        params = {"limit": limit, "offset": offset}
        response = self._make_request("GET", "/orders", params=params)
        return response.get("data", [])

    def get_order(self, order_id: str) -> dict:
        """Fetch a single order by ID."""
        response = self._make_request("GET", f"/orders/{order_id}")
        return response.get("data", {})

    def get_purchases(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Fetch purchases from Kajabi API."""
        params = {"limit": limit, "offset": offset}
        response = self._make_request("GET", "/purchases", params=params)
        return response.get("data", [])

    def get_purchase(self, purchase_id: str) -> dict:
        """Fetch a single purchase by ID."""
        response = self._make_request("GET", f"/purchases/{purchase_id}")
        return response.get("data", {})

    def get_transactions(self, limit: int = 100, offset: int = 0) -> list[dict]:
        """Fetch transactions from Kajabi API."""
        params = {"limit": limit, "offset": offset}
        response = self._make_request("GET", "/transactions", params=params)
        return response.get("data", [])

    def sync_enrollment_from_kajabi(self, customer_id: str, purchase_id: str) -> dict:
        """
        Fetch and combine customer and purchase data for enrollment.
        Returns a normalized enrollment record.
        """
        customer = self.get_customer(customer_id)
        purchase = self.get_purchase(purchase_id)

        # Extract phone number (might be in different fields)
        phone = customer.get("phone_number") or customer.get("phone")

        return {
            "customer_id": customer_id,
            "purchase_id": purchase_id,
            "email": customer.get("email"),
            "first_name": customer.get("first_name"),
            "last_name": customer.get("last_name"),
            "full_name": customer.get("full_name")
            or f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip(),
            "phone": phone,
            "amount": purchase.get("amount"),  # in cents
            "currency": purchase.get("currency"),
            "status": purchase.get("status"),
            "created_at": purchase.get("created_at"),
            "updated_at": purchase.get("updated_at"),
        }
