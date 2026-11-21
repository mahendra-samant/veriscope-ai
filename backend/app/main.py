import os, base64, io
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from passlib.exc import UnknownHashError
from PIL import Image
import pytesseract

from .database import Base, engine, get_db
from .models import User, Prediction
from .schemas import RegisterInput, LoginInput, ClaimInput
from .security import hash_password, verify_password, make_token, current_user
from .services import analyze_claim

load_dotenv()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeriScope AI API",
    version="2.0.0",
    description="Evidence-aware misinformation analysis with Gemini, news search and OCR.",
)
origins = [os.getenv("FRONTEND_URL", "http://localhost:5173"), "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def auth_response(user):
    return {
        "access_token": make_token(user),
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email},
    }


@app.get("/")
def root():
    return {"message": "VeriScope AI API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        connected = True
    except Exception:
        connected = False
    return {
        "status": "healthy" if connected else "degraded",
        "database_connected": connected,
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
    }


@app.post("/api/auth/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(409, "An account with this email already exists")
    user = User(
        name=data.name.strip(),
        email=data.email.lower(),
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return auth_response(user)


@app.post("/api/auth/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return auth_response(user)


@app.get("/api/auth/me")
def me(user: User = Depends(current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}


@app.post("/api/predict")
def predict(
    data: ClaimInput, db: Session = Depends(get_db), user: User = Depends(current_user)
):
    result = analyze_claim(data.claim.strip())
    row = Prediction(
        user_id=user.id,
        claim=data.claim.strip(),
        verdict=result["verdict"],
        confidence=result["confidence"],
        reasoning=result["reasoning"],
        sources_json=__import__("json").dumps(result["sources"]),
        from_image=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    result["id"] = row.id
    return result


@app.post("/api/image-predict")
async def image_predict(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    if file.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(400, "Upload a JPG, PNG or WEBP image")
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(413, "Image must be smaller than 8 MB")
    try:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        extracted = pytesseract.image_to_string(image, lang="eng").strip()
    except Exception as exc:
        raise HTTPException(
            503, "OCR is unavailable. Install Tesseract OCR and ensure it is on PATH."
        ) from exc
    if len(extracted) < 5:
        raise HTTPException(400, "No readable text found in this image")
    result = analyze_claim(extracted[:8000])
    row = Prediction(
        user_id=user.id,
        claim=extracted[:8000],
        verdict=result["verdict"],
        confidence=result["confidence"],
        reasoning=result["reasoning"],
        sources_json=__import__("json").dumps(result["sources"]),
        from_image=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    result.update({"id": row.id, "extracted_text": extracted, "from_image": True})
    return result


@app.get("/api/auth/history")
def history(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = (
        db.query(Prediction)
        .filter(Prediction.user_id == user.id)
        .order_by(desc(Prediction.created_at))
        .limit(50)
        .all()
    )
    return {
        "predictions": [
            {
                "id": r.id,
                "claim": r.claim,
                "text": r.claim,
                "prediction": r.verdict.lower(),
                "verdict": r.verdict,
                "confidence": r.confidence,
                "reasoning": r.reasoning,
                "sources": __import__("json").loads(r.sources_json or "[]"),
                "from_image": r.from_image,
                "created_at": r.created_at.isoformat(),
            }
            for r in rows
        ]
    }


@app.get("/api/auth/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(current_user)):
    rows = db.query(Prediction).filter(Prediction.user_id == user.id).all()
    return {
        "total_checks": len(rows),
        "real_count": sum(r.verdict == "REAL" for r in rows),
        "fake_count": sum(r.verdict == "FAKE" for r in rows),
        "unverified_count": sum(r.verdict == "UNVERIFIED" for r in rows),
    }


@app.delete("/api/auth/history/{prediction_id}")
def delete_history(
    prediction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(current_user),
):
    row = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id, Prediction.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(404, "Record not found")
    db.delete(row)
    db.commit()
    return {"message": "Record deleted"}
