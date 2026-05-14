🧮 Math Solver Web

A simple web application for solving mathematical expressions using a
Python backend and a lightweight frontend.

Простое веб-приложение для решения математических выражений с
использованием Python (backend) и HTML/CSS/JS (frontend).

------------------------------------------------------------------------

⚠️ **PROJECT STATUS: IN PROGRESS**

This project is currently under active development. Features and functionality may change.

------------------------------------------------------------------------

🚀 Features / Возможности

-   Solve math expressions
-   Web interface
-   Python backend
-   API endpoint
-   Cookie-based session state
-   Unit tests

------------------------------------------------------------------------

📁 Project Structure

math-solver-web-main/ │ ├── backend/ │ ├── app.py # Main server (API) │
└── solver.py # Math solving logic │ ├── frontend/ │ ├── index.html # UI
│ ├── style.css # Styles │ └── script.js # Frontend logic │ ├── tests/ │
├── practice_oop.py │ └── test_solver.py │ ├── docs/ │ └── notes.md │
└── requirements.txt

------------------------------------------------------------------------

⚙️ Installation / Установка

1)  Clone repository

git clone https://github.com/your-username/math-solver-web.git cd
math-solver-web

2)  Install dependencies

pip install -r requirements.txt

Note: Redis is not required in the current version. Solver state is stored
in Flask signed session cookies.

------------------------------------------------------------------------

▶️ Run Backend

cd backend python app.py

Server will start on: http://localhost:5000

Session behavior:

-   Backend stores solver state in browser cookies via Flask sessions.
-   Frontend requests must include credentials to keep the same session.

Example fetch config:

```javascript
fetch("http://localhost:5000/api/set_formula", {
	method: "POST",
	credentials: "include",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ formula_string: "S=v*t" })
});
```

------------------------------------------------------------------------

🌐 Run Frontend

Open frontend/index.html in your browser.

------------------------------------------------------------------------

🧪 Run Tests

pytest

or

python -m pytest

------------------------------------------------------------------------

🛠️ Technologies Used

-   Python
-   Flask (backend)
-   HTML / CSS / JavaScript
-   PyTest

------------------------------------------------------------------------

📌 Future Improvements

-   More math operations
-   Better UI
-   Error handling
-   Deployment

------------------------------------------------------------------------

👨‍💻 Author

Student project — Software Engineering
