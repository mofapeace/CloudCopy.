# Cloudkopii Authentication System

## Overview

Cloudkopii implements a **role-based authentication system** with two distinct user types:

- **Clients** (formerly "Students") — Upload documents, pay at counter
- **Operators** — Manage print shop queue

Both roles use industry-standard security:
- **Clients**: Google Sign-In + Phone OTP (no passwords)
- **Operators**: Email + bcrypt password hashing
- **JWT Tokens**: 7-day session persistence
- **Protected Routes**: Role-based access control on frontend

---

## 🎯 Authentication Flow

### Client Registration & Login

```
┌─────────────────────────────────────────────────┐
│  1. User lands on RoleSelector                  │
│     Chooses "I'm a Client"                      │
└──────────────┬──────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────┐
│  2. ClientAuth page presents options:           │
│     • Continue with Google                      │
│     • Continue with Phone OTP                   │
└──────────────┬──────────────────────────────────┘
               ├─────────────────────┬─────────────────────┐
               ↓                     ↓                     ↓
    ┌──────────────────┐   ┌──────────────────┐  (returns role)
    │ GOOGLE PATH      │   │ PHONE PATH       │
    ├──────────────────┤   ├──────────────────┤
    │ 1. Enter name    │   │ 1. Enter phone   │
    │ 2. Enter email   │   │ 2. Enter OTP     │
    │ 3. Sign in       │   │ 3. Verify OTP    │
    └──────────────────┘   └──────────────────┘
               ↓                     ↓
    ┌─────────────────────────────────────────┐
    │  POST /auth/google or /auth/phone        │
    │  Returns: access_token + user role      │
    └──────────────────┬──────────────────────┘
                       ↓
    ┌─────────────────────────────────────────┐
    │  Saved to localStorage:                  │
    │  • access_token                          │
    │  • user (name, role, phone/email)        │
    └──────────────────┬──────────────────────┘
                       ↓
    ┌─────────────────────────────────────────┐
    │  Redirect to /client/home                │
    │  (Protected by ProtectedRoute)           │
    └─────────────────────────────────────────┘
```

### Operator Registration & Login

```
┌──────────────────────────────────────────────────┐
│  1. User lands on RoleSelector                   │
│     Chooses "I'm an Operator"                    │
└──────────────┬─────────────────────────────────┘
               ↓
┌──────────────────────────────────────────────────┐
│  2. OperatorAuth page presents options:          │
│     • Sign In (existing account)                 │
│     • Create New Shop Account (signup)           │
└──────────────┬─────────────────────┬─────────────┘
               │                     │
               ↓ LOGIN               ↓ SIGNUP
    ┌─────────────────────┐  ┌──────────────────┐
    │ EMAIL + PASSWORD    │  │ SHOP REGISTRATION│
    ├─────────────────────┤  ├──────────────────┤
    │ POST /auth/login    │  │ Name             │
    └──────────────────┬──┘  │ Email            │
                       │     │ Password         │
                       │     │ Shop Name        │
                       │     │ Shop Location    │
                       │     ├──────────────────┤
                       │     │ POST             │
                       │     │ /auth/register/op│
                       │     └──────────────────┘
                       ↓              ↓
    ┌─────────────────────────────────────────┐
    │  Returns: access_token + user role      │
    │  Creates User + Shop in one transaction │
    └──────────────────┬──────────────────────┘
                       ↓
    ┌─────────────────────────────────────────┐
    │  Saved to localStorage                   │
    │  Redirect to /operator/dashboard         │
    │  (Protected by ProtectedRoute)           │
    └─────────────────────────────────────────┘
```

---

## 📁 File Structure

### Frontend Auth System

```
frontend/src/
├── context/
│   └── AuthContext.jsx           # Global auth state management
├── components/
│   └── ProtectedRoute.jsx        # Role-based route protection
└── pages/
    ├── RoleSelector.jsx          # Landing page (Choose role)
    ├── ClientAuth.jsx            # Client login (Google + Phone)
    ├── ClientHome.jsx            # Client dashboard (Protected)
    ├── OperatorAuth.jsx          # Operator login/signup
    └── OperatorDashboard.jsx     # Operator dashboard (Protected)
```

