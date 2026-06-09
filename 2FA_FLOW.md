# 🔐 Cloudkopii 2FA In-App Flow — Complete Implementation

## Student Upload → 2FA Confirmation → Print Release

### Phase 1: Student Uploads Document

**Frontend: StudentUpload.jsx**
```
1. Student selects file + customizes (color, sides, copies)
2. Chooses shop from map (or selects specific for Pro)
3. Uploads to backend
```

**Backend: POST /api/upload**
- Calculates page count
- Checks `isPro` flag + `targetShopId`
- **Open PIN**: Queries all online shops → calculates min/max price range
- **Locked PIN**: Queries specific shop → calculates exact price
- Generates 4-digit PIN + bcrypt hash
- Stores in jobs table with:
  - `pin_mode: 'open'` or `'locked'`
  - `two_fa_code: null` (not generated yet)
  - `two_fa_verified: false`
  - `price_cfa: exact or average`

**Frontend: PinDisplay.jsx shows**
- ✅ PIN "7823"
- ✅ Price range (Open): "15 - 25 CFA" OR exact (Locked): "200 CFA"
- ✅ Shop info

---

### Phase 2: Student Walks to Shop + Operator Enters PIN

**Frontend: OperatorDashboard.jsx**
```
Operator sees empty PIN entry box
Operator asks student: "What's your PIN?"
Student: "7823"
Operator enters PIN → clicks Verify
```

**Backend: POST /api/pin/verify**
```
1. Fetch all pending jobs (filters by pin_mode)
2. Loop through jobs, bcrypt.compare(PIN) each one
3. When match found:
   a. Generate 6-digit 2FA code (e.g., "429856")
   b. Hash code: SHA256("429856") → "a1b2c3d4..."
   c. Store in job: two_fa_code = hashed_code, two_fa_verified = false
   d. Return to operator:
      {
        id: job_id,
        studentName: "Tabi",
        twoFACode: "429856",  ← ACTUAL CODE (in-app delivery!)
        twoFARequired: true,
        message: "Student must confirm..."
      }
```

**Frontend: OperatorDashboard.jsx**
```
✅ Receives response with twoFACode = "429856"
✅ Shows LARGE blue box: "📱 Send this code to the student"
✅ Displays code: "429856" in big monospace font
✅ Message: "Student must enter this code on their phone"
✅ "Release to Printer" button DISABLED
✅ Status: "⏳ Waiting for student confirmation..." (animated)
```

**UI to Student (Verbal Communication)**
```
🗣️ Operator: "Enter this code on your phone: 429856"
📱 Student: Opens app → sees TwoFactorModal
📱 Student: Types code → "429856"
📱 Student: Clicks "Confirm"
```

---

### Phase 3: Student Confirms 2FA in App

**Frontend: TwoFactorModal.jsx**
```
Shows 6 input fields: [0][0][0][0][0][0]
Student enters: 4-2-9-8-5-6
Button: "Confirm" (enabled once all 6 digits filled)
```

**Frontend: Calls POST /api/pin/confirm-2fa**
```
{
  jobId: "abc123-def456",
  twoFACode: "429856"
}
```

**Backend: POST /api/pin/confirm-2fa**
```
1. Fetch job by jobId
2. Get stored hash: job.two_fa_code = "a1b2c3d4..."
3. Hash input: SHA256("429856") = "a1b2c3d4..."
4. Compare hashes (must match!)
5. If match:
   - Update job:
     two_fa_verified = true
     two_fa_verified_at = NOW()
   - Return: { twoFAVerified: true }
6. If no match:
   - Return: { error: "Invalid code" }
```

**Frontend: TwoFactorModal.jsx**
```
✅ On success: Show "✓ Confirmed!"
✅ Animation: Button color changes
✅ Auto-close after 1 second
✅ Student phone: Code accepted
```

---

### Phase 4: Operator Releases to Printer

**Frontend: OperatorDashboard.jsx** (Backend Polling)
```
1. After 2FA submitted, operator dashboard polls:
   GET /api/job/:jobId
   
2. While polling:
   - If two_fa_verified = false: Button stays disabled, show "Waiting..."
   - If two_fa_verified = true: Button becomes enabled, show "PRINT" (green)
```

**Operator Action: Click "Release to Printer"**
```
Button changes: "Waiting for Student..." → "PRINT" (enabled)
Operator clicks: "PRINT"
```

**Frontend: Calls POST /api/pin/release**
```
{
  jobId: "abc123-def456"
}
```

