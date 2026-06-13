DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS algorithms;

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    github_url TEXT NOT NULL,
    technologies TEXT NOT NULL,
    display_order INTEGER NOT NULL
);

CREATE TABLE algorithms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    time_complexity TEXT NOT NULL,
    space_complexity TEXT NOT NULL,
    display_order INTEGER NOT NULL
);