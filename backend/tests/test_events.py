from datetime import date, datetime, timedelta, timezone

import pytest

from app.core.config import settings
from app.retention import retention_report, student_metrics
from tests.test_world import register_parent_and_child

pytestmark = pytest.mark.asyncio


def event(name, when, **props):
    return {"name": name, "occurredAt": when, "props": props or None}


def at(day, hour=9, minute=0):
    return datetime(2026, 3, day, hour, minute, tzinfo=timezone.utc)


def payload(*events):
    return {"events": [
        {"id": f"evt-{i:06d}" if "id" not in e else e["id"], **{k: v for k, v in e.items() if k != "id"}}
        for i, e in enumerate(events)
    ]}


def now_iso(delta=timedelta()):
    return (datetime.now(timezone.utc) + delta).isoformat()


async def test_events_are_recorded_once(client, prisma_db):
    headers, student_id = await register_parent_and_child(client)
    body = payload(
        {"name": "map_open", "occurredAt": now_iso()},
        {"name": "node_complete", "occurredAt": now_iso(), "props": {"nodeId": "village-1", "stars": 3}},
    )

    res = await client.post(f"/api/events/{student_id}", json=body, headers=headers)
    assert res.status_code == 200
    assert res.json() == {"accepted": 2}

    # The same batch re-sent after a network failure is not counted twice
    res = await client.post(f"/api/events/{student_id}", json=body, headers=headers)
    assert res.json() == {"accepted": 0}

    stored = await prisma_db.event.find_first(where={"name": "node_complete"})
    assert stored.props == {"nodeId": "village-1", "stars": 3}


async def test_bad_events_are_dropped_and_future_clamped(client, prisma_db):
    headers, student_id = await register_parent_and_child(client)
    body = payload(
        {"name": "not_a_real_event", "occurredAt": now_iso()},
        {"name": "map_open", "occurredAt": now_iso(-timedelta(days=45))},
        {"name": "chest_open", "occurredAt": now_iso(timedelta(days=3))},
    )

    res = await client.post(f"/api/events/{student_id}", json=body, headers=headers)
    assert res.json() == {"accepted": 1}

    chest = await prisma_db.event.find_first(where={"name": "chest_open"})
    assert chest.occurredAt <= datetime.now(timezone.utc)


async def test_events_need_the_childs_parent(client):
    _, student_id = await register_parent_and_child(client)
    other_headers, _ = await register_parent_and_child(client, email="other@example.com")
    body = payload({"name": "map_open", "occurredAt": now_iso()})

    res = await client.post(f"/api/events/{student_id}", json=body, headers=other_headers)
    assert res.status_code == 403

    res = await client.post(f"/api/events/{student_id}", json=body)
    assert res.status_code in (401, 403)


async def test_report_requires_a_real_admin_token(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_SEED_TOKEN", "change-me")
    res = await client.get("/api/events/report", headers={"X-Admin-Token": "change-me"})
    assert res.status_code == 401

    monkeypatch.setattr(settings, "ADMIN_SEED_TOKEN", "s3cret-token")
    res = await client.get("/api/events/report", headers={"X-Admin-Token": "wrong"})
    assert res.status_code == 401


async def test_report_lists_players_by_id_and_grade(client, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_SEED_TOKEN", "s3cret-token")
    headers, student_id = await register_parent_and_child(client, grade="P1")
    await client.post(
        f"/api/events/{student_id}",
        json=payload({"name": "map_open", "occurredAt": now_iso()}),
        headers=headers,
    )

    res = await client.get("/api/events/report", headers={"X-Admin-Token": "s3cret-token"})
    assert res.status_code == 200
    report = res.json()
    assert report["players"] == 1
    child = report["students"][student_id]
    assert child["gradeLevel"] == "P1"
    assert child["sessions"] == 1
    assert "name" not in child


async def test_sessions_split_on_long_gaps():
    events = [
        event("map_open", at(1, 9, 0)),
        event("node_complete", at(1, 9, 20)),
        event("node_complete", at(1, 9, 45)),  # 25 min gap: same session
        event("map_open", at(1, 16, 0)),       # afternoon: new session
    ]
    assert student_metrics(events, date(2026, 3, 1))["sessions"] == 2


async def test_day1_and_day7_return():
    events = [event("map_open", at(1)), event("map_open", at(2)), event("map_open", at(9))]

    m = student_metrics(events, date(2026, 3, 20))
    assert m["returnedDay1"] is True
    assert m["returnedDay7"] is False  # day 7 is March 8
    assert m["activeDays"] == 3

    # Too early to judge day 7: not counted either way
    assert student_metrics(events[:1], date(2026, 3, 5))["returnedDay7"] is None


async def test_cohort_rates_only_count_eligible_players():
    events = [
        {"studentId": "a", **event("map_open", at(1))},
        {"studentId": "a", **event("map_open", at(2))},
        {"studentId": "b", **event("map_open", at(1))},
        {"studentId": "c", **event("map_open", at(10))},  # started yesterday: not eligible
        {"studentId": "a", **event("fun_break", at(2), result="skip")},
    ]
    report = retention_report(events, date(2026, 3, 11))
    assert report["players"] == 3
    assert report["day1ReturnPercent"] == 50.0
    assert report["students"]["a"]["funBreaks"] == {"skip": 1}
