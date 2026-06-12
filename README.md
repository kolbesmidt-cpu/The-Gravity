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
| POST   | `/api/contact`  | Validates and stores a contact message       |
| GET    | `/api/messages` | Returns all submitted messages (newest first)|

Contact submissions are stored in `gravity.db`. View them at
`http://127.0.0.1:5000/api/messages`.
