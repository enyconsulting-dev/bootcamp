# Quick Start: Kajabi Integration

## For Local Development

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Create `.env` File
Copy from `backend/.env.example` and fill in your credentials:
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. Test Webhook
```bash
curl -X POST http://localhost:8000/webhooks/kajabi \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "purchase.completed",
    "customer_id": "test_cust_123",
    "purchase_id": "test_purch_456",
    "email": "test@example.com",
    "full_name": "Test User",
    "phone": "+1234567890",
    "amount": 4700,
    "currency": "USD",
    "timestamp": "2026-08-31T10:30:00Z"
  }'
```

### 5. Test Polling
```bash
curl -X POST http://localhost:8000/kajabi/sync/purchases
```

### 6. Check Health
```bash
curl http://localhost:8000/health
```

---

## For Render Deployment

### 1. Set Environment Variables
In Render dashboard → Settings → Environment:
```
KAJABI_CLIENT_ID=your-id
KAJABI_CLIENT_SECRET=your-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
GOOGLE_SHEETS_CREDENTIALS={"type":"service_account",...}
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
```

### 2. Deploy
```bash
git add .
git commit -m "feat: Kajabi integration with webhooks and polling"
git push origin main
```

Render auto-deploys on push.

### 3. Run Migration
In Supabase SQL Editor, run `supabase/schema.sql` to add new columns.

### 4. Configure Kajabi Webhook
Kajabi Dashboard → Settings → Webhooks → Add Webhook
- URL: `https://your-render-backend.onrender.com/webhooks/kajabi`
- Events: `purchase.completed`, `purchase.created`
- Secret: (optional) use `KAJABI_WEBHOOK_SECRET`

### 5. Test
```bash
curl https://your-render-backend.onrender.com/health
```

Should return all integrations as `true`.

---

## File Structure

```
backend/
├── main.py                    # FastAPI app (updated v0.2.0)
├── kajabi_client.py           # Kajabi API client (NEW)
├── google_sheets.py           # Google Sheets integration (NEW)
├── requirements.txt           # Dependencies (updated)
├── KAJABI_SETUP.md           # Detailed setup guide (NEW)
├── IMPLEMENTATION.md          # Implementation summary (NEW)
└── .env.example               # Environment template

supabase/
└── schema.sql                 # Database schema (updated)

frontend/
├── src/app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── thank-you/page.tsx

vercel.json & package.json     # Frontend config
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/webhooks/kajabi` | POST | Receive Kajabi payment events |
| `/webhooks/paystack` | POST | Receive Paystack events forwarded by Pabbly |

Google Sheets routing:
- `Enrollments` remains the existing Kajabi enrollment worksheet.
- `Waitlist` remains the Page 1 waitlist worksheet.
- `Paystack Enrollments` receives verified Paystack paid enrollments.
| `/kajabi/sync/purchases` | POST | Manually trigger Kajabi polling |
| `/enrollments/deliver` | POST | Stripe/Paystack enrollment (existing) |
| `/health` | GET | Check integration status |
| `/` | GET | Service status |

---

## Environment Variables Quick Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `KAJABI_CLIENT_ID` | Yes | Kajabi OAuth client ID |
| `KAJABI_CLIENT_SECRET` | Yes | Kajabi OAuth client secret |
| `KAJABI_WEBHOOK_SECRET` | No | Webhook signature verification |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase auth key |
| `GOOGLE_SHEETS_CREDENTIALS` | No | Google service account JSON |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | No | Google Sheets sheet ID |
| `FRONTEND_ORIGINS` | Yes | CORS allowed origins |

---

## Troubleshooting

**"Module not found: kajabi_client"**
- Ensure `kajabi_client.py` is in `backend/` directory
- Run `pip install -r requirements.txt` again

**"Kajabi credentials not found"**
- Set `KAJABI_CLIENT_ID` and `KAJABI_CLIENT_SECRET`
- Verify values on Render Environment settings

**"Webhook signature verification failed"**
- Ensure `KAJABI_WEBHOOK_SECRET` matches Kajabi webhook secret
- Or remove if not using signature verification

**"Google Sheets not configured"**
- Ensure service account JSON is valid
- Verify Google Sheet is shared with service account email
- Check `GOOGLE_SHEETS_SPREADSHEET_ID` is correct

**Health returns false for integrations**
- Check env variables are set on Render
- Verify Supabase schema.sql was executed
- Ensure API keys are valid and not expired

---

## Logs

### View Render Logs
```bash
render logs --tail=100
```

### Common Log Messages
- `"Received Kajabi webhook"` → Webhook received successfully
- `"Processing Kajabi event"` → Backend processing event
- `"Stored payment event in Supabase"` → Database insert succeeded
- `"Recorded enrollment in Google Sheets"` → Sheet row added
- `"Starting Kajabi purchases poll"` → Polling started
- `"Kajabi poll completed. Enrolled X new students"` → Poll finished

---

## Support

For issues, check:
1. [KAJABI_SETUP.md](KAJABI_SETUP.md) - Complete setup guide
2. [IMPLEMENTATION.md](IMPLEMENTATION.md) - Architecture details
3. Render logs - Error messages
4. `.env` file - Missing/incorrect variables
