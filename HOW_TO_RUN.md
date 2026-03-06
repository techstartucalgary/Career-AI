## Setup & Run

### Backend (Terminal 1 - Python 3.11 required)
```bash
cd backend;
py -3.11 -m venv .venv;
.venv\Scripts\activate;
pip install -r requirements.txt; # You can skip this step if its not your first time running the program
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend (Terminal 2)
```bash
cd frontend;
npm install;
npm run dev:expo;
```