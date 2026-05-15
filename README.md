🧮 Math Solver Web

A modern web application for solving mathematical expressions using a Python Flask backend and a component-based JavaScript frontend with Web Components.

Современное веб-приложение для решения математических выражений с использованием Python Flask (backend) и Web Components (frontend).

---

⚠️ **PROJECT STATUS: ONGOING - ACTIVE DEVELOPMENT**

This project is under continuous development. Features, structure, and functionality are subject to change as the project evolves.

---

🚀 Features / Возможности

- Solve mathematical expressions with variable substitution
- Multi-page interactive web interface
- Python Flask REST API backend
- Web Components-based modular frontend
- Session state management via secure Flask cookies
- Formula input and variable configuration pages
- Result recommendations and visualization
- Unit tests for solver logic
- Responsive UI with Tailwind CSS

---

📁 Project Structure

```
math-solver-web/
├── backend/
│   ├── app.py              # Flask API server
│   ├── solver.py           # Math solving engine
│   └── tests/
│       └── test_solver.py  # Unit tests
│
├── frontend/
│   ├── components/
│   │   ├── MainPage/       # Landing page component
│   │   ├── SolverHomePage/ # Formula entry page
│   │   ├── SolverVariablesPage/  # Variable configuration
│   │   └── UiPopup/        # Popup/modal component
│   │
│   ├── services/
│   │   ├── API.js          # Backend API client
│   │   ├── Router.js       # Client-side routing
│   │   ├── vDOMService.js  # Virtual DOM utilities
│   │   ├── PopupService.js # Popup management
│   │   └── ScreenContextService.js  # Screen state management
│   │
│   └── data/               # Data resources
│
├── src/
│   └── input.css           # Tailwind CSS input
│
├── stitch_math_solver_sweeper/  # Legacy/archived modules
│
├── docs/                   # Documentation
│
├── app.js                  # Main application entry point
├── index.html              # HTML shell
├── package.json            # Node.js dependencies (Tailwind CSS)
├── requirements.txt        # Python dependencies
└── README.md
```

---

⚙️ Installation / Установка

1. Clone repository

```bash
git clone https://github.com/keesouwoudba/math-solver-web.git
cd math-solver-web
```

2. Create and activate Python virtual environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install Python dependencies

```bash
pip install -r requirements.txt
```

4. Install Node.js dependencies (for Tailwind CSS)

```bash
npm install
```

---

▶️ Run Backend

```bash
cd backend
python app.py
```

Backend server will start on: **http://localhost:5000**

**Session behavior:**

- Backend stores solver state in browser cookies via Flask sessions
- Signed with secure secret key for safety
- Frontend requests must include `credentials: "include"` to maintain session

**Example API request:**

```javascript
fetch("http://localhost:5000/api/set_formula", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ formula_string: "S=v*t" }),
});
```

---

🌐 Run Frontend

1. Build Tailwind CSS:

```bash
npm run build
```

Or for development (watch mode):

```bash
npm run dev
```

2. Open in browser:

```bash
# Serve index.html through a local web server
# (not just opening as file:// to allow module imports)
python -m http.server 8000
# Then visit: http://localhost:8000
```

---

🧪 Run Tests

```bash
pytest
# or
python -m pytest
```

---

🛠️ Technologies Used

**Backend:**

- Python 3
- Flask (REST API framework)
- Flask-CORS (cross-origin requests)
- Matplotlib (visualization)

**Frontend:**

- Vanilla JavaScript (ES6 modules)
- Web Components (custom elements)
- Tailwind CSS (utility-first styling)
- Client-side routing

**Testing:**

- PyTest

---

📌 Current Development Areas

- Formula parsing and solving improvements
- Variable handling and validation
- UI/UX refinements
- Additional math operations
- Error handling and edge cases
- Deployment pipeline setup

---

👨‍💻 Authors & Contributors

Student project — Software Engineering

Repository: https://github.com/keesouwoudba/math-solver-web
