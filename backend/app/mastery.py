"""
Skill mastery per student, computed from their answers

Recent answers count most: a child who struggled last month but is getting
things right now should show as mastered.
"""
from datetime import datetime
from typing import Dict, Iterable, List, Optional, Tuple

from app.skills_content import SKILLS

RECENT_ANSWERS = 20
MIN_ANSWERS_TO_JUDGE = 5
MASTERED_MIN_ANSWERS = 10
MASTERED_ACCURACY = 85
PRACTISING_ACCURACY = 60

# (skillId, isCorrect, answeredAt)
AnswerRow = Tuple[str, bool, datetime]


def mastery_status(attempts: int, recent_accuracy: Optional[float]) -> str:
    """not_started, learning, practising or mastered"""
    if attempts == 0:
        return "not_started"
    if attempts >= MASTERED_MIN_ANSWERS and recent_accuracy >= MASTERED_ACCURACY:
        return "mastered"
    if attempts >= MIN_ANSWERS_TO_JUDGE and recent_accuracy >= PRACTISING_ACCURACY:
        return "practising"
    return "learning"


def compute_mastery(answers: Iterable[AnswerRow]) -> List[dict]:
    """One entry per skill in teaching order, including skills not started yet"""
    by_skill: Dict[str, List[AnswerRow]] = {}
    for row in answers:
        by_skill.setdefault(row[0], []).append(row)

    results: Dict[str, dict] = {}
    for skill in sorted(SKILLS, key=lambda s: s["order"]):
        rows = sorted(by_skill.get(skill["id"], []), key=lambda r: r[2])
        recent = rows[-RECENT_ANSWERS:]
        recent_accuracy = round(sum(r[1] for r in recent) / len(recent) * 100, 1) if recent else None
        results[skill["id"]] = {
            "skillId": skill["id"],
            "attempts": len(rows),
            "correct": sum(r[1] for r in rows),
            "recentAccuracy": recent_accuracy,
            "status": mastery_status(len(rows), recent_accuracy),
            "lastPracticedAt": rows[-1][2] if rows else None,
        }

    # Ready to learn: every prerequisite mastered (used later to pick what comes next)
    for skill in SKILLS:
        results[skill["id"]]["prerequisitesMastered"] = all(
            results[p]["status"] == "mastered" for p in skill["prerequisiteIds"]
        )

    return list(results.values())
