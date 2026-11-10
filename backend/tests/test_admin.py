import pytest

from app.core.config import settings
from tests.test_world import register_parent_and_child

pytestmark = pytest.mark.asyncio


@pytest.fixture
def admin_email(monkeypatch):
    monkeypatch.setattr(settings, "SUPER_ADMIN_EMAILS", " Boss@Example.com , other@example.com")
    return "boss@example.com"


async def test_overview_needs_a_login(client):
    res = await client.get("/api/admin/overview")
    assert res.status_code in (401, 403)


async def test_regular_parent_is_refused(client, admin_email):
    headers, _ = await register_parent_and_child(client, email="parent@example.com")
    res = await client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 403


async def test_nobody_is_admin_when_the_list_is_empty(client, monkeypatch):
    monkeypatch.setattr(settings, "SUPER_ADMIN_EMAILS", "")
    headers, _ = await register_parent_and_child(client, email="parent@example.com")
    res = await client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 403


async def test_overview_on_an_empty_app(client, admin_email):
    headers, _ = await register_parent_and_child(client, email=admin_email)
    res = await client.get("/api/admin/overview?days=7", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["totals"]["parents"] == 1
    assert body["totals"]["students"] == 1
    assert body["totals"]["sessions"] == 0
    assert body["totals"]["accuracyPercent"] == 0
    assert len(body["signupsByDay"]) == 7
    assert body["signupsByDay"][-1]["signups"] == 1
    assert body["hardestQuestions"] == []


async def test_overview_counts_sessions_and_topics(client, prisma_db, admin_email):
    headers, student_id = await register_parent_and_child(client, grade="P1", email=admin_email)
    await prisma_db.gamesession.create(data={
        "studentId": student_id, "sessionType": "practice", "topic": "addition",
        "gradeLevel": "P1", "totalQuestions": 10, "correctAnswers": 8, "wrongAnswers": 2,
        "totalTimeSpent": 120, "starsEarned": 2, "completed": True,
    })
    await prisma_db.gamesession.create(data={
        "studentId": student_id, "sessionType": "practice", "topic": "addition",
        "gradeLevel": "P1", "totalQuestions": 10, "correctAnswers": 2, "wrongAnswers": 3,
        "totalTimeSpent": 60,
    })

    res = await client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 200
    body = res.json()

    assert body["totals"]["sessions"] == 2
    assert body["totals"]["completionPercent"] == 50.0
    assert body["activeStudents"] == {"day": 1, "week": 1, "month": 1}
    # 10 correct out of 15 attempted
    assert body["byTopic"] == [
        {"topic": "addition", "sessions": 2, "accuracyPercent": 66.7, "avgSeconds": 90}
    ]
    assert body["byGrade"][0]["grade"] == "P1"
    assert body["activityByDay"][-1]["sessions"] == 2
    # No child names in the payload
    assert "Kofi" not in res.text