**Backend: POST /api/pin/release**
```
1. Check: two_fa_verified = true ✓
2. Update job:
   status = 'printing'
3. Return: { message: 'Job released for printing' }
```

**Frontend: JobCard.jsx**
```
Button clicked → Job dismissed
Operator dashboard now empty (waiting for next PIN)
```

---

### Phase 5: Print Agent Polls Queue + Prints

**Print-Agent (Server PC):** Polls every 5 seconds
```
GET /api/queue/:shopId
```

**Backend: GET /api/queue/:shopId**
```
1. Fetch jobs where:
   - status = 'printing' ✓
   - two_fa_verified = true ✓
   - pin_mode = 'open' OR (pin_mode = 'locked' AND shop_id = shopId)
   
2. For each job:
   - Generate signed URL (5-min expiry) for file
   - Return job + fileUrl
```

**Print-Agent: Receives Job**
```
{
  id: job_id,
  fileUrl: "https://storage.../file.pdf?token=...",
  studentName: "Tabi",
  color: false,
  copies: 1,
  doubleSided: false
}
```

**Print-Agent: Downloads + Prints**
```
1. Download file from fileUrl
2. Send to printer with settings (B&W, 1-sided, 1 copy)
3. File prints!
```

**Print-Agent: Confirms Completion**
```
POST /api/queue/printed
{
  jobId: "abc123-def456"
}
```

**Backend: POST /api/queue/printed**
```
1. Update job:
   status = 'printed'
   printed_at = NOW()
2. Trigger auto-nuke: Delete file after 10 mins
```

---

## 🔄 Complete Flow Summary

```
📱 STUDENT                      🖨️ OPERATOR                    ☁️ BACKEND
├─ Upload file                  
│  └─ Get PIN + price range
│
├─ Walk to shop
│                              ├─ Student gives PIN
│                              ├─ Enter PIN: "7823"
│                              └─ Receive 2FA code: "429856"
│                                 (shown in big blue box)
│
├─ Receive code from operator
├─ Open app → TwoFactorModal
├─ Enter code: "429856"
├─ Click "Confirm"
├─ See "✓ Confirmed!"          ├─ Poll job status
│                              ├─ two_fa_verified = true ✓
│                              ├─ "PRINT" button enabled
│                              ├─ Click "PRINT"
│                              └─ Job → 'printing'
│
│                                 Print-Agent:
│                                 GET /api/queue/:shopId
│                                 Download file
│                                 Print!
│                                 POST /api/queue/printed
│                                 ↓
│                                 Auto-nuke: Delete file
│                                 after 10 mins
```

---

## 📊 Database State Changes

### Job Lifecycle

```
UPLOAD:
  status: 'pending'
  pin_mode: 'open' or 'locked'
  two_fa_code: null
  two_fa_verified: false

PIN VERIFY:
  two_fa_code: SHA256("429856")  ← Hashed, not plain!
  two_fa_verified: false (still)

2FA CONFIRM:
  two_fa_verified: true
  two_fa_verified_at: "2026-06-09T14:32:45Z"

RELEASE:
  status: 'printing'

PRINT COMPLETE:
  status: 'printed'
  printed_at: "2026-06-09T14:33:12Z"
  
CLEANUP (10 min later):
  file_path: 'deleted'
```

---

## 🔒 Security Features

✅ **No external services** — Code sent in-app only
✅ **2FA code hashed** — Never stored plaintext in DB
✅ **PIN hashed** — bcrypt
✅ **Presigned URLs** — 5-min expiry on file access
✅ **Auto-nuke** — Files deleted after printing
✅ **Locked PIN isolation** — Only specific shop sees Locked PIN jobs
✅ **Verbal confirmation** — Operator confirms name matches face

---

## 🚀 API Endpoints Summary

| Endpoint | Method | Call By | Payload | Returns |
|----------|--------|---------|---------|---------|
| `/api/upload` | POST | Student App | file, name, options, isPro, targetShopId | PIN, price range or exact |
| `/api/pin/verify` | POST | Operator | PIN, shopId | Job details + **2FA code** |
| `/api/pin/confirm-2fa` | POST | Student App | jobId, 2FA code | { twoFAVerified: true } |
| `/api/pin/release` | POST | Operator | jobId | { message: 'Job released' } |
| `/api/job/:jobId` | GET | Operator (polling) | - | Job status + twoFAVerified flag |
| `/api/queue/:shopId` | GET | Print-Agent | - | Jobs ready to print |
| `/api/queue/printed` | POST | Print-Agent | jobId | { message: 'Marked as printed' } |

