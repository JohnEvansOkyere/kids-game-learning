"""
Skill graph content - the maths skills every question and node is built on

Like the world content, skills live in code so they are versioned with the app.
scripts/sync_skills.py copies them into the Skill table so questions can point at them.

First pass: one skill per (grade, topic) the question bank has today.
Split them into finer skills (e.g. "add within 10" vs "within 20") as mastery needs it.

naccaCode is the closest NaCCA curriculum indicator (e.g. B1.1.2.4.2 = Basic 1, strand,
sub-strand, content standard, indicator), checked against the official 2019 documents:
  https://nacca.gov.gh/wp-content/uploads/2019/04/MATHS-LOWER-PRIMARY-B1-B3.pdf
  https://nacca.gov.gh/wp-content/uploads/2019/06/KG-Curriculum.pdf
NaCCA indicators cover addition and subtraction together, so two skills can share a code.
Leave it None when nothing matches - never guess a code. Known gaps:
  - KG2: numeracy indicators are spread across the KG themes; none matched cleanly yet.
  - P2 multiplication: NaCCA starts multiplication in B3 (B2 only skip counts by 2s, 5s, 10s).
  - P3 times tables: B3.1.2.5.1 covers multiplication up to 5 x 5; our questions go to 12 x 12.
"""
from typing import Dict, List, Optional, Tuple, TypedDict

from app.world_content import GRADE_ORDER


class Skill(TypedDict):
    id: str
    naccaCode: Optional[str]
    gradeLevel: str
    strand: str
    topic: str  # legacy topic, used to tag existing questions
    title: str  # short, for kids
    parentDescription: str  # what the child can do, for parent reports
    prerequisiteIds: List[str]
    order: int  # teaching order across the whole graph


SKILLS: List[Skill] = [
    {
        "id": "kg1-count-to-10", "naccaCode": "K1.6.8.1.6", "gradeLevel": "KG1", "strand": "Number",
        "topic": "counting", "title": "Count to 10",
        "parentDescription": "Counts objects up to 10 and knows which number comes next.",
        "prerequisiteIds": [], "order": 10,
    },
    {
        "id": "kg2-count-to-20", "naccaCode": None, "gradeLevel": "KG2", "strand": "Number",
        "topic": "counting", "title": "Count to 20",
        "parentDescription": "Counts objects up to 20.",
        "prerequisiteIds": ["kg1-count-to-10"], "order": 20,
    },
    {
        "id": "kg2-add-within-10", "naccaCode": None, "gradeLevel": "KG2", "strand": "Number",
        "topic": "addition", "title": "Put together",
        "parentDescription": "Adds two small groups (up to 5 + 5).",
        "prerequisiteIds": ["kg1-count-to-10"], "order": 30,
    },
    {
        "id": "kg2-subtract-within-10", "naccaCode": None, "gradeLevel": "KG2", "strand": "Number",
        "topic": "subtraction", "title": "Take away",
        "parentDescription": "Takes away from a small group (up to 10).",
        "prerequisiteIds": ["kg1-count-to-10"], "order": 40,
    },
    {
        "id": "p1-add-within-20", "naccaCode": "B1.1.2.4.2", "gradeLevel": "P1", "strand": "Number",
        "topic": "addition", "title": "Add bigger numbers",
        "parentDescription": "Adds numbers up to 20, including simple word problems.",
        "prerequisiteIds": ["kg2-add-within-10", "kg2-count-to-20"], "order": 50,
    },
    {
        "id": "p1-subtract-within-20", "naccaCode": "B1.1.2.4.2", "gradeLevel": "P1", "strand": "Number",
        "topic": "subtraction", "title": "Give the change",
        "parentDescription": "Subtracts numbers up to 20, including simple word problems.",
        "prerequisiteIds": ["kg2-subtract-within-10", "kg2-count-to-20"], "order": 60,
    },
    {
        "id": "p2-add-within-100", "naccaCode": "B2.1.2.4.3", "gradeLevel": "P2", "strand": "Number",
        "topic": "addition", "title": "Add tens and ones",
        "parentDescription": "Adds two-digit numbers.",
        "prerequisiteIds": ["p1-add-within-20"], "order": 70,
    },
    {
        "id": "p2-subtract-within-100", "naccaCode": "B2.1.2.4.3", "gradeLevel": "P2", "strand": "Number",
        "topic": "subtraction", "title": "Subtract tens and ones",
        "parentDescription": "Subtracts two-digit numbers up to 100.",
        "prerequisiteIds": ["p1-subtract-within-20"], "order": 80,
    },
    {
        "id": "p2-times-2-5-10", "naccaCode": None, "gradeLevel": "P2", "strand": "Number",
        "topic": "multiplication", "title": "Groups of 2, 5 and 10",
        "parentDescription": "Multiplies by 2, 5 and 10 using equal groups.",
        "prerequisiteIds": ["p2-add-within-100"], "order": 90,
    },
    {
        "id": "p3-add-within-1000", "naccaCode": "B3.1.2.1.1", "gradeLevel": "P3", "strand": "Number",
        "topic": "addition", "title": "Add hundreds",
        "parentDescription": "Adds three-digit numbers up to 1000.",
        "prerequisiteIds": ["p2-add-within-100"], "order": 100,
    },
    {
        "id": "p3-subtract-within-1000", "naccaCode": "B3.1.2.1.1", "gradeLevel": "P3", "strand": "Number",
        "topic": "subtraction", "title": "Subtract hundreds",
        "parentDescription": "Subtracts three-digit numbers up to 500.",
        "prerequisiteIds": ["p2-subtract-within-100"], "order": 110,
    },
    {
        "id": "p3-times-tables-to-12", "naccaCode": "B3.1.2.5.1", "gradeLevel": "P3", "strand": "Number",
        "topic": "multiplication", "title": "Times tables to 12",
        "parentDescription": "Knows multiplication facts from 3 x 3 to 12 x 12.",
        "prerequisiteIds": ["p2-times-2-5-10"], "order": 120,
    },
]

