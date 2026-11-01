import datetime

import pytest

from app.core.config import settings
from app.skills_content import LEGACY_SKILL_MAP, SKILLS, SKILLS_BY_ID, validate_skills
from scripts.backfill_question_skills import backfill_question_skills
from scripts.sync_skills import sync_skills

pytestmark = pytest.mark.asyncio


def make_skill(skill_id, prereqs=(), topic=None, grade="P1"):
    return {
        "id": skill_id, "naccaCode": None, "gradeLevel": grade, "strand": "Number",
        "topic": topic or skill_id, "title": skill_id, "parentDescription": skill_id,
        "prerequisiteIds": list(prereqs), "order": 1,
    }


def make_question(topic, grade, **extra):
    return {
        "topic": topic, "gradeLevel": grade, "difficulty": 1, "questionText": "1 + 1 = ?",
        "correctAnswer": 2, "option1": 1, "option2": 2, "option3": 3, "option4": 4, **extra,
    }


async def seed(client, force=False):
    res = await client.post(
        f"/api/questions/seed?force={'true' if force else 'false'}",
        headers={"X-Admin-Token": settings.ADMIN_SEED_TOKEN},
    )
    assert res.status_code == 200
    return res.json()["count"]


async def test_skill_graph_is_valid():
    validate_skills(SKILLS)
    # Prerequisites always come earlier in teaching order
    for skill in SKILLS:
        for prereq in skill["prerequisiteIds"]:
            assert SKILLS_BY_ID[prereq]["order"] < skill["order"]


@pytest.mark.parametrize("skills, message", [
    ([make_skill("a", ["b"]), make_skill("b", ["a"])], "cycle"),
    ([make_skill("a", ["missing"])], "unknown prerequisite"),
    ([make_skill("a"), make_skill("a", topic="other")], "Duplicate skill ids"),
    ([make_skill("a", grade="P9")], "unknown grade"),
    ([make_skill("a", topic="t"), make_skill("b", topic="t")], "share a topic and grade"),
])
async def test_validate_skills_rejects_bad_graphs(skills, message):
    with pytest.raises(ValueError, match=message):
        validate_skills(skills)


async def test_sync_skills_creates_updates_and_reports_stale(prisma_db):
    await sync_skills(prisma_db)
    await sync_skills(prisma_db)
    assert await prisma_db.skill.count() == len(SKILLS)

    stored = await prisma_db.skill.find_unique(where={"id": "p1-add-within-20"})
    assert stored.prerequisiteIds == ["kg2-add-within-10", "kg2-count-to-20"]

    renamed = [{**s, "title": "New title"} if s["id"] == "kg1-count-to-10" else s for s in SKILLS]
    stale = await sync_skills(prisma_db, renamed[1:] + renamed[:1])
    assert stale == []
    assert (await prisma_db.skill.find_unique(where={"id": "kg1-count-to-10"})).title == "New title"

    without_last = SKILLS[:-1]
    assert await sync_skills(prisma_db, without_last) == [SKILLS[-1]["id"]]


async def test_seed_tags_every_question(client, prisma_db):
    count = await seed(client)
    assert count > 0
    assert await prisma_db.question.count(where={"skillId": None}) == 0

    # Every (topic, grade) in the bank maps onto its skill
    questions = await prisma_db.question.find_many()
    for q in questions:
        assert q.skillId == LEGACY_SKILL_MAP[(q.topic, q.gradeLevel)]


async def test_backfill_tags_old_questions_and_is_repeatable(prisma_db):
    await prisma_db.question.create(data=make_question("addition", "P1"))
    await prisma_db.question.create(data=make_question("counting", "KG1"))
    await prisma_db.question.create(data=make_question("division", "P3"))

    first = await backfill_question_skills(prisma_db)
    assert first == {"p1-add-within-20": 1, "kg1-count-to-10": 1, "untagged": 1}

    second = await backfill_question_skills(prisma_db)
    assert second == {"untagged": 1}

    tagged = await prisma_db.question.find_first(where={"topic": "addition"})
    assert tagged.skillId == "p1-add-within-20"


async def test_reseed_keeps_answered_questions(client, prisma_db):
    first_count = await seed(client)

    user = await prisma_db.user.create(data={"email": "p@example.com", "passwordHash": "x"})
    parent = await prisma_db.parent.create(data={"userId": user.id, "name": "P", "phoneNumber": "0"})
    student = await prisma_db.student.create(data={
        "parentId": parent.id, "name": "Kofi", "avatar": "lion", "gradeLevel": "P1",
        "dateOfBirth": datetime.datetime(2018, 1, 1),
    })
    session = await prisma_db.gamesession.create(data={
        "studentId": student.id, "sessionType": "practice", "topic": "addition",
        "gradeLevel": "P1", "totalQuestions": 1,
    })
    answered = await prisma_db.question.find_first(where={"topic": "addition", "gradeLevel": "P1"})
    await prisma_db.answer.create(data={
        "sessionId": session.id, "questionId": answered.id,
        "selectedAnswer": 1, "isCorrect": False, "timeSpent": 3,
    })

    second_count = await seed(client, force=True)

    assert await prisma_db.question.find_unique(where={"id": answered.id}) is not None
    assert await prisma_db.answer.count() == 1
    assert await prisma_db.question.count() == second_count + 1
    assert first_count == second_count


async def test_every_node_points_at_a_matching_skill():
    from app.world_content import NODES
    for node in NODES:
        skill = SKILLS_BY_ID[node["skillId"]]
        assert (skill["topic"], skill["gradeLevel"]) == (node["topic"], node["gradeLevel"]), node["id"]


async def test_practice_picks_questions_by_skill(client, prisma_db):
    from tests.test_world import register_parent_and_child
    headers, student_id = await register_parent_and_child(client, grade="P1")
    await seed(client)
    # A question in the same topic and grade but another skill must never be picked
    await prisma_db.question.create(data=make_question("addition", "P1"))

    res = await client.post("/api/game/practice/start", headers=headers, json={
        "studentId": student_id, "topic": "addition", "gradeLevel": "P1", "skillId": "p1-add-within-20",
    })
    assert res.status_code == 200
    ids = [q["id"] for q in res.json()["questions"]]
    picked = await prisma_db.question.find_many(where={"id": {"in": ids}})
    assert picked and all(q.skillId == "p1-add-within-20" for q in picked)

    res = await client.post("/api/game/practice/start", headers=headers, json={
        "studentId": student_id, "topic": "addition", "gradeLevel": "P1", "skillId": "nope",
    })
    assert res.status_code == 400


async def test_practice_falls_back_to_topic_when_skill_has_no_questions(client, prisma_db):
    from tests.test_world import register_parent_and_child
    headers, student_id = await register_parent_and_child(client, grade="P1")
    for _ in range(3):
        await prisma_db.question.create(data=make_question("addition", "P1"))

    res = await client.post("/api/game/practice/start", headers=headers, json={
        "studentId": student_id, "topic": "addition", "gradeLevel": "P1", "skillId": "p1-add-within-20",
    })
    assert res.status_code == 200
    assert len(res.json()["questions"]) == 3


async def test_nacca_codes_match_the_skill_grade():
    import re
    prefix = {"KG1": "K1", "KG2": "K2", "P1": "B1", "P2": "B2", "P3": "B3"}
    for skill in SKILLS:
        code = skill["naccaCode"]
        if code is None:
            continue
        assert re.fullmatch(r"(K[12]|B[1-3])(\.\d+){4}", code), skill["id"]
        assert code.startswith(prefix[skill["gradeLevel"]] + "."), skill["id"]
