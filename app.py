"""
The Gravity — Tech company website backend.

A small Flask application that serves the marketing site and exposes a
JSON API for the contact form. Submitted messages are stored in a local
SQLite database (gravity.db).
"""

import os
import re
import smtplib
import sqlite3
from datetime import datetime, timezone
from email.message import EmailMessage

from flask import Flask, g, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "gravity.db")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# --------------------------------------------------------------------------- #
# Email configuration
#
# Contact-form messages are emailed to CONTACT_RECIPIENT. To actually send,
# set SMTP_USER + SMTP_PASS (a Gmail "App Password") as environment variables.
# If they are not set, messages are still saved to the database and the form
# keeps working — only the email step is skipped.
# --------------------------------------------------------------------------- #
CONTACT_RECIPIENT = os.environ.get("CONTACT_RECIPIENT", "sahidbapi2001@gmail.com")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")          # Gmail address you send FROM
SMTP_PASS = os.environ.get("SMTP_PASS")          # Gmail App Password
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or CONTACT_RECIPIENT)

app = Flask(__name__)


def send_contact_email(name, email, message):
    """Email a contact submission to CONTACT_RECIPIENT. Returns True on success."""
    if not (SMTP_USER and SMTP_PASS):
        app.logger.warning(
            "SMTP not configured (SMTP_USER/SMTP_PASS unset) — email skipped, "
            "message saved to database only."
        )
        return False

    msg = EmailMessage()
    msg["Subject"] = f"🪐 New Gravity enquiry from {name}"
    msg["From"] = SMTP_FROM
    msg["To"] = CONTACT_RECIPIENT
    msg["Reply-To"] = email  # so you can reply straight to the sender from Gmail
    msg.set_content(
        f"You received a new message from The Gravity contact form:\n\n"
        f"Name:  {name}\n"
        f"Email: {email}\n\n"
        f"Message:\n{message}\n"
    )

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.send_message(msg)
        app.logger.info("Contact email sent to %s", CONTACT_RECIPIENT)
        return True
    except Exception as exc:  # noqa: BLE001 - never let email break the request
        app.logger.error("Failed to send contact email: %s", exc)
        return False


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

    # Forward the message to the owner's inbox (best-effort).
    send_contact_email(name, email, message)

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


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
