DROP TABLE IF EXISTS event;

CREATE TABLE event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    start_datetime INTEGER,
    end_datetime INTEGER,
    start_time INTEGER,
    end_time INTEGER,
    recurring INTEGER DEFAULT 0,
    recurring_days TEXT
);