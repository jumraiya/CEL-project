# Prerequisites

- Ensure Python 3 is installed.

- Ensure node and npm is installed

# API Setup

cd backend

python3 -m venv .venv

source ./.venv/bin/activate

pip install -r requirements.txt

flask init-db

flask run --port 5000

# Frontend Setup

cd client

npm install

npm run dev

# Usage

After starting both the api and frontend dev server navigate to http://localhost:5173/

Click `Add Event` and try creating both recurring and non-recurring events

# Implementation Notes

SQLite was used for persistence , in production I would use Postgresql. 
The data types available for SQLite are limited so I had to use integer timestamps to represent event datetimes.
Postgres has better data types for representing time ranges which would be useful for an app like this

Most of my backend development experience is with Java so I was unfamiliar with tools available in Python.
I went with Flask as the api server due to it's lightweight nature. I would probably use a more batteries included framework like Django for production apps.
I also eschewed the use of an ORM library due to time constraints.

For the frontend, material UI components were used.
