from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.entities import TimelineEvent, User
from backend.app.schemas.schemas import TimelineEventResponse
from backend.app.auth.deps import get_optional_user

router = APIRouter(prefix="/timeline", tags=["Timeline"])

@router.get("", response_model=List[TimelineEventResponse])
def get_timeline(
    severity: Optional[str] = Query(None),
    modality: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user)
):
    user_id = user.id if user else 1
    query = db.query(TimelineEvent).filter(TimelineEvent.user_id == user_id)

    if severity:
        query = query.filter(TimelineEvent.severity == severity.lower())
    if modality:
        query = query.filter(TimelineEvent.modality.ilike(f"%{modality}%"))

    events = query.order_by(TimelineEvent.timestamp.desc()).limit(limit).all()
    return events
