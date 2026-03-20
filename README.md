# FKS Library Catalog

An AI-powered library management system for Fremont Khalsa School. Browse the book catalog, view book details, place/cancel holds, checkout and return books, and chat with an AI assistant about the collection.

**Live app:** installable as a mobile app (PWA) on iOS and Android via the deployed URL.

## Features

- Sign up / sign in with a persistent user ID stored in the browser
- Browse and search the full book catalog
- View book details, place holds, checkout, return books, and cancel holds
- AI chatbot powered by OpenRouter (Gemini 2.0 Flash)
- Installable as a mobile app on any device (Progressive Web App)

## Tech Stack

| Layer    | Technology                                        |
|----------|---------------------------------------------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, PWA     |
| API      | Python Serverless Functions (Vercel)              |
| Database | Google Sheets (via gspread)                       |
| AI / LLM | OpenRouter → Gemini 2.0 Flash                     |
| Hosting  | Vercel (frontend + API, all-in-one)               |

---

## Deployment (Vercel only)

Everything — frontend and API — is hosted on Vercel. No separate backend service needed.

### 1. Import the repo

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import this GitHub repo.
3. Leave **Root Directory** blank (project root).
4. Vercel will auto-detect the build settings from `vercel.json`.

### 2. Set environment variables

In **Vercel → Project → Settings → Environment Variables**, add all three for Production, Preview, and Development:

| Variable | Value |
|---|---|
| `OPENROUTER_API_KEY` | Your key from [openrouter.ai/keys](https://openrouter.ai/keys) — starts with `sk-or-v1-` |
| `GOOGLE_CREDENTIALS_JSON` | Full contents of `service_account.json` as a single-line JSON string |

### 3. Deploy

Click **Deploy**. The app will be live at your Vercel URL.

### Installing as a mobile app (PWA)

**Android (Chrome):** Open the site → tap the three-dot menu → "Add to Home screen"

**iOS (Safari):** Open the site → tap the Share button → "Add to Home Screen"

---

## Local Development

### Prerequisites

- Python 3.11+ and pip
- Node.js 18+ and npm
- An [OpenRouter API key](https://openrouter.ai/keys)
- A Google Cloud service account with access to the library spreadsheet

### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a service account.
2. Enable the **Google Sheets API** and **Google Drive API**.
3. Download the service account JSON key and save it as `service_account.json` in the project root.
4. Share the Google Sheet named `"AI Project"` with the service account email (Editor access).

Sheet columns required:

| book_id | Title | Author | Language | Category | Shelf Location | status | holder_user_id | hold_until |
|---------|-------|--------|----------|----------|----------------|--------|----------------|------------|

### API setup

```bash
pip install -r api/requirements.txt
```

Create a `.env` file in the project root:

```
OPENROUTER_API_KEY=sk-or-v1-...
# GOOGLE_CREDENTIALS_JSON can be omitted locally — falls back to service_account.json
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend available at `http://localhost:5173`.

> During local dev the frontend calls `/api/*` which Vite won't proxy automatically. Test API calls against the deployed Vercel URL, or configure a proxy in `vite.config.ts`.

---

## API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| GET    | `/api/books`      | Get all books                      |
| POST   | `/api/hold`       | Place a hold on a book             |
| POST   | `/api/checkout`   | Checkout a book                    |
| POST   | `/api/returnbook` | Return a checked-out book          |
| POST   | `/api/cancelhold` | Cancel a hold                      |
| POST   | `/api/chat`       | Send a message to the AI assistant |

All POST endpoints accept JSON with `book_id` and `user_id` fields. `/api/chat` accepts `{ "query": "..." }`.

---

## Project Structure

```
AI Project/
├── api/
│   ├── books.py         # GET /api/books
│   ├── chat.py          # POST /api/chat (OpenRouter)
│   ├── hold.py          # POST /api/hold
│   ├── checkout.py      # POST /api/checkout
│   ├── returnbook.py    # POST /api/returnbook
│   ├── cancelhold.py    # POST /api/cancelhold
│   ├── sheets.py        # Google Sheets helpers
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── manifest.json    # PWA manifest
│   │   └── icon.svg
│   └── src/
│       ├── App.tsx          # Routing + auth guard + navbar
│       ├── api.ts           # Fetch helpers
│       ├── booklist.tsx     # Catalog page
│       └── pages/
│           ├── login.tsx
│           ├── bookdetails.tsx
│           └── chatbot.tsx
├── vercel.json
└── service_account.json     # NOT committed — local dev only
```

## Notes

- `service_account.json` must never be committed. In production, credentials are passed via `GOOGLE_CREDENTIALS_JSON`.
- OpenRouter API keys start with `sk-or-v1-` and are ~73 characters. A shorter key will cause authentication failures.
