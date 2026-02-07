# How to Run CareerCompanion

## Quick Start

### Terminal 1: Backend (FastAPI)

```bash
cd backend
source .venv311/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend runs on: **http://127.0.0.1:8000**

---

### Terminal 2: Frontend (Expo)

```bash
cd frontend
npx expo start --web
```

OR

```bash
cd frontend
npm run dev:web
```

Frontend will open in your browser automatically.

---

## First Time Setup

### Backend Setup

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env with your settings
# Set LLM_PROVIDER=gemini or ollama
# Add GEMINI_API_KEY or configure Ollama

# Install dependencies
pip install -r requirements.txt

# Make sure MongoDB is running
brew services start mongodb-community
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# That's it!
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE=mongodb://localhost:27017
DATABASE_INFO=career_ai

# JWT
JWT_SECRET=your_secret_key_here

# LLM Provider
LLM_PROVIDER=gemini    # or "ollama"

# Gemini (if using cloud)
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Ollama (if using local)
OLLAMA_MODEL=phi4-mini
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Using Ollama (Local Model)

```bash
# Install Ollama
brew install ollama

# Pull model
ollama pull phi4-mini

# Start server
ollama serve

# Update backend/.env
LLM_PROVIDER=ollama
OLLAMA_MODEL=phi4-mini

# Restart backend
```

---

## Troubleshooting

### Backend Issues

**"Could not connect to MongoDB"**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**"Module not found"**
```bash
cd backend
source .venv311/bin/activate
pip install -r requirements.txt
```

**"Could not connect to Ollama"**
```bash
ollama serve
```

---

### Frontend Issues

**"Cannot find module 'expo'"**
```bash
cd frontend
npm install
```

**"Port already in use"**
```bash
# Kill the process
lsof -ti:8081 | xargs kill -9
# Or
lsof -ti:19000 | xargs kill -9
```

**Still showing wrong title/logo?**
- Make sure you're using `npx expo start --web` NOT `npm run dev`
- `npm run dev` runs Vite (different setup)
- `npm run dev:web` runs Expo (correct one)

---

## Other Frontend Options

```bash
# Run on iOS simulator
npm run dev:ios

# Run on Android emulator
npm run dev:android

# Open Expo dev menu
npm run dev:expo
```

---

## Quick Commands

**Start both (in separate terminals):**
```bash
# Terminal 1
cd backend && source .venv311/bin/activate && uvicorn main:app --reload

# Terminal 2
cd frontend && npx expo start --web
```

---

## URLs

| Service | URL |
|---------|-----|
| Frontend (Expo) | Opens automatically in browser |
| Backend API | http://127.0.0.1:8000 |
| Backend Docs | http://127.0.0.1:8000/docs |
| MongoDB | mongodb://localhost:27017 |

---

## Notes

- The project has TWO frontend setups:
  - **Expo** (app/ directory) - Use this one with `npx expo start --web` ✅
  - **Vite** (src/ directory) - Alternative setup with `npm run dev`

- Most development should use the Expo setup for consistency across web/mobile

---

Happy coding! 🚀
