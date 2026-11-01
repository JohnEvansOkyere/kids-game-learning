"""
Copy the skill graph from app/skills_content.py into the Skill table

Safe to run any time: creates new skills and updates changed ones.
Skills removed from the code are reported, not deleted, because questions may point at them.

    python -m scripts.sync_skills
"""
import asyncio
from typing import List

from prisma import Prisma

from app.skills_content import SKILLS, Skill, validate_skills


async def sync_skills(db: Prisma, skills: List[Skill] = SKILLS) -> List[str]:
    """Upsert every skill; return ids in the table that are no longer in the code"""
    validate_skills(skills)

    for skill in skills:
        data = {k: v for k, v in skill.items() if k != "id"}
        await db.skill.upsert(
            where={"id": skill["id"]},
            data={"create": {"id": skill["id"], **data}, "update": data},
        )

    code_ids = {s["id"] for s in skills}
    existing = await db.skill.find_many()
    return sorted(s.id for s in existing if s.id not in code_ids)


async def main():
    db = Prisma()
    await db.connect()
    try:
        stale = await sync_skills(db)
        print(f"✅ Synced {len(SKILLS)} skills")
        if stale:
            print(f"⚠️  In the database but not in the code: {', '.join(stale)}")
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
