"""
Admin router - super-admin overview of how the app is performing

Access is limited to the emails listed in SUPER_ADMIN_EMAILS. Children are
never identified by name here: everything is counts, rates and averages.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from prisma import Prisma

from app.core.config import settings
from app.core.database import get_db
from app.retention import retention_report, utc_today
from app.routers.auth import get_current_user

router = APIRouter()


async def require_super_admin(user=Depends(get_current_user)):
    """Allow only accounts whose email is in SUPER_ADMIN_EMAILS"""
    if user.email.strip().lower() not in settings.super_admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return user


def _pct(part: float, whole: float) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


def _fill_days(rows: List[Dict[str, Any]], days: int, keys: List[str]) -> List[Dict[str, Any]]:
    """One row per UTC day for the last `days` days, zero where nothing happened"""
    # Raw queries hand back the day as a datetime or an ISO string; either way the first 10 chars are the date
    by_day = {r["day"].isoformat()[:10] if hasattr(r["day"], "isoformat") else str(r["day"])[:10]: r
              for r in rows}
    today = utc_today()
    series = []
    for offset in range(days - 1, -1, -1):
        day = (today - timedelta(days=offset)).isoformat()
        row = by_day.get(day, {})
        series.append({"day": day, **{k: int(row.get(k) or 0) for k in keys}})
    return series


@router.get("/overview")
async def overview(
    days: int = Query(30, ge=7, le=90),
    _admin=Depends(require_super_admin),
    db: Prisma = Depends(get_db),
):
    """Totals, activity over time, accuracy by topic/grade and retention"""
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)

    parents = await db.parent.count()
    students = await db.student.count()
    sessions = await db.gamesession.count()
    completed_sessions = await db.gamesession.count(where={"completed": True})
    answers = await db.answer.count()
    correct_answers = await db.answer.count(where={"isCorrect": True})
    questions = await db.question.count()

    async def active_students(window_days: int) -> int:
        rows = await db.query_raw(
            'SELECT COUNT(DISTINCT student_id)::int AS n FROM game_sessions '
            "WHERE started_at >= $1::timestamp",
            now - timedelta(days=window_days),
        )
        return rows[0]["n"]

    active = {"day": await active_students(1), "week": await active_students(7),
              "month": await active_students(30)}

    signups = await db.query_raw(
        "SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS signups "
        "FROM parents WHERE created_at >= $1::timestamp GROUP BY 1",
        since,
    )
    activity = await db.query_raw(
        "SELECT date_trunc('day', started_at) AS day, COUNT(*)::int AS sessions, "
        "COUNT(DISTINCT student_id)::int AS players, "
        "COALESCE(SUM(correct_answers), 0)::int AS correct, "
        "COALESCE(SUM(correct_answers + wrong_answers), 0)::int AS attempted "
        "FROM game_sessions WHERE started_at >= $1::timestamp GROUP BY 1",
        since,
    )

    by_topic = await db.query_raw(
        "SELECT topic, COUNT(*)::int AS sessions, "
        "COALESCE(SUM(correct_answers), 0)::int AS correct, "
        "COALESCE(SUM(correct_answers + wrong_answers), 0)::int AS attempted, "
        "COALESCE(AVG(total_time_spent), 0)::float AS avg_seconds "
        "FROM game_sessions GROUP BY topic ORDER BY sessions DESC"
    )
    by_grade = await db.query_raw(
        "SELECT st.grade_level AS grade, COUNT(DISTINCT st.id)::int AS students, "
        "COUNT(gs.id)::int AS sessions, "
        "COALESCE(SUM(gs.correct_answers), 0)::int AS correct, "
        "COALESCE(SUM(gs.correct_answers + gs.wrong_answers), 0)::int AS attempted "
        "FROM students st LEFT JOIN game_sessions gs ON gs.student_id = st.id "
        "GROUP BY st.grade_level ORDER BY st.grade_level"
    )
    # The questions kids get wrong most often (at least 10 attempts so it isn't noise)
    hardest = await db.query_raw(
        "SELECT q.question_text AS text, q.grade_level AS grade, q.topic AS topic, "
        "COUNT(*)::int AS attempts, "
        "SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::int AS correct "
        "FROM answers a JOIN questions q ON q.id = a.question_id "
        "GROUP BY q.id HAVING COUNT(*) >= 10 "
        "ORDER BY SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END)::float / COUNT(*) ASC "
        "LIMIT 8"
    )

    events = await db.event.find_many(where={"occurredAt": {"gte": now - timedelta(days=90)}})
    retention = retention_report(
        ({"studentId": e.studentId, "name": e.name, "occurredAt": e.occurredAt, "props": e.props}
         for e in events),
        utc_today(),
    )

    return {
        "generatedAt": now.isoformat(),
        "windowDays": days,
        "totals": {
            "parents": parents,
            "students": students,
            "sessions": sessions,
            "completedSessions": completed_sessions,
            "completionPercent": _pct(completed_sessions, sessions),
            "answers": answers,
            "accuracyPercent": _pct(correct_answers, answers),
            "questions": questions,
        },
        "activeStudents": active,
        "signupsByDay": _fill_days(signups, days, ["signups"]),
        "activityByDay": _fill_days(activity, days, ["sessions", "players", "correct", "attempted"]),
        "byTopic": [
            {"topic": r["topic"], "sessions": r["sessions"],
             "accuracyPercent": _pct(r["correct"], r["attempted"]),
             "avgSeconds": round(r["avg_seconds"])}
            for r in by_topic
        ],
        "byGrade": [
            {"grade": r["grade"], "students": r["students"], "sessions": r["sessions"],
             "accuracyPercent": _pct(r["correct"], r["attempted"])}
            for r in by_grade
        ],
        "hardestQuestions": [
            {"text": r["text"], "grade": r["grade"], "topic": r["topic"],
             "attempts": r["attempts"], "accuracyPercent": _pct(r["correct"], r["attempts"])}
            for r in hardest
        ],
        "retention": {
            "players": retention["players"],
            "day1ReturnPercent": retention["day1ReturnPercent"],
            "day7ReturnPercent": retention["day7ReturnPercent"],
            "avgSessionsPerWeek": retention["avgSessionsPerWeek"],
        },
    }
