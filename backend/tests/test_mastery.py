from datetime import datetime, timedelta

import pytest

from app.mastery import compute_mastery, mastery_status
from tests.test_skills import seed
from tests.test_world import register_parent_and_child

pytestmark = pytest.mark.asyncio

START = datetime(2026, 3, 1, 9, 0)


def rows(skill_id, results):
    return [(skill_id, ok, START + timedelta(minutes=i)) for i, ok in enumerate(results)]


def by_skill(mastery):
    return {m["skillId"]: m for m in mastery}


@pytest.mark.parametrize("attempts, accuracy, expected", [
    (0, None, "not_started"),
    (3, 100.0, "learning"),      # too few answers to judge
    (6, 50.0, "learning"),
    (6, 70.0, "practising"),
    (9, 100.0, "practising"),    # mastery needs at least 10 answers
    (10, 85.0, "mastered"),
])
async def test_mastery_status(attempts, accuracy, expected):
    assert mastery_status(attempts, accuracy) == expected


async def test_recent_answers_outweigh_old_mistakes():
    # 20 wrong last month, then 20 right: only the recent 20 count
    old = rows("p1-add-within-20", [False] * 20)
    new = [(s, ok, t + timedelta(days=30)) for s, ok, t in rows("p1-add-within-20", [True] * 20)]
    m = by_skill(compute_mastery(old + new))["p1-add-within-20"]
    assert m["attempts"] == 40
    assert m["recentAccuracy"] == 100.0
    assert m["status"] == "mastered"


async def test_every_skill_is_listed_with_prerequisites():
    mastery = by_skill(compute_mastery(rows("kg1-count-to-10", [True] * 10)))
    assert mastery["kg1-count-to-10"]["status"] == "mastered"
    assert mastery["kg2-count-to-20"]["status"] == "not_started"
    assert mastery["kg2-count-to-20"]["prerequisitesMastered"] is True
    assert mastery["p1-add-within-20"]["prerequisitesMastered"] is False
    assert mastery["kg1-count-to-10"]["prerequisitesMastered"] is True  # no prerequisites


async def test_student_mastery_from_practice_answers(client, prisma_db):
    headers, student_id = await register_parent_and_child(client, grade="P1")
    await seed(client)

    res = await client.post("/api/game/practice/start", headers=headers, json={
        "studentId": student_id, "topic": "addition", "gradeLevel": "P1", "skillId": "p1-add-within-20",
    })
    session = res.json()
    for q in session["questions"][:6]:
        await client.post("/api/game/practice/answer", headers=headers, json={
            "sessionId": session["sessionId"], "questionId": q["id"],
            "answer": q["correctAnswer"], "timeSpent": 3,
        })

    res = await client.get(f"/api/skills/students/{student_id}", headers=headers)
    assert res.status_code == 200
    mastery = {m["skill"]["id"]: m for m in res.json()}
    add = mastery["p1-add-within-20"]
    assert add["attempts"] == 6
    assert add["recentAccuracy"] == 100.0
    assert add["status"] == "practising"
    assert mastery["p1-subtract-within-20"]["status"] == "not_started"

    other_headers, _ = await register_parent_and_child(client, email="other@example.com")
    res = await client.get(f"/api/skills/students/{student_id}", headers=other_headers)
    assert res.status_code == 403


async def test_skill_graph_endpoint(client):
    res = await client.get("/api/skills/")
    assert res.status_code == 200
    skills = res.json()
    assert skills[0]["id"] == "kg1-count-to-10"
    assert [s["order"] for s in skills] == sorted(s["order"] for s in skills)
