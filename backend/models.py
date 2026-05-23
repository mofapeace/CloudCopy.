from sqlalchemy import Boolean, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=True)
    phone         = Column(String, unique=True, index=True, nullable=True)
    name          = Column(String, nullable=True)
    role          = Column(String, default="client")   # client | operator
    hashed_password = Column(String, nullable=True)     # operators only
    provider      = Column(String, default="email")     # email | google | phone
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    jobs    = relationship("Job",    back_populates="user")
    reviews = relationship("Review", back_populates="user")


class Shop(Base):
    __tablename__ = "shops"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, index=True)
    location    = Column(String)
    operator_id = Column(Integer, ForeignKey("users.id"))
    is_online   = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User")
    jobs     = relationship("Job",    back_populates="shop")
    reviews  = relationship("Review", back_populates="shop")


class Job(Base):
    __tablename__ = "jobs"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id"))
    shop_id            = Column(Integer, ForeignKey("shops.id"))
    file_path          = Column(String)           # path to the stored PDF
    original_file_name = Column(String)
    pages              = Column(Integer)           # detected from file
    copies             = Column(Integer, default=1)  # chosen by student
    is_color           = Column(Boolean, default=False)
    cost               = Column(Float)             # pages * copies * rate
    pin                = Column(String(6), index=True, unique=True)
    status             = Column(String, default="pending")  # pending | printed | completed
    created_at         = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="jobs")
    shop = relationship("Shop", back_populates="jobs")


class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"))
    shop_id    = Column(Integer, ForeignKey("shops.id"))
    job_id     = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    rating     = Column(Integer)    # 1-5
    comment    = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reviews")
    shop = relationship("Shop", back_populates="reviews")
