"""
Google Sheets integration for recording enrollment payments.
"""

import os
import json
import base64
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime, timezone
from typing import Optional, Any


class GoogleSheetsClient:
    """Client for appending enrollment records to Google Sheets."""

    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive",
    ]

    def __init__(self, credentials_json: Optional[str] = None):
        """
        Initialize Google Sheets client with service account credentials.

        Args:
            credentials_json: Path to service account JSON file or JSON string.
                             If None, tries to load from GOOGLE_SHEETS_CREDENTIALS env var.
        """
        creds_source = credentials_json or os.getenv("GOOGLE_SHEETS_CREDENTIALS")

        if not creds_source:
            raise ValueError(
                "Google Sheets credentials required. Set GOOGLE_SHEETS_CREDENTIALS env var "
                "or pass credentials_json parameter."
            )

        # Accept raw JSON, base64-encoded JSON, or a local JSON file path.
        try:
            if creds_source.lstrip().startswith("{"):
                creds_dict = json.loads(creds_source)
            else:
                try:
                    decoded_credentials = base64.b64decode(
                        "".join(creds_source.split()), validate=True
                    ).decode("utf-8")
                    creds_dict = json.loads(decoded_credentials)
                except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
                    with open(creds_source, "r", encoding="utf-8") as credentials_file:
                        creds_dict = json.load(credentials_file)
        except (OSError, json.JSONDecodeError, TypeError, ValueError) as e:
            raise ValueError(f"Failed to load Google Sheets credentials: {str(e)}")

        self.credentials = Credentials.from_service_account_info(
            creds_dict, scopes=self.SCOPES
        )
        self.client = gspread.authorize(self.credentials)

    def append_enrollment(
        self,
        spreadsheet_id_or_url: str,
        worksheet_name: str = "Enrollments",
        enrollment_data: Optional[dict] = None,
        **kwargs,
    ) -> dict[str, Any]:
        """
        Append an enrollment record to Google Sheets.

        Args:
            spreadsheet_id_or_url: Google Sheets spreadsheet ID or URL
            worksheet_name: Name of the worksheet/tab to append to
            enrollment_data: Dictionary of enrollment data or use kwargs
            **kwargs: Individual fields (email, full_name, phone, amount, currency, etc.)

        Returns:
            Append result from Google Sheets API
        """
        try:
            # Open the spreadsheet
            if "docs.google.com" in spreadsheet_id_or_url:
                # Extract ID from URL
                spreadsheet_id = spreadsheet_id_or_url.split("/d/")[1].split("/")[0]
            else:
                spreadsheet_id = spreadsheet_id_or_url

            spreadsheet = self.client.open_by_key(spreadsheet_id)

            # Get or create worksheet
            try:
                worksheet = spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                # Create worksheet if it doesn't exist
                worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1, cols=10)
                # Add header row
                headers = [
                    "Timestamp",
                    "Email",
                    "Full Name",
                    "Phone",
                    "Amount",
                    "Currency",
                    "Status",
                    "Payment Reference",
                    "Source",
                    "Customer ID",
                ]
                worksheet.append_row(headers)

            # Prepare row data
            data = enrollment_data or kwargs
            row = [
                datetime.now(timezone.utc).isoformat(),
                data.get("email", ""),
                data.get("full_name", ""),
                data.get("phone", ""),
                data.get("amount", ""),
                data.get("currency", ""),
                data.get("status", ""),
                data.get("payment_reference", ""),
                data.get("source", "kajabi"),
                data.get("customer_id", ""),
            ]

            # Append row to worksheet and retain Google's append response.
            append_response = worksheet.append_row(
                row,
                value_input_option="USER_ENTERED",
                insert_data_option="INSERT_ROWS",
            )
            row_count = len(worksheet.get_all_values())

            return {
                "status": "success",
                "spreadsheet_id": spreadsheet_id,
                "spreadsheet_title": spreadsheet.title,
                "worksheet": worksheet_name,
                "worksheet_id": worksheet.id,
                "row_count": row_count,
                "updated_range": append_response.get("updates", {}).get(
                    "updatedRange", "unknown"
                ),
                "timestamp": row[0],
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "spreadsheet_id": spreadsheet_id_or_url,
            }

    def append_waitlist_lead(
        self,
        spreadsheet_id_or_url: str,
        worksheet_name: str = "Waitlist",
        lead_data: Optional[dict] = None,
        **kwargs,
    ) -> dict[str, Any]:
        """Append a waitlist lead to its own worksheet in the shared spreadsheet."""
        try:
            spreadsheet_id = (
                spreadsheet_id_or_url.split("/d/")[1].split("/")[0]
                if "docs.google.com" in spreadsheet_id_or_url
                else spreadsheet_id_or_url
            )
            spreadsheet = self.client.open_by_key(spreadsheet_id)
            try:
                worksheet = spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1, cols=9)
                worksheet.append_row([
                    "Timestamp", "First Name", "Last Name", "Email", "Country",
                    "Phone (WhatsApp)", "Status", "Source", "Lead ID",
                ])

            data = lead_data or kwargs
            row = [
                datetime.now(timezone.utc).isoformat(),
                data.get("first_name", ""),
                data.get("last_name", ""),
                data.get("email", ""),
                data.get("country", ""),
                data.get("phone", ""),
                data.get("status", "waitlist"),
                data.get("source", "page-1-waitlist"),
                data.get("lead_id", ""),
            ]
            append_response = worksheet.append_row(
                row, value_input_option="USER_ENTERED", insert_data_option="INSERT_ROWS"
            )
            return {
                "status": "success",
                "spreadsheet_id": spreadsheet_id,
                "worksheet": worksheet_name,
                "updated_range": append_response.get("updates", {}).get("updatedRange", "unknown"),
                "timestamp": row[0],
            }
        except Exception as e:
            return {"status": "error", "error": str(e), "spreadsheet_id": spreadsheet_id_or_url}

    def batch_append_enrollments(
        self,
        spreadsheet_id_or_url: str,
        worksheet_name: str = "Enrollments",
        enrollments: Optional[list[dict]] = None,
    ) -> dict[str, Any]:
        """
        Append multiple enrollment records to Google Sheets.

        Args:
            spreadsheet_id_or_url: Google Sheets spreadsheet ID or URL
            worksheet_name: Name of the worksheet/tab to append to
            enrollments: List of enrollment dictionaries

        Returns:
            Batch append result
        """
        if not enrollments:
            return {"status": "error", "error": "No enrollments provided"}

        try:
            # Open the spreadsheet
            if "docs.google.com" in spreadsheet_id_or_url:
                spreadsheet_id = spreadsheet_id_or_url.split("/d/")[1].split("/")[0]
            else:
                spreadsheet_id = spreadsheet_id_or_url

            spreadsheet = self.client.open_by_key(spreadsheet_id)

            # Get or create worksheet
            try:
                worksheet = spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                worksheet = spreadsheet.add_worksheet(title=worksheet_name, rows=1, cols=10)
                headers = [
                    "Timestamp",
                    "Email",
                    "Full Name",
                    "Phone",
                    "Amount",
                    "Currency",
                    "Status",
                    "Payment Reference",
                    "Source",
                    "Customer ID",
                ]
                worksheet.append_row(headers)

            # Prepare rows
            rows = []
            for data in enrollments:
                row = [
                    datetime.now(timezone.utc).isoformat(),
                    data.get("email", ""),
                    data.get("full_name", ""),
                    data.get("phone", ""),
                    data.get("amount", ""),
                    data.get("currency", ""),
                    data.get("status", ""),
                    data.get("payment_reference", ""),
                    data.get("source", "kajabi"),
                    data.get("customer_id", ""),
                ]
                rows.append(row)

            # Batch append rows
            worksheet.append_rows(rows)

            return {
                "status": "success",
                "spreadsheet_id": spreadsheet_id,
                "worksheet": worksheet_name,
                "records_added": len(rows),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "spreadsheet_id": spreadsheet_id_or_url,
            }
