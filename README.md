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
1. Student uploads `internship_report.pdf` → System calculates **150 CFA** → Generates PIN **`7823`**
2. Student walks to the print shop, pays 150 CFA cash, says "PIN 7823"
3. Operator types `7823` into the CloudCopy dashboard → Document goes straight to the printer

---

## 🔥 Features

### Student Side
- **QR Access** — No app download needed. Scan a QR code to launch the web interface
- **Print Customizer** — Choose color/B&W, single/double-sided, number of copies
- **Live Price Calculator** — Instant cost breakdown before uploading
- **Secure Queue** — Document sits encrypted in the cloud until the PIN is entered at the shop

### Operator / Shop Dashboard
- **Autopilot Queue** — One clean list of pending jobs; no Downloads folder chaos
- **One-Click Print** — PIN entered → document sent straight to the printer driver
- **Offline/Kill Switch** — Toggle shop status to "Offline" (power cut, ink out, Eneo strikes again)
- **USB-Free Zone** — Zero flash drives = zero shortcut viruses on shop PCs

### Platform / Admin
- **Auto-Nuke Policy** — All documents are permanently deleted 5–10 minutes after printing
- **Midnight Cron Purge** — Unpaid/unclaimed files deleted automatically every night
- **Low-Bandwidth Mode** — Files compressed on upload; optimized for 3G/spotty campus networks
- **Subscription Management** — Shop owner billing, trial tracking, and payment status

---

## 🛠 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Backend** | Python (FastAPI) | Lightweight, async, fast to prototype |
| **Frontend** | HTML/CSS/Vanilla JS or React | Mobile-first, no install required |
| **Database** | PostgreSQL | Reliable, scales well |
| **File Storage** | Cloudflare R2 or AWS S3 | Cheap egress, S3-compatible API |
| **Job Queue** | Redis + RQ (or Celery) | For async file processing & cron jobs |
| **Auth** | JWT (shop owners) + PIN (students) | Simple, no OAuth complexity for MVP |
| **Printing** | CUPS / direct PDF-to-printer | Standard Linux print system |
| **Hosting** | Railway / Render / VPS | Low-cost, deploys easily |

> **MVP Rule:** Keep it simple. If a feature needs a third-party service, question whether it's needed before the first beta shop is onboarded.

---

## 📁 Project Structure

```
cloudcopy/
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Environment & settings
│   ├── database.py              # DB connection & session
│   │
│   ├── routes/
│   │   ├── upload.py            # POST /upload — student uploads document
│   │   ├── pin.py               # POST /pin/verify — operator releases job
│   │   ├── queue.py             # GET /queue/{shop_id} — operator dashboard feed
│   │   ├── shop.py              # Shop registration, status toggle
│   │   └── admin.py             # Subscription management, analytics
│   │
│   ├── models/
│   │   ├── job.py               # PrintJob model (PIN, status, file ref, shop)
│   │   ├── shop.py              # Shop model (owner, subscription, online status)
│   │   └── document.py          # Document metadata (size, pages, options)
│   │
│   ├── services/
│   │   ├── storage.py           # Upload to R2/S3, generate secure URL
│   │   ├── pricing.py           # Calculate CFA cost from doc specs
│   │   ├── printer.py           # Send job to CUPS / print driver
│   │   ├── pin_generator.py     # Generate & validate 4-digit PINs
│   │   └── cleanup.py           # Auto-nuke & midnight cron purge
│   │
│   └── tasks/
│       └── cron.py              # Scheduled jobs (midnight purge, etc.)
│
├── frontend/
│   ├── student/                 # Student upload interface (mobile-first)
│   │   ├── index.html
│   │   ├── upload.js
│   │   └── style.css
│   │
│   └── operator/                # Shop dashboard
│       ├── index.html
│       ├── dashboard.js
│       └── style.css
│
├── docs/
│   ├── api.md                   # API endpoint documentation
│   ├── deployment.md            # How to deploy to production
│   └── printer-setup.md        # How to configure CUPS on shop PC
│
├── .env.example                 # Template for environment variables
├── requirements.txt
├── docker-compose.yml           # Local dev environment
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis
- A Cloudflare R2 bucket (or AWS S3)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/cloudcopy.git
cd cloudcopy
```

### 2. Set up the Python environment

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Open .env and fill in your values (see Environment Variables below)
```

### 4. Run database migrations

```bash
alembic upgrade head
```

### 5. Start the dev server

```bash
uvicorn backend.main:app --reload
```

### 6. (Optional) Start with Docker

```bash
docker-compose up --build
```

App runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

## 🔐 Environment Variables

```env
# App
APP_ENV=development
SECRET_KEY=your_secret_key_here

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cloudcopy

# Redis
REDIS_URL=redis://localhost:6379

# File Storage (Cloudflare R2 or AWS S3)
STORAGE_BUCKET_NAME=cloudcopy-docs
STORAGE_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=your_key
STORAGE_SECRET_ACCESS_KEY=your_secret

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

Full API docs auto-generated at `/docs` (Swagger UI) when running locally.

---

## 🔒 Security & Privacy

CloudCopy is built with a **privacy-first architecture**:

- **Auto-Nuke:** Every document is permanently deleted from cloud storage and all local caches **5–10 minutes after printing**. No exceptions.
- **Midnight Cron Purge:** Any document that was uploaded but never printed (abandoned jobs) is deleted automatically at midnight every night.
- **No Persistent Storage of Content:** CloudCopy stores document *metadata* (page count, cost, PIN hash), never the document content long-term.
- **PIN Hashing:** PINs are stored as bcrypt hashes. Even if the DB is leaked, no raw PINs are exposed.
- **Presigned URLs:** Documents are fetched from storage using short-lived presigned URLs (5-minute TTL) — never publicly accessible.
- **USB Elimination:** By removing flash drives from the workflow entirely, shop PCs are protected from shortcut viruses and USB-spread malware by design.

---

## 💼 Monetization

CloudCopy uses a **flat monthly SaaS subscription** model. Simple. Predictable.

| Phase | Price | Notes |
|---|---|---|
| **Free Trial** | 0 CFA | First 2 weeks, full access |
| **Monthly Plan** | 5,000 CFA/month | Full dashboard access |

- CloudCopy **does not touch cash.** Shops collect 100% of their print revenue.
- CloudCopy collects a clean monthly fee from shop owners.
- No transaction cuts. No percentage splits. No complexity.

---

## 🗺 Roadmap

### MVP (v1.0) — Beta with 3 UB Shops
- [x] Document upload + PIN generation
- [x] Operator dashboard + PIN release
- [x] Auto-nuke & cron purge
- [x] Offline/kill-switch toggle
- [x] Flat subscription billing

### v1.5 — Campus Expansion
- [ ] Multi-location support (UB Main, Molyko, Bonduma)
- [ ] Print history for operators (no document content, just job logs)
- [ ] SMS/WhatsApp PIN delivery option

### v2.0 — Campus Service Hub
- [ ] **Premium Finishing** — Binding, laminating, hardcovers (checkbox upsells)
- [ ] **Type-It-For-Me Queue** — Upload handwritten notes, get typed document back
- [ ] **Academic Marketplace** — Past questions & handouts sold via Mobile Money
- [ ] **Mobile Money Subscription Billing** — MTN MoMo / Orange Money integration

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
