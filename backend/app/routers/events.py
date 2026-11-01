"""
Events router - analytics events from the app, for retention metrics
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from prisma import Json, Prisma
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.database import get_db
from app.retention import retention_report, utc_today
from app.routers.auth import get_current_user
from app.routers.world import get_owned_student

router = APIRouter()

EVENT_NAMES = {
    "map_open",       # the world map was shown
    "node_start",     # a stage was opened from the map or "Next Stage"
    "node_complete",  # props: nodeId, correct, total, stars (null when sent offline)
    "chest_open",     # props: coins, itemId
    "item_buy",       # props: itemId
    "item_equip",     # props: itemId
    "fun_break",      # props: result (all | skip | timeout), caught
}
MAX_BATCH = 100
# Events queued offline for longer than this are dropped
MAX_EVENT_AGE = timedelta(days=30)


class EventIn(BaseModel):
    id: str = Field(..., min_length=8, max_length=64)  # generated on the device
    name: str
    occurredAt: datetime
    props: Optional[Dict[str, Any]] = None


class EventBatch(BaseModel):
    events: List[EventIn] = Field(..., max_length=MAX_BATCH)


class EventBatchResponse(BaseModel):
    accepted: int


@router.get("/report")
async def get_retention_report(
    x_admin_token: str = Header(..., alias="X-Admin-Token"),
    db: Prisma = Depends(get_db)
):
    """
    Retention report for the playtest (admin-only)

    Per child: first day, active days, sessions per week, day-1 / day-7 return.
    Children are identified by id and grade only, never by name.
    """
    # Never serve children's data behind the placeholder token
    if settings.ADMIN_SEED_TOKEN == "change-me" or x_admin_token != settings.ADMIN_SEED_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token"
        )

    events = await db.event.find_many()
    students = await db.student.find_many(where={"id": {"in": list({e.studentId for e in events})}})
    grades = {s.id: s.gradeLevel for s in students}

    report = retention_report(
        ({"studentId": e.studentId, "name": e.name, "occurredAt": e.occurredAt, "props": e.props}
         for e in events),
        utc_today(),
    )
    for student_id, metrics in report["students"].items():
        metrics["gradeLevel"] = grades.get(student_id)
    return report


@router.post("/{student_id}", response_model=EventBatchResponse)
async def record_events(
    student_id: str,
    batch: EventBatch,
    user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """
    Record a batch of analytics events for a student

    Events carry a device-generated id, so a batch re-sent after a network
    failure is only counted once. Unknown names and very old events are dropped.
    """
    await get_owned_student(student_id, user, db)

    now = datetime.now(timezone.utc)
    rows = []
    for event in batch.events:
        if event.name not in EVENT_NAMES:
            continue
        occurred = event.occurredAt
        if occurred.tzinfo is None:
            occurred = occurred.replace(tzinfo=timezone.utc)
        # Device clocks can be wrong; never accept events from the future
        occurred = min(occurred, now)
        if now - occurred > MAX_EVENT_AGE:
            continue
        row = {"clientId": event.id, "studentId": student_id, "name": event.name, "occurredAt": occurred}
        if event.props is not None:
            row["props"] = Json(event.props)
        rows.append(row)

    accepted = await db.event.create_many(data=rows, skip_duplicates=True) if rows else 0
    return EventBatchResponse(accepted=accepted)
