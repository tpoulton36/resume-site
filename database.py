import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "portfolio.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_projects():
    conn = get_connection()
    projects = conn.execute(
        """
        SELECT title, description, github_url, technologies
        FROM projects
        ORDER BY display_order
        """
    ).fetchall()
    conn.close()
    return projects


def get_algorithms():
    conn = get_connection()
    algorithms = conn.execute(
        """
        SELECT key, name, description, time_complexity, space_complexity
        FROM algorithms
        ORDER BY display_order
        """
    ).fetchall()
    conn.close()
    return algorithms