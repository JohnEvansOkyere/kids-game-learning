"""
Question seeding script for MathChampions Ghana
Seeds 100+ math questions with Ghana-specific context
"""
import asyncio
import random
from prisma import Prisma

# Ghana-specific names
NAMES = ["Kofi", "Ama", "Kwame", "Abena", "Yaw", "Akua", "Kwesi", "Adjoa"]

# Ghana-specific items
ITEMS = ["toffees", "mangoes", "oranges", "bananas", "pencils", "books", "balls"]

# Ghana-specific contexts
CONTEXTS = [
    "trotro",
    "kenkey",
    "waakye",
    "classroom",
    "market",
]


def generate_options(correct_answer: int, count: int = 4) -> list[int]:
    """Generate answer options including the correct one"""
    options = {correct_answer}
    
    # Generate wrong options
    while len(options) < count:
        # Create plausible wrong answers
        offset = random.choice([-3, -2, -1, 1, 2, 3])
        wrong = max(0, correct_answer + offset)
        if wrong != correct_answer:
            options.add(wrong)
    
    options_list = list(options)
    random.shuffle(options_list)
    
    # Ensure we have exactly 4 options
    while len(options_list) < 4:
        options_list.append(correct_answer + random.choice([4, 5, -4, -5]))
    
    return options_list[:4]


async def seed_kg1_questions(db: Prisma):
    """Seed KG1 questions: Counting 1-10, Number recognition"""
    questions = []
    
    # Counting questions (25 questions)
    for i in range(25):
        num = random.randint(1, 10)
        item = random.choice(ITEMS)
        name = random.choice(NAMES)
        
        question_text = f"{name} has {num} {item}. How many {item} does {name} have?"
        correct = num
        options = generate_options(correct)
        
        questions.append({
            "topic": "counting",
            "gradeLevel": "KG1",
            "difficulty": 1,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{name} has {correct} {item}."
        })
    
    # Number recognition (25 questions)
    for i in range(25):
        num = random.randint(1, 10)
        question_text = f"What number is this: {num}?"
        correct = num
        options = generate_options(correct)
        
        questions.append({
            "topic": "counting",
            "gradeLevel": "KG1",
            "difficulty": 1,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"The number is {correct}."
        })
    
    return questions


async def seed_kg2_questions(db: Prisma):
    """Seed KG2 questions: Counting 1-20, Simple addition/subtraction"""
    questions = []
    
    # Counting 1-20 (20 questions)
    for i in range(20):
        num = random.randint(1, 20)
        item = random.choice(ITEMS)
        name = random.choice(NAMES)
        
        question_text = f"Count the {item}: {name} has {num} {item}. How many?"
        correct = num
        options = generate_options(correct)
        
        questions.append({
            "topic": "counting",
            "gradeLevel": "KG2",
            "difficulty": 1,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"There are {correct} {item}."
        })
    
    # Simple addition 1-5 (20 questions)
    for i in range(20):
        a = random.randint(1, 5)
        b = random.randint(1, 5)
        item = random.choice(ITEMS)
        name1 = random.choice(NAMES)
        name2 = random.choice([n for n in NAMES if n != name1])
        
        question_text = f"{name1} has {a} {item}. {name2} gives {name1} {b} more. How many now?"
        correct = a + b
        options = generate_options(correct)
        
        questions.append({
            "topic": "addition",
            "gradeLevel": "KG2",
            "difficulty": 2,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} + {b} = {correct}"
        })
    
    # Simple subtraction 1-5 (20 questions)
    for i in range(20):
        a = random.randint(3, 10)
        b = random.randint(1, min(5, a))
        item = random.choice(ITEMS)
        name = random.choice(NAMES)
        
        question_text = f"{name} has {a} {item}. {name} gives away {b}. How many left?"
        correct = a - b
        options = generate_options(correct)
        
        questions.append({
            "topic": "subtraction",
            "gradeLevel": "KG2",
            "difficulty": 2,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} - {b} = {correct}"
        })
    
    return questions


async def seed_p1_questions(db: Prisma):
    """Seed P1 questions: Addition/subtraction 1-20"""
    questions = []
    
    # Addition 1-20 (30 questions)
    for i in range(30):
        a = random.randint(1, 20)
        b = random.randint(1, 20)
        
        if random.random() < 0.7:  # 70% word problems
            item = random.choice(ITEMS)
            name1 = random.choice(NAMES)
            name2 = random.choice([n for n in NAMES if n != name1])
            question_text = f"{name1} has {a} {item}. {name2} has {b} {item}. How many in total?"
        else:  # 30% direct math
            question_text = f"{a} + {b} = ?"
        
        correct = a + b
        options = generate_options(correct)
        
        questions.append({
            "topic": "addition",
            "gradeLevel": "P1",
            "difficulty": 2,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} + {b} = {correct}"
        })
    
    # Subtraction 1-20 (30 questions)
    for i in range(30):
        a = random.randint(5, 20)
        b = random.randint(1, a)
        
        if random.random() < 0.7:  # 70% word problems
            item = random.choice(ITEMS)
            name = random.choice(NAMES)
            question_text = f"{name} has {a} {item}. {name} sells {b}. How many left?"
        else:  # 30% direct math
            question_text = f"{a} - {b} = ?"
        
        correct = a - b
        options = generate_options(correct)
        
        questions.append({
            "topic": "subtraction",
            "gradeLevel": "P1",
            "difficulty": 2,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} - {b} = {correct}"
        })
    
    return questions


