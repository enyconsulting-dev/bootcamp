# Kajabi Integration Guide

## Overview

This backend now integrates with Kajabi in two ways:

1. **Webhook Integration**: Kajabi sends payment notifications directly to your backend
2. **API Polling**: Backend polls Kajabi's API to sync enrollments periodically

Both methods record enrollments to:
- **Supabase** (`enrollments` table)
- **Google Sheets** (for manual record-keeping)

---

## Setup Instructions

### 1. Kajabi OAuth Configuration

#### Get OAuth Credentials
1. Log in to Kajabi dashboard
2. Go to **Settings** → **Integrations** → **API**
3. Click **Create OAuth App** (or find existing app)
4. Copy:
   - `Client ID`
   - `Client Secret`

#### Set Environment Variables (Render)
In Render dashboard, add these variables:
```
KAJABI_CLIENT_ID=your-client-id
KAJABI_CLIENT_SECRET=your-client-secret
KAJABI_WEBHOOK_SECRET=your-webhook-secret  # (optional, for signature verification)
```

#### Set Environment Variables (Local Development)
Create `backend/.env`:
```
KAJABI_CLIENT_ID=your-client-id
KAJABI_CLIENT_SECRET=your-client-secret
KAJABI_WEBHOOK_SECRET=your-webhook-secret
```

---

### 2. Configure Kajabi Webhook (Secondary)

**Note**: Keep your existing Stripe webhook in Kajabi. This adds a *secondary* webhook to your backend.

#### Add Webhook in Kajabi
1. Kajabi Dashboard → **Settings** → **Webhooks**
2. Click **Add Webhook**
3. Set **URL** to:
   ```
   https://your-render-backend.com/webhooks/kajabi
   ```
   (Replace with your actual Render backend URL)

4. Set **Events** to subscribe to:
   - `purchase.completed` (when payment succeeds)
   - `purchase.created` (when purchase initiated)

5. (Optional) Set **Secret** for webhook signature verification
   - Copy this value to `KAJABI_WEBHOOK_SECRET` env var

6. Click **Create Webhook**

#### What Happens
When a Kajabi purchase completes:
1. Kajabi sends webhook → Your `/webhooks/kajabi` endpoint
2. Backend stores event in Supabase `payment_events` table
3. Backend creates/updates enrollment record in Supabase `enrollments` table
4. Backend appends row to Google Sheets (if configured)

---

### 3. Supabase Configuration

#### Run Schema Update
1. Open Supabase dashboard → **SQL Editor**
2. Run `supabase/schema.sql` (copy entire file)
3. This creates/updates tables with new Kajabi-specific columns

#### Set Environment Variables
In Render, add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### 4. Google Sheets Configuration (Optional)

#### Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project (or use existing)
3. Enable **Google Sheets API** and **Google Drive API**
4. Go to **Service Accounts** → **Create Service Account**
5. Create key (JSON format) → Download JSON file
6. Copy service account email: `service-account@project.iam.gserviceaccount.com`

#### Share Google Sheet
1. Create a Google Sheet for enrollment records
2. Click **Share** → Paste service account email → Grant **Editor** access
3. Copy sheet ID from URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`

#### Set Environment Variables
In Render, add:
```
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

**For local development**, use file path:
```
GOOGLE_SHEETS_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
```

---

## API Endpoints

### Webhook Endpoint
```
POST /webhooks/kajabi
```
Kajabi sends payment events here automatically.

**Request body** (example):
```json
{
  "event_type": "purchase.completed",
  "customer_id": "kajabi_customer_123",
  "purchase_id": "kajabi_purchase_456",
  "email": "student@example.com",
  "full_name": "John Doe",
  "phone": "+1234567890",
  "amount": 4700,
  "currency": "USD",
  "timestamp": "2026-08-31T10:30:00Z"
}
```

**Response**:
```json
{
  "status": "received",
  "event_id": "kajabi_purchase_456"
}
```

---

### Manual Polling Endpoint
```
POST /kajabi/sync/purchases
```
Manually trigger API polling to sync recent purchases.

**Use cases**:
- Testing integration
- Backfill missed enrollments
- Scheduled cron job

**Response**:
```json
{
  "status": "polling_started",
  "message": "Kajabi API polling started in background"
}
```

Processing happens asynchronously. Check logs for results.

---

### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "phase": "3",
  "supabase": true,
  "kajabi": true,
  "google_sheets": true
}
```

---

## Data Flow

### Flow 1: Webhook (Real-time)
```
Student pays on Kajabi
    ↓
Kajabi API calls /webhooks/kajabi
    ↓
Backend validates & processes
    ↓
Supabase: payment_events + enrollments updated
    ↓
Google Sheets: Row appended
    ↓
Next: Email, community, starter kit delivery (Phase 5)
```

### Flow 2: Polling (Periodic Sync)
```
POST /kajabi/sync/purchases triggered
    ↓
Backend calls Kajabi API (/purchases endpoint)
    ↓
For each new purchase:
  - Fetch full customer details
  - Check if already in Supabase
  - Create enrollment record
  - Append to Google Sheets
    ↓
Logs show # of new enrollments synced
```

---

## Database Schema Updates

New columns added to `enrollments` table:
- `first_name` (text)
- `last_name` (text)
- `full_name` (text)
- `phone_number` (text)
- `kajabi_customer_id` (text) - Links to Kajabi customer
- `kajabi_purchase_id` (text) - Links to Kajabi purchase

Payment provider enum now includes: `'kajabi'`

---

## Troubleshooting

### "Kajabi API request failed"
- Verify `KAJABI_CLIENT_ID` and `KAJABI_CLIENT_SECRET` are correct
- Check Kajabi OAuth app exists and is active

### "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
- Both env vars missing on Render
- Run `supabase/schema.sql` in Supabase SQL Editor

### Webhook not being called
- Verify webhook URL is correct and accessible
- Check Kajabi webhook settings → Test Webhook button
- Look at Render logs for incoming requests

### Google Sheets integration not working
- Service account email may not have sheet permission
- Try sharing sheet with service account email again
- Verify `GOOGLE_SHEETS_SPREADSHEET_ID` is correct

---

## Testing

### Test Kajabi Webhook
```bash
curl -X POST http://localhost:8000/webhooks/kajabi \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "purchase.completed",
    "customer_id": "test_customer_123",
    "purchase_id": "test_purchase_456",
    "email": "test@example.com",
    "full_name": "Test User",
    "phone": "+1234567890",
    "amount": 4700,
    "currency": "USD",
    "timestamp": "2026-08-31T10:30:00Z"
  }'
```

### Test Polling
```bash
curl -X POST http://localhost:8000/kajabi/sync/purchases
```

### Check Health
```bash
curl http://localhost:8000/health
```

---

## Environment Checklist

- [ ] `KAJABI_CLIENT_ID` set on Render
- [ ] `KAJABI_CLIENT_SECRET` set on Render
- [ ] Kajabi OAuth app created and active
- [ ] Kajabi webhook configured to `/webhooks/kajabi`
- [ ] `SUPABASE_URL` set on Render
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set on Render
- [ ] `supabase/schema.sql` executed in Supabase
- [ ] `GOOGLE_SHEETS_CREDENTIALS` set (if using sheets)
- [ ] `GOOGLE_SHEETS_SPREADSHEET_ID` set (if using sheets)
- [ ] Service account shared on Google Sheet
- [ ] `FRONTEND_ORIGINS` updated with Vercel domain

---

## Next Steps

1. **Phase 4**: Webhook integration (you are here)
2. **Phase 5**: Enrollment delivery system (email, community, starter kit)
3. **Phase 6**: Production verification & launch
