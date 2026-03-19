# FKS AI Library

An AI-powered library management system for Fremont Khalsa School. Browse the book catalog, view book details, place holds, and chat with an AI assistant about the collection.

**Live app:** installable as a mobile app (PWA) on iOS and Android via the deployed URL.

## Features

- Browse and search the full book catalog
- View individual book details and place holds
- AI chatbot powered by Google Gemini
- Installable as a mobile app on any device (Progressive Web App)

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, PWA |
| API      | FastAPI (Python), Vercel Serverless Functions  |
| Database | Google Sheets (via gspread)                   |
| AI / LLM | Google Gemini 1.5 Flash                       |
| Hosting  | Vercel (frontend + backend, all-in-one)        |

---

## Deployment (Vercel only)

Everything — frontend and backend — is hosted on Vercel.

### 1. Import the repo

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import this GitHub repo.
3. Leave **Root Directory** blank (project root).
4. Vercel will auto-detect the build settings from `vercel.json`.

### 2. Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `GOOGLE_CREDENTIALS_JSON` | The full contents of `service_account.json` as a single-line JSON string |

### 3. Deploy

Click **Deploy**. That's it — no separate backend service needed.

### Installing as a mobile app (PWA)

Once deployed:

**Android (Chrome):** Open the site → tap the three-dot menu → "Add to Home screen"

**iOS (Safari):** Open the site → tap the Share button → "Add to Home Screen"

---

## Local Development

### Prerequisites

- Python 3.11+ and pip
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

### Backend (API) setup

```bash
pip install -r api/requirements.txt
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_key_here
# For local dev, GOOGLE_CREDENTIALS_JSON can be omitted — falls back to service_account.json
```

Start the backend locally:

```bash
uvicorn api.index:app --reload
```

API available at `http://localhost:8000`.

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

> During local dev, the frontend calls `/api/*` which Vite's dev server won't proxy automatically. Either run both and configure a proxy in `vite.config.ts`, or test against the deployed Vercel URL.

---

## API Endpoints

| Method | Endpoint              | Description                        |
|--------|-----------------------|------------------------------------|
| GET    | `/api/books`          | Get all books from the catalog     |
| POST   | `/api/hold/{book_id}` | Place a hold on a book             |
| POST   | `/api/chat`           | Send a message to the AI assistant |

---

## Project Structure

```
AI Project/
├── api/
│   ├── index.py             # FastAPI app + Mangum serverless handler
│   ├── sheets.py            # Google Sheets integration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── icon.svg         # App icon
│   └── src/
│       ├── App.tsx
│       ├── api.ts           # Fetch helpers (relative /api/* paths)
│       ├── booklist.tsx
│       └── pages/
│           ├── bookdetails.tsx
│           └── chatbot.tsx
├── vercel.json              # Vercel build + routing config
└── service_account.json     # NOT committed — local dev only
```

## Notes

- `service_account.json` must never be committed. In production, credentials are passed via `GOOGLE_CREDENTIALS_JSON`.
- The Gemini API key must be created through [AI Studio](https://aistudio.google.com/app/apikey) to have free tier quota.
