from datetime import datetime, timedelta, timezone

import pytest

from tests.test_skills import seed
from tests.test_world import register_parent_and_child

pytestmark = pytest.mark.asyncio

URL = "/api/game/practice/offline-sessions"


def iso(delta=timedelta()):
    return (datetime.now(timezone.utc) + delta).isoformat()


async def p1_addition_questions(prisma_db, n):
    return await prisma_db.question.find_many(
        where={"skillId": "p1-add-within-20"}, take=n, order={"id": "asc"}
    )


def body(student_id, answers, session_id="offline-abc12345"):
    return {
        "clientSessionId": session_id, "studentId": student_id,
        "topic": "addition", "gradeLevel": "P1", "startedAt": iso(-timedelta(minutes=10)),
        "answers": answers,
    }


def answer(q, correct=True, delta=timedelta(minutes=-5)):
    return {
        "questionId": q.id, "answer": q.correctAnswer if correct else q.correctAnswer + 1,
        "timeSpent": 4, "answeredAt": iso(delta),
    }


async def test_offline_answers_are_checked_and_saved(client, prisma_db):
    await seed(client)
    headers, student_id = await register_parent_and_child(client, grade="P1")
    qs = await p1_addition_questions(prisma_db, 4)

    res = await client.post(URL, headers=headers, json=body(student_id, [
        answer(qs[0]), answer(qs[1]), answer(qs[2], correct=False),
        answer(qs[0], correct=False),  # same question again: first try counts
    ]))
    assert res.status_code == 200
    assert res.json()["accepted"] == 3

    session = await prisma_db.gamesession.find_unique(where={"clientId": "offline-abc12345"})
    assert (session.totalQuestions, session.correctAnswers, session.wrongAnswers) == (3, 2, 1)
    assert session.completed and session.studentId == student_id
    saved = await prisma_db.answer.find_unique(
        where={"sessionId_questionId": {"sessionId": session.id, "questionId": qs[0].id}}
    )
    assert saved.isCorrect is True
    # The device's time is kept, so mastery orders answers correctly
    assert saved.answeredAt < datetime.now(timezone.utc) - timedelta(minutes=4)


async def test_resending_adds_only_new_answers(client, prisma_db):
    await seed(client)
    headers, student_id = await register_parent_and_child(client, grade="P1")
    qs = await p1_addition_questions(prisma_db, 3)

    await client.post(URL, headers=headers, json=body(student_id, [answer(qs[0])]))
    res = await client.post(URL, headers=headers, json=body(student_id, [answer(qs[0]), answer(qs[1])]))
    assert res.json()["accepted"] == 1
    res = await client.post(URL, headers=headers, json=body(student_id, [answer(qs[0]), answer(qs[1])]))
    assert res.json()["accepted"] == 0

    assert await prisma_db.gamesession.count() == 1
    session = await prisma_db.gamesession.find_first()
    assert session.totalQuestions == 2


async def test_unknown_questions_and_bad_times_are_dropped(client, prisma_db):
    await seed(client)
    headers, student_id = await register_parent_and_child(client, grade="P1")
    q = (await p1_addition_questions(prisma_db, 1))[0]
    future = answer(q, delta=timedelta(days=2))

    res = await client.post(URL, headers=headers, json=body(student_id, [
        {"questionId": "not-a-question", "answer": 3, "timeSpent": 2, "answeredAt": iso()},
        answer(q, delta=timedelta(days=-45)) | {"questionId": q.id},
    ]))
    assert res.json()["accepted"] == 0

    res = await client.post(URL, headers=headers, json=body(student_id, [future], session_id="offline-future01"))
    assert res.json()["accepted"] == 1
    saved = await prisma_db.answer.find_first(where={"questionId": q.id})
    assert saved.answeredAt <= datetime.now(timezone.utc)


async def test_offline_answers_count_towards_mastery(client, prisma_db):
    await seed(client)
    headers, student_id = await register_parent_and_child(client, grade="P1")
    qs = await p1_addition_questions(prisma_db, 10)

    await client.post(URL, headers=headers, json=body(student_id, [answer(q) for q in qs]))

    res = await client.get(f"/api/skills/students/{student_id}", headers=headers)
    add = next(m for m in res.json() if m["skill"]["id"] == "p1-add-within-20")
    assert add["attempts"] == 10
    assert add["status"] == "mastered"


async def test_offline_sessions_need_the_childs_parent(client, prisma_db):
    await seed(client)
    _, student_id = await register_parent_and_child(client, grade="P1")
    other_headers, other_id = await register_parent_and_child(client, email="other@example.com")
    q = (await p1_addition_questions(prisma_db, 1))[0]

    res = await client.post(URL, headers=other_headers, json=body(student_id, [answer(q)]))
    assert res.status_code == 403

    res = await client.post(URL, headers=other_headers, json=body(other_id, [answer(q)]) | {"topic": "algebra"})
    assert res.status_code == 400