### Backend Auth System

```
backend/
├── main.py                      # API endpoints
│   ├── /auth/register/operator  # Operator signup
│   ├── /auth/login              # Operator login
│   ├── /auth/google             # Client Google login
│   └── /auth/phone              # Client Phone OTP login
├── security.py                  # JWT + bcrypt utilities
├── models.py                    # User/Shop/Job/Review ORM
└── schemas.py                   # Request/Response validation
```

---

## 🔑 API Endpoints

### Client Authentication

#### POST `/auth/google`
Authenticate a client via Google Sign-In.

**Request:**
```json
{
  "google_token": "mock_token_or_real_id_token",
  "name": "John Doe",
  "email": "john@university.edu"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "client",
  "name": "John Doe"
}
```

**Notes:**
- If email exists, returns existing user token
- If email is new, creates new user automatically
- In production, validate `google_token` with Google's API

#### POST `/auth/phone`
Authenticate a client via Phone OTP.

**Request:**
```json
{
  "phone": "237123456789",
  "otp": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "client",
  "name": null
}
```

**Notes:**
- If phone exists, returns existing user token
- If phone is new, creates new user automatically
- In production, send OTP via Twilio/Africa's Talking

### Operator Authentication

#### POST `/auth/register/operator`
Register a new operator and their print shop (one transaction).

**Request:**
```json
{
  "name": "John Doe",
  "email": "shop@university.edu",
  "password": "secure_password",
  "shop_name": "UB Main Campus Print Shop",
  "shop_location": "Near IT Center"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "operator",
  "name": "John Doe"
}
```

**Errors:**
- `400` — Email already registered
- `400` — Password validation failed

#### POST `/auth/login`
Login an operator with email + password.

**Request:**
```json
{
  "email": "shop@university.edu",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "operator",
  "name": "John Doe"
}
```

**Errors:**
- `401` — Incorrect email or password

---

## 🔐 Token Management

### Frontend (AuthContext.jsx)

The `AuthContext` handles all token management:

```javascript
// Login (automatically saves token)
login(token, user);

// Logout (clears token from localStorage)
logout();

// Check if authenticated
const { isLoggedIn } = useAuth();

// Get current user info
const { user } = useAuth();

// Access token for API calls
const { token } = useAuth();
```

### Token Structure

**JWT Payload:**
```json
{
  "sub": "user_id",        // User ID (for database lookup)
  "role": "client",        // "client" or "operator"
  "exp": 1234567890,       // Expiration (7 days)
  "iat": 1234567890        // Issued at
}
```

### Token Expiration

**Default:** 7 days (604,800 minutes)
**Configurable via:** `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable

When token expires:
1. User is redirected to role selector
2. Must login again
3. New token is issued

---

## 🛡️ Protected Routes

### ProtectedRoute Component

Wraps sensitive pages to enforce authentication + role checks.

**Usage:**
```jsx
<Route
  path="/client/home"
  element={
    <ProtectedRoute requiredRole="client">
      <ClientHome />
    </ProtectedRoute>
  }
/>
```

**Behavior:**
- If `isLoggedIn = false` → Redirect to `/`
- If `requiredRole` doesn't match user's role → Redirect to `/`
- Loading state shown while checking auth

---

## 💾 Data Persistence

### localStorage (Browser)

Tokens and user info persisted on page reload:

```javascript
localStorage.setItem('access_token', token);
localStorage.setItem('user', JSON.stringify({
  role: "client",
  name: "John Doe",
  phone: "237123456789"
}));
```

### Database (Backend)

User credentials and shop details stored in SQLite/PostgreSQL:

```
users table:
  id, email, phone, name, role, hashed_password, provider, is_active, created_at

shops table:
  id, name, location, operator_id, is_online, created_at
