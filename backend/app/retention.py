"""
Retention metrics computed from analytics events

Ghana is on UTC, so a UTC calendar day is the child's local day.
"""
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Dict, Iterable, List, Optional

# A gap longer than this between two events starts a new play session
SESSION_GAP = timedelta(minutes=30)


def student_metrics(events: List[dict], today: date) -> dict:
    """Metrics for one child; events are dicts with name, occurredAt and props, any order"""
    events = sorted(events, key=lambda e: e["occurredAt"])
    days = sorted({e["occurredAt"].date() for e in events})
    first_day = days[0]

    sessions = 1
    for previous, current in zip(events, events[1:]):
        if current["occurredAt"] - previous["occurredAt"] > SESSION_GAP:
            sessions += 1

    weeks = max(1.0, ((today - first_day).days + 1) / 7)
    fun_breaks: Dict[str, int] = defaultdict(int)
    for e in events:
        if e["name"] == "fun_break":
            fun_breaks[(e.get("props") or {}).get("result", "unknown")] += 1

    def returned(after_days: int) -> Optional[bool]:
        # None until the day has passed, so new players don't drag the rate down
        target = first_day + timedelta(days=after_days)
        return target in days if today > target else None

    return {
        "firstDay": first_day.isoformat(),
        "lastDay": days[-1].isoformat(),
        "activeDays": len(days),
        "sessions": sessions,
        "sessionsPerWeek": round(sessions / weeks, 1),
        "returnedDay1": returned(1),
        "returnedDay7": returned(7),
        "nodesCompleted": sum(1 for e in events if e["name"] == "node_complete"),
        "chestsOpened": sum(1 for e in events if e["name"] == "chest_open"),
        "funBreaks": dict(fun_breaks),
    }


def retention_report(events: Iterable[dict], today: date) -> dict:
    """Per-child metrics plus cohort rates; events need a studentId"""
    by_student: Dict[str, List[dict]] = defaultdict(list)
    for e in events:
        by_student[e["studentId"]].append(e)

    students = {sid: student_metrics(evts, today) for sid, evts in by_student.items()}

    def rate(key: str) -> Optional[float]:
        eligible = [m[key] for m in students.values() if m[key] is not None]
        return round(sum(eligible) / len(eligible) * 100, 1) if eligible else None

    return {
        "generatedOn": today.isoformat(),
        "players": len(students),
        "day1ReturnPercent": rate("returnedDay1"),
        "day7ReturnPercent": rate("returnedDay7"),
        "avgSessionsPerWeek": (
            round(sum(m["sessionsPerWeek"] for m in students.values()) / len(students), 1)
            if students else None
        ),
        "students": students,
    }


def utc_today() -> date:
    return datetime.utcnow().date()
