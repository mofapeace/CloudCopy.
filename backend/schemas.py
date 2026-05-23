from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime


# ── Auth ─────────────────────────────────────────────────────────────────────

class OperatorRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    shop_name: str
    shop_location: str


class LoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    google_token: str   # ID token from Google (mock: any string triggers login)
    name: Optional[str] = None
    email: Optional[str] = None


class PhoneLoginRequest(BaseModel):
    phone: str
    otp: str            # mock: any 6-digit code is accepted


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: Optional[str] = None


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    url: str            # URL of the ready-to-serve PDF
    pages: int          # page count detected from file
    converted: bool = False
    original_name: str


# ── Job ───────────────────────────────────────────────────────────────────────

class CreateJobRequest(BaseModel):
    shop_id: int
    file_path: str      # path returned by /upload
    original_file_name: str
    pages: int
    copies: int
    is_color: bool

    @field_validator("copies")
    @classmethod
    def copies_must_be_positive(cls, v):
        if v < 1:
            raise ValueError("copies must be ≥ 1")
        return v

    @field_validator("pages")
    @classmethod
    def pages_must_be_positive(cls, v):
        if v < 1:
            raise ValueError("pages must be ≥ 1")
        return v


class JobResponse(BaseModel):
    id: int
    pin: str
    pages: int
    copies: int
    is_color: bool
    cost: float
    status: str
    original_file_name: str
    created_at: datetime
    shop_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Shop ──────────────────────────────────────────────────────────────────────

class ShopResponse(BaseModel):
    id: int
    name: str
    location: str
    is_online: bool
    avg_rating: Optional[float] = None
    total_jobs: int = 0

    class Config:
        from_attributes = True


# ── Review ────────────────────────────────────────────────────────────────────

class CreateReviewRequest(BaseModel):
    shop_id: int
    job_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def rating_in_range(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("rating must be between 1 and 5")
        return v