async def seed_p2_questions(db: Prisma):
    """Seed P2 questions: Addition/subtraction 1-100, Multiplication tables"""
    questions = []
    
    # Addition 1-100 (25 questions)
    for i in range(25):
        a = random.randint(10, 100)
        b = random.randint(10, 100)
        
        if random.random() < 0.6:  # 60% word problems
            question_text = f"A trotro has {a} passengers. {b} more get on. How many now?"
        else:
            question_text = f"{a} + {b} = ?"
        
        correct = a + b
        options = generate_options(correct)
        
        questions.append({
            "topic": "addition",
            "gradeLevel": "P2",
            "difficulty": 3,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} + {b} = {correct}"
        })
    
    # Subtraction 1-100 (25 questions)
    for i in range(25):
        a = random.randint(20, 100)
        b = random.randint(10, a)
        
        if random.random() < 0.6:
            question_text = f"A market has {a} mangoes. {b} are sold. How many left?"
        else:
            question_text = f"{a} - {b} = ?"
        
        correct = a - b
        options = generate_options(correct)
        
        questions.append({
            "topic": "subtraction",
            "gradeLevel": "P2",
            "difficulty": 3,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} - {b} = {correct}"
        })
    
    # Multiplication 2x, 5x, 10x (30 questions)
    tables = [2, 5, 10]
    for i in range(30):
        table = random.choice(tables)
        multiplier = random.randint(1, 10)
        
        if random.random() < 0.7:  # 70% word problems
            if table == 2:
                question_text = f"Each trotro seat holds 2 people. {multiplier} seats hold how many?"
            elif table == 5:
                question_text = f"Toffees cost GH₵{table} each. {multiplier} toffees cost how much?"
            else:  # 10
                question_text = f"Each box has {table} pencils. {multiplier} boxes have how many?"
        else:
            question_text = f"{table} × {multiplier} = ?"
        
        correct = table * multiplier
        options = generate_options(correct)
        
        questions.append({
            "topic": "multiplication",
            "gradeLevel": "P2",
            "difficulty": 3,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{table} × {multiplier} = {correct}"
        })
    
    return questions


async def seed_p3_questions(db: Prisma):
    """Seed P3 questions: All operations with larger numbers"""
    questions = []
    
    # Advanced addition (15 questions)
    for i in range(15):
        a = random.randint(100, 500)
        b = random.randint(100, 500)
        question_text = f"{a} + {b} = ?"
        correct = a + b
        options = generate_options(correct)
        
        questions.append({
            "topic": "addition",
            "gradeLevel": "P3",
            "difficulty": 4,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} + {b} = {correct}"
        })
    
    # Advanced subtraction (15 questions)
    for i in range(15):
        a = random.randint(200, 500)
        b = random.randint(100, a)
        question_text = f"{a} - {b} = ?"
        correct = a - b
        options = generate_options(correct)
        
        questions.append({
            "topic": "subtraction",
            "gradeLevel": "P3",
            "difficulty": 4,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} - {b} = {correct}"
        })
    
    # Advanced multiplication (20 questions)
    for i in range(20):
        a = random.randint(3, 12)
        b = random.randint(3, 12)
        
        if random.random() < 0.6:
            question_text = f"A classroom has {a} rows with {b} desks each. How many desks total?"
        else:
            question_text = f"{a} × {b} = ?"
        
        correct = a * b
        options = generate_options(correct)
        
        questions.append({
            "topic": "multiplication",
            "gradeLevel": "P3",
            "difficulty": 4,
            "questionText": question_text,
            "correctAnswer": correct,
            "option1": options[0],
            "option2": options[1],
            "option3": options[2],
            "option4": options[3],
            "explanation": f"{a} × {b} = {correct}"
        })
    
    return questions


async def main():
    """Main seeding function"""
    db = Prisma()
    await db.connect()
    
    try:
        print("🌱 Starting question seeding...")
        
        # Check if questions already exist
        existing_count = await db.question.count()
        if existing_count > 0:
            print(f"⚠️  Found {existing_count} existing questions. Deleting...")
            await db.question.delete_many()
        
        all_questions = []
        
        # Generate questions for each grade level
        print("📚 Generating KG1 questions...")
        kg1 = await seed_kg1_questions(db)
        all_questions.extend(kg1)
        print(f"   ✓ Generated {len(kg1)} KG1 questions")
        
        print("📚 Generating KG2 questions...")
        kg2 = await seed_kg2_questions(db)
        all_questions.extend(kg2)
        print(f"   ✓ Generated {len(kg2)} KG2 questions")
        
        print("📚 Generating P1 questions...")
        p1 = await seed_p1_questions(db)
        all_questions.extend(p1)
        print(f"   ✓ Generated {len(p1)} P1 questions")
        
        print("📚 Generating P2 questions...")
        p2 = await seed_p2_questions(db)
        all_questions.extend(p2)
        print(f"   ✓ Generated {len(p2)} P2 questions")
        
        print("📚 Generating P3 questions...")
        p3 = await seed_p3_questions(db)
        all_questions.extend(p3)
        print(f"   ✓ Generated {len(p3)} P3 questions")
        
        # Insert all questions
        print(f"\n💾 Inserting {len(all_questions)} questions into database...")
        for question in all_questions:
            await db.question.create(data=question)
        
        print(f"\n✅ Successfully seeded {len(all_questions)} questions!")
        print("\nBreakdown by grade level:")
        print(f"  KG1: {len(kg1)} questions")
        print(f"  KG2: {len(kg2)} questions")
        print(f"  P1:  {len(p1)} questions")
        print(f"  P2:  {len(p2)} questions")
        print(f"  P3:  {len(p3)} questions")
        
    finally:
        await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
