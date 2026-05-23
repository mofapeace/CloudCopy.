"""
CloudCopy Backend — FastAPI + SQLite
--------------------------------------
Pricing:  copies × pages × rate_per_page
          B&W  = 25 CFA/page
          Color = 75 CFA/page

Security: bcrypt password hashing, HS256 JWT tokens
"""

import os
import uuid
import random
import string
import subprocess
from typing import Optional

from fastapi import (
    FastAPI, UploadFile, File, Depends,
    HTTPException, status, Header
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
import shutil

from database import engine, get_db
import models
import schemas
from security import (
    hash_password, verify_password,
    create_access_token, decode_token
)

# ── DB init ───────────────────────────────────────────────────────────────────
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="CloudCopy API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

BW_RATE    = 25   # CFA per page
COLOR_RATE = 75   # CFA per page


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_page_count(pdf_path: str) -> int:
    """Read page count from a PDF using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        return len(reader.pages)
    except Exception:
        return 1   # fallback


def generate_pin(db: Session) -> str:
    """Generate a unique 4-digit PIN."""
    for _ in range(100):
        pin = "".join(random.choices(string.digits, k=4))
        exists = db.query(models.Job).filter(
            models.Job.pin == pin,
            models.Job.status == "pending"
        ).first()
        if not exists:
            return pin
    raise HTTPException(status_code=500, detail="Could not generate a unique PIN.")


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> models.User:
    """Dependency: extract and validate JWT, return the User object."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired.",
        )
    user = db.query(models.User).filter(models.User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive.")
    return user


def require_client(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "client":
        raise HTTPException(status_code=403, detail="Clients only.")
    return user


def require_operator(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "operator":
        raise HTTPException(status_code=403, detail="Operators only.")
    return user


# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/auth/register/operator", response_model=schemas.TokenResponse, tags=["Auth"])
def register_operator(req: schemas.OperatorRegisterRequest, db: Session = Depends(get_db)):
    """Register a new operator and their print shop in one step."""
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")

    user = models.User(
        name=req.name,
        email=req.email,
        role="operator",
        provider="email",
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.flush()   # get user.id before commit

    shop = models.Shop(
        name=req.shop_name,
        location=req.shop_location,
        operator_id=user.id,
    )
    db.add(shop)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name)


@app.post("/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """Email + password login (operators)."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    token = create_access_token({"sub": user.id, "role": user.role})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name)


@app.post("/auth/google", response_model=schemas.TokenResponse, tags=["Auth"])
def google_login(req: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Google login for clients.
    In production: verify the google_token with Google's API.
    Here: we trust the email/name sent by the client after Google Sign-In.
    """
    if not req.email:
        raise HTTPException(status_code=400, detail="Email is required.")

    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        user = models.User(
            name=req.name,
            email=req.email,
            role="client",
            provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name)


@app.post("/auth/phone", response_model=schemas.TokenResponse, tags=["Auth"])
def phone_login(req: schemas.PhoneLoginRequest, db: Session = Depends(get_db)):
    """
    Phone + OTP login for clients.
    In production: verify OTP with Twilio/Africa's Talking.
    Here: any 6-digit OTP is accepted.
    """
    if len(req.otp) != 6 or not req.otp.isdigit():
        raise HTTPException(status_code=400, detail="OTP must be exactly 6 digits.")

    user = db.query(models.User).filter(models.User.phone == req.phone).first()
    if not user:
        user = models.User(
            phone=req.phone,
            role="client",
            provider="phone",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})
    return schemas.TokenResponse(access_token=token, role=user.role, name=user.name)


# ── Upload endpoint ───────────────────────────────────────────────────────────

@app.post("/upload/", response_model=schemas.UploadResponse, tags=["Documents"])
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a PDF or Word document.
    - If .docx/.doc → convert to PDF via LibreOffice
    - Detect page count from the resulting PDF
    - Returns the PDF URL and page count (used to compute price on the frontend)
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=400, detail="Only PDF and Word documents are supported.")

    uid = uuid.uuid4().hex
    original_path = os.path.join(UPLOAD_DIR, f"{uid}{ext}")
    pdf_path      = os.path.join(UPLOAD_DIR, f"{uid}.pdf")

    # Save original file
    with open(original_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    converted = False
    if ext == ".pdf":
        pdf_path = original_path
    else:
        # Convert via LibreOffice headless
        try:
            result = subprocess.run(
                ["libreoffice", "--headless", "--convert-to", "pdf",
                 "--outdir", UPLOAD_DIR, original_path],
                capture_output=True, text=True, timeout=60
            )
            if result.returncode != 0 or not os.path.exists(pdf_path):
                raise HTTPException(status_code=500,
                    detail=f"Conversion failed: {result.stderr}")
            os.remove(original_path)   # clean up source
            converted = True
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=500, detail="Conversion timed out.")

    pages = get_page_count(pdf_path)

    return schemas.UploadResponse(
        url=f"/static/{uid}.pdf",
        pages=pages,
        converted=converted,
        original_name=file.filename,
    )


# ── Jobs ──────────────────────────────────────────────────────────────────────

@app.post("/jobs/", response_model=schemas.JobResponse, tags=["Jobs"])
def create_job(
    req: schemas.CreateJobRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_client),
):
    """Submit a print job. Calculates cost and generates a PIN."""
    shop = db.query(models.Shop).filter(models.Shop.id == req.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")

    rate = COLOR_RATE if req.is_color else BW_RATE
    cost = req.copies * req.pages * rate

    job = models.Job(
        user_id=current_user.id,
        shop_id=req.shop_id,
        file_path=req.file_path,
        original_file_name=req.original_file_name,
        pages=req.pages,
        copies=req.copies,
        is_color=req.is_color,
        cost=cost,
        pin=generate_pin(db),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return schemas.JobResponse(
        id=job.id,
        pin=job.pin,
        pages=job.pages,
        copies=job.copies,
        is_color=job.is_color,
        cost=job.cost,
        status=job.status,
        original_file_name=job.original_file_name,
        created_at=job.created_at,
        shop_name=shop.name,
    )


@app.get("/jobs/pin/{pin}", response_model=schemas.JobResponse, tags=["Jobs"])
def get_job_by_pin(
    pin: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator),
):
    """Operator looks up a job by PIN to release the document."""
    job = db.query(models.Job).filter(
        models.Job.pin == pin,
        models.Job.status == "pending",
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="No pending job found for this PIN.")
    return job


@app.patch("/jobs/{job_id}/status", tags=["Jobs"])
def update_job_status(
    job_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_operator),
):
    """Operator marks a job as printed/completed."""
    allowed = {"printed", "completed"}
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}.")
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    job.status = new_status
    db.commit()
    return {"message": f"Job {job_id} marked as {new_status}."}


# ── Shops ─────────────────────────────────────────────────────────────────────

@app.get("/shops/", response_model=list[schemas.ShopResponse], tags=["Shops"])
def list_shops(db: Session = Depends(get_db)):
    """List all shops with computed average rating and total job count."""
    shops = db.query(models.Shop).filter(models.Shop.is_online == True).all()
    result = []
    for shop in shops:
        avg = db.query(func.avg(models.Review.rating)).filter(
            models.Review.shop_id == shop.id
        ).scalar()
        total = db.query(func.count(models.Job.id)).filter(
            models.Job.shop_id == shop.id
        ).scalar()
        result.append(schemas.ShopResponse(
            id=shop.id,
            name=shop.name,
            location=shop.location,
            is_online=shop.is_online,
            avg_rating=round(avg, 1) if avg else None,
            total_jobs=total or 0,
        ))
    return result


# ── Reviews ───────────────────────────────────────────────────────────────────

@app.post("/reviews/", tags=["Reviews"])
def create_review(
    req: schemas.CreateReviewRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_client),
):
    """Client submits a rating for a shop."""
    shop = db.query(models.Shop).filter(models.Shop.id == req.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found.")

    review = models.Review(
        user_id=current_user.id,
        shop_id=req.shop_id,
        job_id=req.job_id,
        rating=req.rating,
        comment=req.comment,
    )
    db.add(review)
    db.commit()
    return {"message": "Review submitted. Thank you!"}


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {"status": "CloudCopy API is running", "docs": "/docs"}
