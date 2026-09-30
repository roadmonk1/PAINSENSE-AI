from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.auth.security import decode_access_token
from backend.app.models.entities import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # For demo purposes, we can fallback to a default demo patient if no auth header provided,
        # but for protected routes we enforce auth.
        demo_user = db.query(User).filter(User.email == "patient@painsense.ai").first()
        if demo_user:
            return demo_user
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        # Check demo user
        return db.query(User).filter(User.email == "patient@painsense.ai").first()
    payload = decode_access_token(token)
    if not payload:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires role in {allowed_roles}, but user is '{current_user.role}'"
            )
        return current_user
    return role_checker

def get_strict_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def verify_patient_access(user: Optional[User], patient_id: int, db: Session) -> bool:
    """
    Role-Based Access Control & Patient Isolation Rule:
    - If user is None (demo mode without token): allowed.
    - If user is admin or doctor: allowed (clinical oversight).
    - If user is patient: strictly allowed only if user.id == patient_id.
    - If user is caregiver: allowed only if an active CaregiverPatientLink exists between user.id and patient_id.
    - Otherwise forbidden.
    """
    if user is None:
        return True
    if user.role in ["doctor", "admin"]:
        return True
    if user.role == "patient":
        return user.id == patient_id
    if user.role == "caregiver":
        from backend.app.models.entities import CaregiverPatientLink
        link = db.query(CaregiverPatientLink).filter(
            CaregiverPatientLink.caregiver_id == user.id,
            CaregiverPatientLink.patient_id == patient_id,
            CaregiverPatientLink.status == "active"
        ).first()
        return link is not None
    return False