```

**Password Hashing:**
- Uses bcrypt with automatic salt generation
- Never stores plain text passwords
- Verification happens during login

---

## 🧪 Testing the Auth System

### 1. Start Both Servers

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

In another terminal:
```bash
cd frontend
npm run dev
```

### 2. Test Client Flow

1. Open http://localhost:5173
2. Click "I'm a Client"
3. Choose login method (Google or Phone)
4. Fill in details
5. Submit → Redirects to `/client/home`

**Test Phone OTP:**
- Any 9+ digit phone works
- Any 6-digit OTP works

### 3. Test Operator Flow

1. Go back to http://localhost:5173
2. Click "I'm an Operator"
3. Click "Create New Shop Account"
4. Fill in all fields (password ≥ 6 chars)
5. Submit → Creates user + shop, redirects to `/operator/dashboard`

**Test Login:**
1. On OperatorAuth, click "Sign In"
2. Enter email + password from signup
3. Submit → Redirects to dashboard

### 4. Test Protected Routes

1. Login as client → Go to `/operator/dashboard` → Redirected to `/`
2. Logout (button in navbar) → Try accessing `/client/home` → Redirected to `/`

---

## 🚀 Deployment Checklist

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com
```

### Backend (.env)
```env
APP_ENV=production
SECRET_KEY=generate_a_random_secret_key_here
DATABASE_URL=postgresql://user:pass@db-host:5432/cloudkopii
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Google Sign-In (Production)
- Register app at Google Cloud Console
- Get OAuth 2.0 Client ID
- Add frontend URL to authorized redirect URIs
- Implement real token verification in `/auth/google`

### Phone OTP (Production)
- Set up Twilio or Africa's Talking account
- Send real OTP codes in `/auth/phone`
- Implement OTP verification logic

---

## 🔄 API Request Examples

### Make Authenticated Requests

All protected endpoints require the `Authorization` header:

```javascript
const response = await fetch('http://localhost:8000/jobs/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`  // Token from localStorage
  },
  body: JSON.stringify({
    shop_id: 1,
    file_path: '/static/file.pdf',
    pages: 10,
    copies: 1,
    is_color: false
  })
});
```

### Frontend Helper (Auto Token Injection)

```javascript
// In ClientHome.jsx or OperatorDashboard.jsx
const { token } = useAuth();

const api = async (endpoint, options = {}) => {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};
```

---

## 🐛 Troubleshooting

### Token Not Persisting

**Problem:** After refresh, user is logged out
**Solution:** 
- Check browser console for localStorage errors
- Verify `AuthContext.useEffect` is running
- Clear localStorage and login again

### "Unauthorized" Error on Protected Routes

**Problem:** 401 status from backend
**Solution:**
- Verify token is being sent in Authorization header
- Check token expiration (7 days from login)
- Logout and login again to get fresh token

### CORS Errors

**Problem:** `Access-Control-Allow-Origin` error
**Solution:**
- Backend has `allow_origins=["*"]` in CORS middleware
- Verify frontend API_URL matches backend address
- Check browser console for full error details

### Role Mismatch Redirect

**Problem:** Redirected to `/` after login
**Solution:**
- Verify user role in localStorage matches path
- Client should be at `/client/home`, operator at `/operator/dashboard`
- Clear localStorage and try again

---

## 📝 Security Best Practices

✅ **Implemented:**
- Passwords hashed with bcrypt
- JWT tokens with expiration
- Role-based access control
- Secure token storage in localStorage
- CORS protection

⚠️ **Production Recommendations:**
- Use HTTPS only (tokens in URL are vulnerable)
- Implement token refresh mechanism
- Add rate limiting to auth endpoints
- Use secure cookies instead of localStorage
- Implement password reset flow
- Add 2FA for operators

---

## 📚 References

- **Backend Docs:** http://localhost:8000/docs (Swagger UI)
- **Frontend Code:** `/frontend/src/`
- **Auth Context:** `/frontend/src/context/AuthContext.jsx`
- **Security Utils:** `/backend/security.py`
