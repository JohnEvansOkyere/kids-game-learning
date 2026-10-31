"""
Adventure World content - zones, nodes and items

Content lives in code (not the database) so it is versioned with the app.
Student progress against these ids is stored in NodeProgress / StudentItem.
"""
from typing import Dict, List, Optional, TypedDict


GRADE_ORDER = ["KG1", "KG2", "P1", "P2", "P3"]

# Node types map to existing games on the frontend
#   river -> /practice (river crossing)
#   catch -> /games/counting-catch
#   pop   -> /games/number-pop
#   boss  -> /battle (tug of war vs computer)
NODE_TYPES = ["river", "catch", "pop", "boss"]


class Zone(TypedDict):
    id: str
    name: str
    emoji: str
    description: str
    gradeLevel: str  # students at or above this grade start with it unlocked
    bossReward: str  # collectible item id granted on first boss clear


class Node(TypedDict):
    id: str
    zoneId: str
    type: str
    title: str
    emoji: str
    topic: str
    gradeLevel: str
    skillId: str  # app/skills_content.py; picks the node's questions


class Item(TypedDict):
    id: str
    name: str
    emoji: str
    kind: str  # outfit (equippable, buyable) or collectible
    price: Optional[int]  # None = cannot be bought


ZONES: List[Zone] = [
    {
        "id": "village",
        "name": "Village Square",
        "emoji": "🏡",
        "description": "Count everything in the village!",
        "gradeLevel": "KG1",
        "bossReward": "ananse",
    },
    {
        "id": "farm",
        "name": "Mango Farm",
        "emoji": "🥭",
        "description": "Help the farmer count, add and share mangoes.",
        "gradeLevel": "KG2",
        "bossReward": "tortoise",
    },
    {
        "id": "market",
        "name": "Makola Market",
        "emoji": "🛒",
        "description": "Buy, sell and give change at the market.",
        "gradeLevel": "P1",
        "bossReward": "talking_drum",
    },
    {
        "id": "forest",
        "name": "Kakum Forest",
        "emoji": "🌳",
        "description": "Cross the canopy walk with groups and times tables.",
        "gradeLevel": "P2",
        "bossReward": "parrot",
    },
    {
        "id": "coast",
        "name": "Cape Coast",
        "emoji": "🏰",
        "description": "The final challenge by the sea!",
        "gradeLevel": "P3",
        "bossReward": "golden_stool",
    },
]


NODES: List[Node] = [
    # Village Square - KG1
    {"id": "village-1", "zoneId": "village", "type": "pop", "title": "Number Pop", "emoji": "🔢", "topic": "counting", "gradeLevel": "KG1", "skillId": "kg1-count-to-10"},
    {"id": "village-2", "zoneId": "village", "type": "catch", "title": "Catch the Stars", "emoji": "🌟", "topic": "counting", "gradeLevel": "KG1", "skillId": "kg1-count-to-10"},
    {"id": "village-3", "zoneId": "village", "type": "river", "title": "Count the Toffees", "emoji": "🍬", "topic": "counting", "gradeLevel": "KG1", "skillId": "kg1-count-to-10"},
    {"id": "village-boss", "zoneId": "village", "type": "boss", "title": "Chief's Challenge", "emoji": "👑", "topic": "counting", "gradeLevel": "KG1", "skillId": "kg1-count-to-10"},
    # Mango Farm - KG2
    {"id": "farm-1", "zoneId": "farm", "type": "river", "title": "Count the Mangoes", "emoji": "🥭", "topic": "counting", "gradeLevel": "KG2", "skillId": "kg2-count-to-20"},
    {"id": "farm-2", "zoneId": "farm", "type": "river", "title": "More Mangoes", "emoji": "➕", "topic": "addition", "gradeLevel": "KG2", "skillId": "kg2-add-within-10"},
    {"id": "farm-3", "zoneId": "farm", "type": "river", "title": "Share the Mangoes", "emoji": "➖", "topic": "subtraction", "gradeLevel": "KG2", "skillId": "kg2-subtract-within-10"},
    {"id": "farm-boss", "zoneId": "farm", "type": "boss", "title": "Farmer's Tug of War", "emoji": "🧑‍🌾", "topic": "addition", "gradeLevel": "KG2", "skillId": "kg2-add-within-10"},
    # Makola Market - P1
    {"id": "market-1", "zoneId": "market", "type": "river", "title": "Fill the Basket", "emoji": "🧺", "topic": "addition", "gradeLevel": "P1", "skillId": "p1-add-within-20"},
    {"id": "market-2", "zoneId": "market", "type": "river", "title": "Give the Change", "emoji": "🪙", "topic": "subtraction", "gradeLevel": "P1", "skillId": "p1-subtract-within-20"},
    {"id": "market-boss", "zoneId": "market", "type": "boss", "title": "Market Queen", "emoji": "👸🏿", "topic": "subtraction", "gradeLevel": "P1", "skillId": "p1-subtract-within-20"},
    # Kakum Forest - P2
    {"id": "forest-1", "zoneId": "forest", "type": "river", "title": "Canopy Walk", "emoji": "🌉", "topic": "addition", "gradeLevel": "P2", "skillId": "p2-add-within-100"},
    {"id": "forest-2", "zoneId": "forest", "type": "river", "title": "Monkey Business", "emoji": "🐒", "topic": "subtraction", "gradeLevel": "P2", "skillId": "p2-subtract-within-100"},
    {"id": "forest-3", "zoneId": "forest", "type": "river", "title": "Groups of Birds", "emoji": "🐦", "topic": "multiplication", "gradeLevel": "P2", "skillId": "p2-times-2-5-10"},
    {"id": "forest-boss", "zoneId": "forest", "type": "boss", "title": "Forest Elephant", "emoji": "🐘", "topic": "multiplication", "gradeLevel": "P2", "skillId": "p2-times-2-5-10"},
    # Cape Coast - P3
    {"id": "coast-1", "zoneId": "coast", "type": "river", "title": "Fishing Boats", "emoji": "🚣🏿", "topic": "addition", "gradeLevel": "P3", "skillId": "p3-add-within-1000"},
    {"id": "coast-2", "zoneId": "coast", "type": "river", "title": "Castle Steps", "emoji": "🪜", "topic": "subtraction", "gradeLevel": "P3", "skillId": "p3-subtract-within-1000"},
    {"id": "coast-3", "zoneId": "coast", "type": "river", "title": "Nets of Fish", "emoji": "🐟", "topic": "multiplication", "gradeLevel": "P3", "skillId": "p3-times-tables-to-12"},
    {"id": "coast-boss", "zoneId": "coast", "type": "boss", "title": "Champion of the Coast", "emoji": "🏆", "topic": "multiplication", "gradeLevel": "P3", "skillId": "p3-times-tables-to-12"},
]


