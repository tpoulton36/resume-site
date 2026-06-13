import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "portfolio.db"
SCHEMA_PATH = Path(__file__).parent / "schema.sql"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

with open(SCHEMA_PATH, "r") as schema_file:
    cursor.executescript(schema_file.read())

projects = [
    (
        "Resume Website (Flask)",
        "A personal portfolio and resume website built using Flask, HTML, CSS, and JavaScript. Features custom styling, responsive design, and an interactive algorithm visualization section.",
        "https://github.com/tpoulton36/resume-site",
        "Flask, HTML, CSS, JavaScript",
        1
    ),
    (
        "GAM-303 Platformer Prototype (Unreal Engine 5)",
        "A 3D platformer prototype developed in Unreal Engine 5 featuring puzzle mechanics, interactive objects, collectibles, and documented development milestones.",
        "https://github.com/tpoulton36/GAM-303",
        "Unreal Engine 5, Blueprint",
        2
    ),
    (
        "CS-465 Full Stack Application",
        "An ongoing full stack web development project utilizing modern web technologies, backend development concepts, and database integration.",
        "https://github.com/tpoulton36/CS-465-fullstack",
        "Node.js, Express, MongoDB",
        3
    )
]

cursor.executemany(
    """
    INSERT INTO projects
    (title, description, github_url, technologies, display_order)
    VALUES (?, ?, ?, ?, ?)
    """,
    projects
)

algorithms = [
    (
        "bubble",
        "Bubble Sort",
        "Simple comparison-based sorting algorithm.",
        "O(n²)",
        "O(1)",
        1
    ),
    (
        "optimizedBubble",
        "Optimized Bubble Sort",
        "Bubble sort with early termination when already sorted.",
        "O(n²)",
        "O(1)",
        2
    ),
    (
        "selection",
        "Selection Sort",
        "Repeatedly selects the minimum element.",
        "O(n²)",
        "O(1)",
        3
    ),
    (
        "insertion",
        "Insertion Sort",
        "Builds the final sorted array one item at a time.",
        "O(n²)",
        "O(1)",
        4
    )
]

cursor.executemany(
    """
    INSERT INTO algorithms
    (key, name, description, time_complexity, space_complexity, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
    """,
    algorithms
)

conn.commit()
conn.close()

print("Database created and seeded successfully.")