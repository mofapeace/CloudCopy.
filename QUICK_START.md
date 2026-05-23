# Quick Start - Test the Auth System

## Terminal 1: Start Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

Wait for: `INFO:     Uvicorn running on http://127.0.0.1:8000`

## Terminal 2: Start Frontend

```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

## Test in Browser

Visit: http://localhost:5173

### Test Client Google Login
1. Click "I'm a Client"
2. Click "Continue with Google"
3. Name: "Jane Doe"
4. Email: "jane@university.edu"
5. Click "Sign In with Google"
6. ✅ Should see welcome message with your name
7. Click "Logout" to return

### Test Client Phone OTP
1. Click "I'm a Client"
2. Click "Continue with Phone"
3. Phone: "237123456789" (any 9+ digits)
4. OTP: "123456" (any 6 digits)
5. Click "Verify OTP"
6. ✅ Should see welcome message
7. Click "Logout" to return

### Test Operator Signup
1. Click "I'm an Operator"
2. Click "Create New Shop Account"
3. Fill form:
   - Name: "James Smith"
   - Email: "james@shop.edu"
   - Password: "secure123"
   - Shop Name: "UB Main Campus Print"
   - Shop Location: "Block A, Ground Floor"
4. Click "Create Shop Account"
5. ✅ Should see dashboard with your shop name
6. Click "Logout" to return

### Test Operator Login
1. Click "I'm an Operator"
2. Click "Sign In"
3. Email: "james@shop.edu"
4. Password: "secure123"
5. Click "Sign In"
6. ✅ Should see dashboard
7. Click the "Shop Online/Offline" button to test
8. Click "Logout" to return

### Test Protected Routes
1. Login as Client
2. Try to access: `http://localhost:5173/operator/dashboard`
3. ✅ Should be redirected to `/`
4. Login as Operator
5. Try to access: `http://localhost:5173/client/home`
6. ✅ Should be redirected to `/`

### Test Token Persistence
1. Login as Client
2. Open DevTools (F12) → Application → localStorage
3. ✅ Should see `access_token` and `user` keys
4. Refresh page (F5)
5. ✅ Should stay logged in
6. Close all tabs and reopen browser
7. ✅ Should still be logged in
8. Click "Logout"
9. ✅ localStorage should be cleared

---

## Check API Docs

Backend Swagger UI: http://localhost:8000/docs

All auth endpoints are documented there with try-it-out functionality.

---

## Debugging

**Check Frontend Logs:**
Open DevTools (F12) → Console tab
Watch for login/logout events

**Check Backend Logs:**
Watch the terminal where uvicorn is running
Look for POST /auth/... requests

**Check Database:**
Backend creates `cloudcopy.db` file
Can inspect with: `sqlite3 cloudcopy.db`

---

**Everything working? You're done! 🎉**
