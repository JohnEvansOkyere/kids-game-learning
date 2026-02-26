import pytest

pytestmark = pytest.mark.asyncio


async def create_question(db):
    return await db.question.create(
        data={
            "topic": "addition",
            "gradeLevel": "P1",
            "difficulty": 1,
            "questionText": "1 + 1 = ?",
            "correctAnswer": 2,
            "option1": 1,
            "option2": 2,
            "option3": 3,
            "option4": 4,
            "explanation": "1 + 1 = 2",
        }
    )


async def register_parent_and_child(client):
    payload = {
        "email": "parent@example.com",
        "password": "password123",
        "parentName": "Mrs. Mensah",
        "phoneNumber": "+233241234567",
        "childName": "Kofi",
        "childAvatar": "lion",
        "childGradeLevel": "P1",
        "childDateOfBirth": "2018-01-01",
    }

    res = await client.post("/api/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    token = data["token"]["access_token"]
    student_id = data["student"]["id"]
    return token, student_id


async def test_practice_answer_idempotent(client, prisma_db):
    await create_question(prisma_db)
    token, student_id = await register_parent_and_child(client)

    start_res = await client.post(
        "/api/game/practice/start",
        json={"studentId": student_id, "topic": "addition", "gradeLevel": "P1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert start_res.status_code == 200
    start_data = start_res.json()
    session_id = start_data["sessionId"]
    question_id = start_data["questions"][0]["id"]

    answer_payload = {
        "sessionId": session_id,
        "questionId": question_id,
        "answer": 2,
        "timeSpent": 3,
    }

    first = await client.post(
        "/api/game/practice/answer",
        json=answer_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert first.status_code == 200
    assert first.json()["correct"] is True

    second = await client.post(
        "/api/game/practice/answer",
        json=answer_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert second.status_code == 200
    assert second.json()["correct"] is True

    session = await prisma_db.gamesession.find_unique(where={"id": session_id})
    assert session.correctAnswers == 1
    assert session.wrongAnswers == 0
    assert session.totalTimeSpent == 3


async def test_practice_complete_idempotent(client, prisma_db):
    await create_question(prisma_db)
    token, student_id = await register_parent_and_child(client)

    start_res = await client.post(
        "/api/game/practice/start",
        json={"studentId": student_id, "topic": "addition", "gradeLevel": "P1"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert start_res.status_code == 200
    start_data = start_res.json()
    session_id = start_data["sessionId"]
    question_id = start_data["questions"][0]["id"]

    answer_payload = {
        "sessionId": session_id,
        "questionId": question_id,
        "answer": 2,
        "timeSpent": 4,
    }

    await client.post(
        "/api/game/practice/answer",
        json=answer_payload,
        headers={"Authorization": f"Bearer {token}"},
    )

    first_complete = await client.post(
        "/api/game/practice/complete",
        json={"sessionId": session_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert first_complete.status_code == 200

    second_complete = await client.post(
        "/api/game/practice/complete",
        json={"sessionId": session_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert second_complete.status_code == 200

    assert first_complete.json() == second_complete.json()
