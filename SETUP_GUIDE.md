# Kajabi Integration - Practical Setup Guide

## ✅ What You Have vs. What's Required

### Already Configured ✅
- `KAJABI_CLIENT_ID`
- `KAJABI_CLIENT_SECRET`

### Core Requirements
- ✅ Kajabi OAuth (you have this!)
- ⏳ Supabase (check below)
- ⏳ Google Sheets (optional - for manual records)
- ⏳ Kajabi Webhook URL (optional - can test without it initially)

---

## 🚀 Quick Check: What Else Do You Need?

### 1. Supabase Setup (Required for Production)

**Do you have these environment variables set on Render?**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Check Status:**
```bash
# On Render, under Settings → Environment, look for these variables
# If they exist → You're ready for full integration
# If missing → We can work without them initially, but need them for production
```

### 2. Google Sheets (Totally Optional)
- Skip if you don't need Google Sheets recording
- Can add this later

### 3. Kajabi Webhook (Optional)
- Can test locally without configuring webhook in Kajabi
- Will need it for production real-time sync

---

## 📋 Setup Path Based on Your Config

### If You Have Supabase Configured ✅ (Most Likely)
**Path**: Full integration → Proceed with Step 1 below

### If You DON'T Have Supabase Yet ⏳
**Path**: Test locally first → Then add Supabase → Then deploy

---

## 🛠️ SETUP & TESTING (5 Steps)

### STEP 1: Local Development Setup

```bash
# Navigate to backend
cd c:\Users\Melody\Documents\bootcamp\backend

# Install dependencies (includes Kajabi, Supabase, Google Sheets)
pip install -r requirements.txt
```

### STEP 2: Create Local `.env` File

```bash
# In backend/ directory, create .env file with:
```

```env
# Kajabi (you have these ✅)
KAJABI_CLIENT_ID=your-value-from-render
KAJABI_CLIENT_SECRET=your-value-from-render
KAJABI_WEBHOOK_SECRET=  # Leave empty for now

# Supabase (check if you have these)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Sheets (optional - leave empty for now)
GOOGLE_SHEETS_CREDENTIALS=
GOOGLE_SHEETS_SPREADSHEET_ID=

# Frontend
FRONTEND_ORIGINS=http://localhost:3000
```

### STEP 3: Run Backend Locally

```bash
# In backend/ directory
uvicorn main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### STEP 4: Test Health Endpoint

Open a new PowerShell window and run:

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "phase": "3",
  "supabase": false,
  "kajabi": true,
  "google_sheets": false
}
```

**What This Means:**
- ✅ `kajabi: true` → Your Kajabi credentials are valid!
- ❌ `supabase: false` → You don't have Supabase configured yet (or credentials missing)
- ❌ `google_sheets: false` → Google Sheets not configured (optional anyway)

### STEP 5: Test Kajabi Webhook Endpoint

```bash
curl -X POST http://localhost:8000/webhooks/kajabi `
  -H "Content-Type: application/json" `
  -d '{
    "event_type": "purchase.completed",
    "customer_id": "test_customer_123",
    "purchase_id": "test_purchase_456",
    "email": "test@example.com",
    "full_name": "Test User",
    "phone": "+1234567890",
    "amount": 4700,
    "currency": "USD",
    "timestamp": "2026-09-01T10:30:00Z"
  }'
```

**Expected Response:**
```json
{
  "status": "received",
  "event_id": "test_purchase_456"
}
```

**Check Backend Console:**
You should see logs like:
```
INFO: Received Kajabi webhook: {...}
INFO: Processing Kajabi event: purchase.completed for customer test_customer_123
```

---

## 📝 What Happens Next (Based on Your Setup)

### Scenario A: You Have Supabase Configured ✅
```
POST /webhooks/kajabi
    ↓
✅ Stores in payment_events table
✅ Creates enrollment record
✅ Google Sheets (if configured, else skipped)
    ↓
All working end-to-end!
```

