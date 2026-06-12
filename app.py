"""
The Gravity — Tech company website backend.

A small Flask application that serves the marketing site and exposes a
JSON API for the contact form. Submitted messages are stored in a local
SQLite database (gravity.db).
"""

import os
import re
import sqlite3
from datetime import datetime, timezone

from flask import Flask, g, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "gravity.db")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

app = Flask(__name__)


# --------------------------------------------------------------------------- #
# Database helpers
# --------------------------------------------------------------------------- #
def get_db():
    """Return a per-request SQLite connection."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(_exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the messages table if it doesn't already exist."""
    db = sqlite3.connect(DATABASE)
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT    NOT NULL,
            email      TEXT    NOT NULL,
            message    TEXT    NOT NULL,
            created_at TEXT    NOT NULL
        )
        """
    )
    db.commit()
    db.close()


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.route("/")
def index():
    """Serve the single-page website."""
    return render_template("index.html")


@app.route("/api/contact", methods=["POST"])
def contact():
    """Validate and persist a contact-form submission."""
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    errors = {}
    if len(name) < 2:
        errors["name"] = "Please enter your name."
    if not EMAIL_RE.match(email):
        errors["email"] = "Please enter a valid email address."
    if len(message) < 10:
        errors["message"] = "Your message should be at least 10 characters."

    if errors:
        return jsonify(ok=False, errors=errors), 400

    db = get_db()
    db.execute(
        "INSERT INTO messages (name, email, message, created_at) VALUES (?, ?, ?, ?)",
        (name, email, message, datetime.now(timezone.utc).isoformat()),
    )
    db.commit()

    return jsonify(
        ok=True,
        message=f"Thanks, {name}! Your signal has reached The Gravity. We'll be in touch.",
    )


@app.route("/api/messages")
def messages():
    """Lightweight admin endpoint to review submissions (newest first)."""
    db = get_db()
    rows = db.execute(
        "SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC"
    ).fetchall()
    return jsonify([dict(row) for row in rows])


import os

if __name__ == "__main__":
    init_db()
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT",
    5000)),
        debug=False
    )
