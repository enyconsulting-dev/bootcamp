# Webhook Testing - PowerShell Fixes

## ❌ What Went Wrong

PowerShell's `curl` is **not** the same as Unix `curl`. It's actually `Invoke-WebRequest`, which has different flags:
- ❌ `-d` flag doesn't exist in PowerShell curl
- ❌ The backticks (`) broke line continuation

---

## ✅ SOLUTION 1: Use Proper PowerShell Syntax (Recommended)

### Easy One-Liner

```powershell
$body = '{"event_type":"purchase.completed","customer_id":"test_customer_123","purchase_id":"test_purchase_456","email":"obed@example.com","full_name":"Test User","phone":"+1234567890","amount":4700,"currency":"USD","timestamp":"2026-09-01T10:30:00Z"}'

Invoke-WebRequest -Uri "https://bootcamp-hh2h.onrender.com/webhooks/kajabi" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

### Multi-Line (Cleaner)

```powershell
$body = @{
    event_type = "purchase.completed"
    customer_id = "test_customer_123"
    purchase_id = "test_purchase_456"
    email = "obed@example.com"
    full_name = "Test User"
    phone = "+1234567890"
    amount = 4700
    currency = "USD"
    timestamp = "2026-09-01T10:30:00Z"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://bootcamp-hh2h.onrender.com/webhooks/kajabi" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

---

## ✅ SOLUTION 2: Use Real curl.exe (From Git Bash)

If you have Git installed, you can use the real `curl.exe`:

```powershell
curl.exe -X POST https://bootcamp-hh2h.onrender.com/webhooks/kajabi `
  -H "Content-Type: application/json" `
  -d '{
    "event_type": "purchase.completed",
    "customer_id": "test_customer_123",
    "purchase_id": "test_purchase_456",
    "email": "obed@example.com",
    "full_name": "Test User",
    "phone": "+1234567890",
    "amount": 4700,
    "currency": "USD",
    "timestamp": "2026-09-01T10:30:00Z"
  }'
```

Note the `.exe` — this forces PowerShell to use the real curl instead of the alias.

---

## 🎯 RECOMMENDED: Copy-Paste Ready

### Test 1: Simple PowerShell Version (Copy This Entire Block)

```powershell
$json = @"
{
  "event_type": "purchase.completed",
  "customer_id": "test_customer_123",
  "purchase_id": "test_purchase_456",
  "email": "obed@example.com",
  "full_name": "Test User",
  "phone": "+1234567890",
  "amount": 4700,
  "currency": "USD",
  "timestamp": "2026-09-01T10:30:00Z"
}
"@

Invoke-WebRequest -Uri "https://bootcamp-hh2h.onrender.com/webhooks/kajabi" `
  -Method POST `
  -ContentType "application/json" `
  -Body $json
```

**Just paste this entire thing into PowerShell and hit Enter.**

### Test 2: Real curl.exe (Copy This Entire Block)

```powershell
curl.exe -X POST https://bootcamp-hh2h.onrender.com/webhooks/kajabi `
  -H "Content-Type: application/json" `
  -d '{
    "event_type": "purchase.completed",
    "customer_id": "test_customer_123",
    "purchase_id": "test_purchase_456",
    "email": "obed@example.com",
    "full_name": "Test User",
    "phone": "+1234567890",
    "amount": 4700,
    "currency": "USD",
    "timestamp": "2026-09-01T10:30:00Z"
  }'
```

**Try this one if you have Git installed (most developers do).**

---

## ✅ EXPECTED SUCCESS RESPONSE

Both should return:

```json
{
  "status": "received",
  "event_id": "test_purchase_456"
}
```

---

## 🔍 What to Look For

### ✅ Success Indicators
- Response shows: `"status": "received"`
- HTTP Status: `200 OK`
- Event ID matches: `"test_purchase_456"`

### ❌ Common Errors & Fixes

**Error: "404 Not Found"**
- Check URL is exactly: `https://bootcamp-hh2h.onrender.com/webhooks/kajabi`
- Wait a few seconds (Render might be spinning up)

**Error: "502 Bad Gateway"**
- Render service restarting
- Wait 30 seconds and retry

**Error: JSON parsing error**
- Make sure JSON is valid (no extra commas, quotes)
- Use the copy-paste versions above

---

## 📝 After Success

Once you get `"status": "received"`, check your **Render logs**:

1. Go to Render Dashboard
2. Select your service
3. Click "Logs"
4. Look for:
   ```
   INFO: Received Kajabi webhook: {...}
   INFO: Processing Kajabi event: purchase.completed for customer test_customer_123
   ```

This confirms the webhook was processed!

---

## 🚀 Try Now!

**Copy one of the solutions above, paste into PowerShell, and run.**

Let me know what response you get (should be the `"status": "received"` JSON).
