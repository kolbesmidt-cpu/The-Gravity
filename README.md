# 🪐 The Gravity

A full-stack tech-company website with a **3D animated universe background**,
animated hero text, scroll-reveal motion, and a working contact form.

- **Backend:** Python · Flask · SQLite
- **Frontend:** HTML · CSS · JavaScript
- **3D background:** [Three.js](https://threejs.org) (animated spiral galaxy + starfield)
- **Animations:** [GSAP](https://gsap.com) + ScrollTrigger and custom CSS

## Project structure

```
new project/
├─ app.py                  # Flask server + /api/contact API (SQLite)
├─ requirements.txt
├─ gravity.db              # created automatically on first run
├─ templates/
│  └─ index.html           # the website
└─ static/
   ├─ css/style.css        # cosmic theme & animations
   └─ js/
      ├─ space.js          # Three.js 3D universe
      └─ main.js           # GSAP animations + contact form
```

## Run it

From the project folder:

```bash
# 1. (optional) create a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 2. install dependencies
pip install -r requirements.txt

# 3. start the server
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

> The Three.js and GSAP libraries load from a CDN, so an internet connection is
> needed the first time you open the page.

## API

| Method | Route           | Description                                  |
|--------|-----------------|----------------------------------------------|
| GET    | `/`             | Serves the website                           |
| POST   | `/api/contact`  | Validates, stores, and emails a message      |
| GET    | `/api/messages` | Returns all submitted messages (newest first)|

Contact submissions are always stored in `gravity.db` (view them at
`http://127.0.0.1:5000/api/messages`) **and** emailed to
`sahidbapi2001@gmail.com` once email is configured.

## 📧 Get contact messages in your Gmail

Messages are emailed using Gmail's SMTP server. Gmail no longer allows your
normal password for this — you need a free **App Password**:

1. Turn on **2-Step Verification**: <https://myaccount.google.com/security>
2. Create an App Password: <https://myaccount.google.com/apppasswords>
   (choose "Mail" → any device name → it gives you a 16-character code).
3. Before starting the server, set two environment variables:

   **Windows (PowerShell):**
   ```powershell
   $env:SMTP_USER = "sahidbapi2001@gmail.com"
   $env:SMTP_PASS = "your16charapppassword"   # no spaces
   python app.py
   ```

   **Windows (Command Prompt):**
   ```cmd
   set SMTP_USER=sahidbapi2001@gmail.com
   set SMTP_PASS=your16charapppassword
   python app.py
   ```

   **macOS / Linux:**
   ```bash
   export SMTP_USER="sahidbapi2001@gmail.com"
   export SMTP_PASS="your16charapppassword"
   python app.py
   ```

That's it — every contact submission now lands in your Gmail inbox, with the
sender's address set as **Reply-To** so you can reply to them directly.

> If `SMTP_USER` / `SMTP_PASS` aren't set, the site still works perfectly —
> messages are just saved to `gravity.db` and the email step is skipped.

Optional overrides: `CONTACT_RECIPIENT` (where mail is sent),
`SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT`.