ITEMS: List[Item] = [
    # Outfits - bought with coins, shown on the avatar
    {"id": "sunglasses", "name": "Cool Shades", "emoji": "🕶️", "kind": "outfit", "price": 25},
    {"id": "kente_cap", "name": "Kente Cap", "emoji": "🧢", "kind": "outfit", "price": 40},
    {"id": "scarf", "name": "Kente Scarf", "emoji": "🧣", "kind": "outfit", "price": 50},
    {"id": "top_hat", "name": "Party Hat", "emoji": "🎩", "kind": "outfit", "price": 80},
    {"id": "crown", "name": "Chief's Crown", "emoji": "👑", "kind": "outfit", "price": 150},
    # Collectibles - from zone bosses and the daily chest
    {"id": "ananse", "name": "Kweku Ananse", "emoji": "🕷️", "kind": "collectible", "price": None},
    {"id": "tortoise", "name": "Wise Tortoise", "emoji": "🐢", "kind": "collectible", "price": None},
    {"id": "talking_drum", "name": "Talking Drum", "emoji": "🪘", "kind": "collectible", "price": None},
    {"id": "parrot", "name": "Grey Parrot", "emoji": "🦜", "kind": "collectible", "price": None},
    {"id": "golden_stool", "name": "Golden Stool", "emoji": "🪑", "kind": "collectible", "price": None},
    {"id": "cocoa", "name": "Cocoa Pod", "emoji": "🫘", "kind": "collectible", "price": None},
    {"id": "pineapple", "name": "Sweet Pineapple", "emoji": "🍍", "kind": "collectible", "price": None},
    {"id": "butterfly", "name": "Forest Butterfly", "emoji": "🦋", "kind": "collectible", "price": None},
    {"id": "shell", "name": "Sea Shell", "emoji": "🐚", "kind": "collectible", "price": None},
    {"id": "football", "name": "Black Stars Ball", "emoji": "⚽", "kind": "collectible", "price": None},
]

# Collectibles that only bosses give out - the chest never drops these
BOSS_ONLY_ITEMS = {zone["bossReward"] for zone in ZONES}

ZONES_BY_ID: Dict[str, Zone] = {z["id"]: z for z in ZONES}
NODES_BY_ID: Dict[str, Node] = {n["id"]: n for n in NODES}
ITEMS_BY_ID: Dict[str, Item] = {i["id"]: i for i in ITEMS}

# Rewards
COINS_PER_STAR = 5
FIRST_CLEAR_BONUS = 20
CHEST_MIN_COINS = 10
CHEST_MAX_COINS = 30
CHEST_ITEM_CHANCE = 0.3


def nodes_in_zone(zone_id: str) -> List[Node]:
    return [n for n in NODES if n["zoneId"] == zone_id]


def stars_for(accuracy: float) -> int:
    """Stars (0-3) for an accuracy percentage. 1 star is needed to pass."""
    if accuracy >= 90:
        return 3
    if accuracy >= 70:
        return 2
    if accuracy >= 50:
        return 1
    return 0


def compute_unlocked(grade_level: str, stars_by_node: Dict[str, int]) -> set:
    """
    Return the set of unlocked node ids.

    A zone is open if the student's grade is at or above the zone's grade
    (placeholder until the diagnostic places them) or the previous zone's
    boss has been cleared. Inside an open zone nodes unlock one by one.
    """
    grade_index = GRADE_ORDER.index(grade_level) if grade_level in GRADE_ORDER else 0
    unlocked = set()
    previous_zone_cleared = True  # the first zone is always open

    for zone in ZONES:
        zone_nodes = nodes_in_zone(zone["id"])
        zone_open = previous_zone_cleared or GRADE_ORDER.index(zone["gradeLevel"]) <= grade_index

        if zone_open:
            for i, node in enumerate(zone_nodes):
                if i == 0 or stars_by_node.get(zone_nodes[i - 1]["id"], 0) >= 1:
                    unlocked.add(node["id"])

        boss = zone_nodes[-1]
        previous_zone_cleared = stars_by_node.get(boss["id"], 0) >= 1

    return unlocked