SKILLS_BY_ID: Dict[str, Skill] = {s["id"]: s for s in SKILLS}

# Existing questions only know topic + grade; this is how they map onto skills
LEGACY_SKILL_MAP: Dict[Tuple[str, str], str] = {
    (s["topic"], s["gradeLevel"]): s["id"] for s in SKILLS
}


def skill_id_for(topic: str, grade_level: str) -> Optional[str]:
    """Skill for a question that only has a topic and grade (None if unmapped)"""
    return LEGACY_SKILL_MAP.get((topic, grade_level))


def validate_skills(skills: List[Skill]) -> None:
    """Raise ValueError if the graph is inconsistent (bad ids, grades, prerequisites or cycles)"""
    ids = [s["id"] for s in skills]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate skill ids")

    pairs = [(s["topic"], s["gradeLevel"]) for s in skills]
    if len(pairs) != len(set(pairs)):
        raise ValueError("Two skills share a topic and grade; LEGACY_SKILL_MAP would be ambiguous")

    by_id = {s["id"]: s for s in skills}
    for skill in skills:
        if skill["gradeLevel"] not in GRADE_ORDER:
            raise ValueError(f"{skill['id']}: unknown grade {skill['gradeLevel']}")
        for prereq in skill["prerequisiteIds"]:
            if prereq not in by_id:
                raise ValueError(f"{skill['id']}: unknown prerequisite {prereq}")

    # Depth-first search for cycles: 1 = on the current path, 2 = done
    state: Dict[str, int] = {}

    def visit(skill_id: str, path: List[str]) -> None:
        if state.get(skill_id) == 2:
            return
        if state.get(skill_id) == 1:
            raise ValueError(f"Prerequisite cycle: {' -> '.join(path + [skill_id])}")
        state[skill_id] = 1
        for prereq in by_id[skill_id]["prerequisiteIds"]:
            visit(prereq, path + [skill_id])
        state[skill_id] = 2

    for skill_id in by_id:
        visit(skill_id, [])
