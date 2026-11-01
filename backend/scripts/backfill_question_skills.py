"""
Tag existing questions with a skillId from their topic + grade

Run once per environment after the Skill model ships (safe to run again:
only questions without a skill are touched).

    python -m scripts.backfill_question_skills
"""
import asyncio
from typing import Dict

from prisma import Prisma

from app.skills_content import LEGACY_SKILL_MAP
from scripts.sync_skills import sync_skills


async def backfill_question_skills(db: Prisma) -> Dict[str, int]:
    """Return how many questions were tagged per skill, plus how many are still untagged"""
    await sync_skills(db)

    tagged: Dict[str, int] = {}
    for (topic, grade_level), skill_id in LEGACY_SKILL_MAP.items():
        count = await db.question.update_many(
            where={"skillId": None, "topic": topic, "gradeLevel": grade_level},
            data={"skillId": skill_id},
        )
        if count:
            tagged[skill_id] = count

    tagged["untagged"] = await db.question.count(where={"skillId": None})
    return tagged


async def main():
    db = Prisma()
    await db.connect()
    try:
        result = await backfill_question_skills(db)
        untagged = result.pop("untagged")
        for skill_id, count in result.items():
            print(f"  {skill_id}: {count}")
        print(f"✅ Tagged {sum(result.values())} questions")
        if untagged:
            print(f"⚠️  {untagged} questions have a topic/grade with no skill")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
