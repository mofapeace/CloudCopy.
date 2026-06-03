# ☁️ CloudCopy

> **Campus printing, unchained.**
> Upload from your room. Pay at the counter. No flash drives. No queues. No malware.

CloudCopy is a lightweight SaaS platform built to modernize document printing at African universities — starting with the **University of Buea, Cameroon**. It replaces the chaos of USB sticks, WhatsApp files, and long queues with a clean, cloud-based "Hold & Release" system that works even on 3G.

---

## 🧭 Table of Contents

- [How It Works](#-how-it-works)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Security & Privacy](#-security--privacy)
- [Monetization](#-monetization)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## ⚙️ How It Works

CloudCopy uses a **"Hold & Release" PIN system** — no mobile money, no wallet setup, no friction.

```
┌─────────────────────────────────────────────────────────────────┐
│  1. UPLOAD        2. HANDSHAKE          3. RELEASE              │
│                                                                  │
│  Student uploads  →  Walks to shop,  →  Operator types PIN  →  │
│  doc from room       pays cash,          document prints        │
│  Gets 4-digit PIN    gives PIN           instantly              │
└─────────────────────────────────────────────────────────────────┘
```

**Example:**
1. Student uploads `internship_report.pdf`, enters their name **"Tabi"** → System calculates **150 CFA** → Generates PIN **`7823`**
2. Student walks to any CloudCopy shop, pays 150 CFA cash, says "PIN 7823"
3. Operator types `7823` → dashboard shows **"Tabi — 2 pages — B&W"** → operator asks "your name?" → student confirms → document prints

---

## 🔥 Features

### V1 — Core (Currently Building)

#### Student Side
- **QR Access** — No app download. Scan a QR code at the shop to open CloudCopy instantly
- **Print Customizer** — Choose color/B&W, single/double-sided, number of copies
- **Live Print Preview** — See exactly how the document will look before uploading. Available to all users
- **Live Price Calculator** — Instant CFA cost breakdown before uploading
- **Shop-Agnostic PIN** — Student enters their name at upload, receives a PIN. PIN + name verification required at any CloudCopy shop to release the job
- **Shop Discovery Map** — See all registered CloudCopy shops. Pick any, walk in, redeem PIN
- **Congestion Indicator** — Live busyness badge per shop based on jobs processed per 5 mins

| Jobs / 5 mins | Status |
|---|---|
| 0 – 4 | 🟢 Quiet |
| 5 – 10 | 🟡 Moderate |
| 11+ | 🔴 Busy |

#### Operator / Shop Dashboard
- **Autopilot Queue** — One clean list of all pending PIN jobs. No Downloads folder, no WhatsApp files
- **One-Click Print** — Operator enters PIN → document goes straight to the printer
- **Kill Switch** — Manually set shop to Offline when closed, out of ink, or not taking jobs. Greys out shop on the student map
- **USB-Free Zone** — No flash drives = no shortcut viruses on shop PCs

#### Platform
- **Auto-Nuke** — Every document permanently deleted 5–10 minutes after printing. No exceptions
- **Midnight Cron Purge** — Abandoned uploads deleted automatically every night at midnight
- **Low-Bandwidth Compression** — Files compressed on upload, optimized for 3G campus networks

---

### V2 — Pro Tier & Business Layer *(more features to be defined)*

#### Student Pro Plan
| Feature | Free | Pro |
|---|---|---|
| Upload & PIN | ✅ | ✅ |
| Print customizer | ✅ | ✅ |
| Live print preview | ✅ | ✅ |
| Congestion map | ✅ | ✅ |
| PIN redeemable at any shop | ✅ | ✅ |
| Pickup time scheduling | ❌ | ✅ |
| Edit instructions to shop | ❌ | ✅ |
| Access to Pro shops | ❌ | ✅ |

#### Shop Subscription Plans
| Feature | Free Trial | Basic | Pro Bundle |
|---|---|---|---|
| Duration | 2 weeks | Monthly | Monthly |
| Operator dashboard | ✅ | ✅ | ✅ |
| PIN release & queue | ✅ | ✅ | ✅ |
| Kill switch | ✅ | ✅ | ✅ |
| Visible to Pro students | ❌ | ❌ | ✅ |
| Priority job queue | ❌ | ❌ | ✅ |
| Scheduled pickup handling | ❌ | ❌ | ✅ |
| Edit request handling | ❌ | ❌ | ✅ |
| **Price** | 0 CFA | 5,000 CFA/mo | TBD |

---

### V3 — Campus Service Hub *(to be defined)*
- Premium finishing upsells — binding, laminating, hardcovers
- Type-It-For-Me gig queue
- Academic Marketplace — past questions & handouts via Mobile Money
- MTN MoMo / Orange Money subscription billing

---

## 🛠 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React + Vite | Fast, familiar, mobile-first |
| **Backend** | Node.js + Express | JS all the way through — no context switching |
| **Database + Storage** | Supabase | Free tier, handles DB, file uploads, and auth in one place |
| **Auth** | Supabase Auth + JWT | Simple session management for shop owners |
| **Print Agent** | Node.js script (shop PC) | Polls Supabase, fires jobs to the local printer via node-printer |
| **Frontend Hosting** | Vercel | Free tier, auto-deploys on every `git push` |
| **Backend Hosting** | Railway | Cheap, simple, runs your Express server |

> **Build Rule:** Keep it simple. If a feature needs a third-party service, question whether it's needed before the first beta shop is onboarded.

---

## 📁 Project Structure

```
cloudcopy/
│
├── client/                          # React + Vite frontend
│   ├── public/
│   │   └── qr-placeholder.png       # QR code shown at the shop
│   └── src/
│       ├── pages/
│       │   ├── StudentUpload.jsx     # Student upload interface (mobile-first)
│       │   ├── OperatorDashboard.jsx # Shop owner queue + PIN entry
│       │   └── ShopLogin.jsx         # Operator login page
│       ├── components/
│       │   ├── PrintCustomizer.jsx   # Color, sides, copies + price calculator
│       │   ├── PinDisplay.jsx        # Shows PIN to student after upload
│       │   ├── JobCard.jsx           # Single job in the operator queue
│       │   └── OfflineToggle.jsx     # Kill switch for shop status
│       ├── lib/
│       │   └── supabase.js           # Supabase client instance
│       ├── App.jsx
│       └── main.jsx
│
├── server/                          # Node.js + Express backend
│   ├── routes/
│   │   ├── upload.js                # POST /api/upload — receive doc, generate PIN
│   │   ├── pin.js                   # POST /api/pin/verify — operator releases job
│   │   ├── queue.js                 # GET /api/queue/:shopId — pending jobs feed
│   │   └── shop.js                  # Shop registration + offline toggle
│   ├── services/
│   │   ├── pinGenerator.js          # Generate & hash 4-digit PINs
│   │   ├── pricing.js               # Calculate CFA cost from doc specs
│   │   ├── storage.js               # Upload file to Supabase Storage
│   │   └── cleanup.js               # Auto-nuke + midnight cron purge
│   ├── middleware/
│   │   └── auth.js                  # JWT verification for operator routes
│   ├── supabase.js                  # Supabase admin client
│   └── index.js                     # Express app entry point
│
├── print-agent/                     # Runs on the shop's PC (not in the cloud)
│   ├── agent.js                     # Polls Supabase every 5s, fires printer
│   ├── printer.js                   # Sends PDF to local printer via node-printer
│   └── config.json                  # Shop ID + printer name config
│
├── docs/
│   ├── api.md                       # API endpoint documentation
│   ├── deployment.md                # How to deploy frontend + backend
│   └── printer-setup.md            # How to set up the print agent on shop PC
│
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free at [supabase.com](https://supabase.com))
- A Vercel account (free at [vercel.com](https://vercel.com))
- A Railway account (free tier at [railway.app](https://railway.app))

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/cloudcopy.git
cd cloudcopy
```

### 2. Set up the frontend

```bash
cd client
npm install
npm run dev        # runs at http://localhost:5173
```

### 3. Set up the backend

```bash
cd server
npm install
node index.js      # runs at http://localhost:3000
```

### 4. Set up the print agent (on the shop PC)

```bash
cd print-agent
npm install
node agent.js      # starts polling Supabase for new jobs
```

### 5. Configure environment variables

```bash
cp .env.example .env
# Fill in your Supabase URL, keys, and JWT secret
```

---

## 🔐 Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
JWT_SECRET=your_jwt_secret_here

# Server
PORT=3000
CLIENT_URL=http://localhost:5173

# Auto-nuke settings
FILE_DELETE_DELAY_MINUTES=10
CRON_PURGE_TIME=00:00

# Pricing (CFA per page)
PRICE_BW_SINGLE=25
PRICE_BW_DOUBLE=40
PRICE_COLOR_SINGLE=75
PRICE_COLOR_DOUBLE=120
```

---

## 📡 API Reference

### Student Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload document, returns PIN + price |
| `GET` | `/api/job/{pin}/status` | Check if job is pending/printed/expired |

### Operator Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/pin/verify` | Enter PIN to release print job |
| `GET` | `/api/queue/{shop_id}` | Get all pending jobs for this shop |
| `POST` | `/api/shop/status` | Toggle shop online/offline |

### Admin Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/shops` | List all registered shops + subscription status |
| `POST` | `/api/admin/shops/{id}/activate` | Activate or renew subscription |
| `GET` | `/api/admin/analytics` | Print volumes, revenue, active shops |

Full API docs are in `docs/api.md`.

---

## 🔒 Security & Privacy

CloudCopy is built with a **privacy-first architecture**:

- **PIN + Name Verification:** A PIN alone never releases a job. At upload, the student enters their name. At the counter, the operator types the PIN — the dashboard shows the name attached to that job. The operator verbally confirms with the student before printing. A random correct PIN guess is useless without the matching name.

```
Stranger guesses PIN 7823 → dashboard shows "Tabi — 2 pages — B&W"
Operator: "your name?" → Stranger: "John" ❌ → job blocked
```

- **PIN is Single-Use:** Once redeemed and printed, the PIN is dead. Cannot be reused.
- **PIN Expiry:** PINs expire after 2 hours. Abandoned jobs are cancelled automatically.
- **Auto-Nuke:** Every document is permanently deleted from cloud storage **5–10 minutes after printing**. No exceptions.
- **Midnight Cron Purge:** Abandoned uploads deleted automatically every night at midnight.
- **No Persistent Storage of Content:** CloudCopy stores document *metadata* (page count, cost, PIN hash), never the document content long-term.
- **PIN Hashing:** PINs are stored as bcrypt hashes. Even if the DB is leaked, no raw PINs are exposed.
- **Presigned URLs:** Documents are fetched from storage using short-lived presigned URLs (5-minute TTL) — never publicly accessible.
- **USB Elimination:** No flash drives = no shortcut viruses on shop PCs. By design.

---

## 💼 Monetization

CloudCopy **never touches the physical cash** — shops keep 100% of their daily print revenue. CloudCopy collects a clean, predictable subscription fee.

### Shop Plans
| Plan | Price | Notes |
|---|---|---|
| **Free Trial** | 0 CFA | First 2 weeks, full access |
| **Basic** | 5,000 CFA/month | Core dashboard, queue, kill switch |
| **Pro Bundle** | TBD | Everything in Basic + Pro student visibility, priority queue, scheduled pickups |

### Student Plans
| Plan | Price | Notes |
|---|---|---|
| **Free** | 0 CFA | Full core experience — upload, preview, PIN, any shop |
| **Pro** | TBD | Pickup scheduling, edit instructions, Pro shop access |

---

## 🗺 Roadmap

### V1 — Core (In Progress)
- [ ] Document upload + shop-agnostic PIN generation
- [ ] Live print preview (all users)
- [ ] Print customizer + live price calculator
- [ ] QR code shop access
- [ ] Shop discovery map with live congestion indicators
- [ ] Operator dashboard + PIN release + one-click print
- [ ] Kill switch (toggles shop offline on the map)
- [ ] Auto-nuke + midnight cron purge
- [ ] Low-bandwidth file compression

### V2 — Pro Tier & Business Layer *(more to be defined)*
- [ ] Student Pro plan — pickup scheduling + edit instructions
- [ ] Shop Basic plan (5,000 CFA/month)
- [ ] Shop Pro Bundle — priority queue, scheduled pickups, edit handling
- [ ] 2-week free trial logic for shops
- [ ] Admin dashboard — shops, subscriptions, analytics
- [ ] Print history logs for operators

### V3 — Campus Service Hub *(to be defined)*
- [ ] Premium finishing upsells (binding, laminating, hardcovers)
- [ ] Type-It-For-Me gig queue
- [ ] Academic Marketplace
- [ ] MTN MoMo / Orange Money billing

---

## 🤝 Contributing

This project is being built and bootstrapped independently. If you want to contribute:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit with clear messages: `git commit -m "feat: add PIN expiry logic"`
4. Push and open a Pull Request

Please read `CONTRIBUTING.md` before submitting a PR.

---

## 📄 License

MIT License — see `LICENSE` for details.

---

> **Built for Buea. Scaling to every campus in Africa.**
> *CloudCopy — Stop the queue. Start the cloud.*
