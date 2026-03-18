# FKS AI Library

An AI-powered library management system for Fremont Khalsa School. Browse the book catalog, view book details, place holds, and chat with an AI assistant about the collection.

**Live app:** installable as a mobile app (PWA) on iOS and Android via the deployed URL.

## Features

- Browse and search the full book catalog
- View individual book details and place holds
- AI chatbot powered by Google Gemini + RAG (semantic search over the catalog)
- Installable as a mobile app on any device (Progressive Web App)

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, PWA |
| Backend   | FastAPI, Python 3.11                          |
| Database  | Google Sheets (via gspread)                   |
| Vector DB | ChromaDB (in-memory)                          |
| AI / LLM  | Google Gemini 2.0 Flash + text-embedding-004  |

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)
- A Google Cloud service account with access to the library spreadsheet

### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a service account.
2. Enable the **Google Sheets API** and **Google Drive API**.
3. Download the service account JSON key and save it as `service_account.json` in the project root.
4. Share the Google Sheet named `"AI Project"` with the service account email (Editor access).

Sheet columns required:

| book_id | Title | Author | Language | Category | Shelf Location | status | holder_user_id | hold_until |
|---------|-------|--------|----------|----------|----------------|--------|----------------|------------|

### Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `backend/.env` file (copy from `backend/.env.example`):

```
GEMINI_API_KEY=your_key_here
# For local dev, GOOGLE_CREDENTIALS_JSON can be omitted — it falls back to service_account.json
```

Start the backend:

```bash
uvicorn backend.main:app --reload
```

API available at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

---

## Deployment

### Backend → Railway

1. Create a new project at [railway.app](https://railway.app) and connect this GitHub repo.
2. Set the **Root Directory** to `.` (project root).
3. Railway will detect Python and use the `Procfile` automatically.
4. Add these environment variables in the Railway dashboard:

   | Variable | Value |
   |---|---|
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `GOOGLE_CREDENTIALS_JSON` | The full contents of `service_account.json` as a single-line JSON string |
   | `FRONTEND_URL` | Your Vercel frontend URL (added after step below) |

5. Deploy. Copy the generated Railway URL (e.g. `https://fks-library-production.up.railway.app`).

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and import this GitHub repo.
2. Set the **Root Directory** to `frontend`.
3. Add this environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | Your Railway backend URL from above |

4. Deploy. Copy the Vercel URL and paste it back into Railway as `FRONTEND_URL`.

### Installing as a mobile app (PWA)

Once the frontend is deployed:

**Android (Chrome):** Open the site → tap the three-dot menu → "Add to Home screen"

**iOS (Safari):** Open the site → tap the Share button → "Add to Home Screen"

The app will install like a native app with its own icon and launch screen.

---

## API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| GET    | `/`               | Health check                       |
| GET    | `/books`          | Get all books from the catalog     |
| POST   | `/hold/{book_id}` | Place a hold on a book             |
| POST   | `/chat`           | Send a message to the AI assistant |

---

## Project Structure

```
AI Project/
├── backend/
│   ├── main.py              # FastAPI app and routes
│   ├── sheets.py            # Google Sheets integration
│   ├── rag.py               # Gemini embeddings + vector search
│   ├── vector_store.py      # ChromaDB setup
│   ├── requirements.txt
│   └── .env.example         # Environment variable template
├── frontend/
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── icon.svg         # App icon
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.js
│   │   ├── booklist.tsx
│   │   └── pages/
│   │       ├── bookdetails.tsx
│   │       └── chatbot.tsx
│   ├── vercel.json          # Vercel SPA routing
│   └── .env.example
├── Procfile                 # Railway start command
├── railway.toml             # Railway build config
└── service_account.json     # NOT committed — local dev only
```

## Notes

- The ChromaDB vector store is rebuilt on every backend startup (fast for a small catalog).
- `service_account.json` must never be committed. In production, credentials are passed via `GOOGLE_CREDENTIALS_JSON`.