### Scenario B: Missing Supabase ⏳
```
POST /webhooks/kajabi
    ↓
Backend processes webhook
    ❌ Supabase step fails with error (logged)
    ❌ No enrollment created
    ✅ Google Sheets step would work (if configured)
```

**Solution**: Add Supabase credentials → No code changes needed

---

## 🔍 How to Check Your Supabase Setup

**Check if Supabase is already configured:**

1. **On Render Dashboard:**
   - Go to your service → Settings → Environment
   - Search for `SUPABASE_URL`
   - If it exists → You have it! Copy both:
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`

2. **If Supabase is missing:**
   - You'll need to:
     1. Create Supabase project
     2. Copy URL and service-role key
     3. Add to Render env vars
     4. Run `supabase/schema.sql` in Supabase SQL Editor

---

## ✅ Next Steps Based on Results

### After Running Tests:

#### If `kajabi: true` in health check:
- ✅ Kajabi integration is working!
- ❓ Check if `supabase: true`
  - **Yes** → Full integration ready, proceed to production deployment
  - **No** → Add Supabase, then deploy

#### If `kajabi: false` in health check:
- ❌ Kajabi credentials not working
- Check:
  - Are `KAJABI_CLIENT_ID` and `KAJABI_CLIENT_SECRET` correct in `.env`?
  - Did you copy them exactly as shown in Render?
  - Are there any extra spaces or quotes?

---

## 🚀 Production Deployment (After Local Testing)

Once local testing shows `kajabi: true`:

```bash
# Deploy to Render
git add .
git commit -m "feat: Kajabi integration with webhooks and polling"
git push origin main
```

Render auto-deploys. Then:

```bash
# Test production health
curl https://your-render-backend.onrender.com/health
```

Should show same result as local.

---

## 🎯 Recommended Path Forward

### Immediate (Today):
1. ✅ Install dependencies
2. ✅ Create local `.env` file with Kajabi credentials
3. ✅ Run backend locally
4. ✅ Test health endpoint
5. ✅ Test webhook endpoint

### Next (After Verification):
6. Check Supabase status (have it? or need to add?)
7. If needed: Add Supabase credentials to Render + run schema.sql
8. Deploy to Render
9. Verify production health endpoint

---

## 🆘 Troubleshooting

### "ModuleNotFoundError: No module named 'kajabi_client'"
```bash
# Make sure files exist in backend/:
# - kajabi_client.py
# - google_sheets.py
# 
# Then reinstall:
pip install -r requirements.txt
```

### "Health shows kajabi: false"
```bash
# Check your .env file:
# 1. KAJABI_CLIENT_ID value correct? (no extra spaces/quotes)
# 2. KAJABI_CLIENT_SECRET value correct?
# 3. File saved properly?
#
# Restart backend:
# Ctrl+C to stop, then run uvicorn again
```

### "Health shows supabase: false but I have credentials"
```bash
# Make sure you added to .env:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-key

# Then restart backend
```

### Webhook endpoint returns error
```bash
# Check backend console for detailed error
# Common causes:
# - Supabase credentials missing/wrong
# - Google Sheets credentials format invalid
# - Both are non-fatal, other parts still work
```

---

## 📞 Key Files for Reference

- `backend/main.py` → API endpoints
- `backend/kajabi_client.py` → Kajabi OAuth logic
- `backend/google_sheets.py` → Google Sheets logic
- `backend/.env.example` → All possible variables
- `backend/KAJABI_SETUP.md` → Detailed setup guide

---

## ✨ Summary

**You can definitely proceed!** 

With just `KAJABI_CLIENT_ID` and `KAJABI_CLIENT_SECRET`:
- ✅ Test locally immediately
- ✅ Kajabi API will work
- ✅ Webhooks endpoint works
- ⏳ Supabase integration (optional for testing, required for production)
- ⏳ Google Sheets (nice-to-have, fully optional)

**Let's verify:** After running the tests above, share the output of the health check and I can guide next steps!
