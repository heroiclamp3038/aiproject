# FKS AI Library

An AI-powered library management system for Fremont Khalsa School. It allows users to browse the book catalog, view book details, place holds, and chat with an AI assistant that can answer questions about the library's collection.

## Features

- Browse and search the full book catalog
- View individual book details
- Place holds on available books
- AI chatbot that uses RAG (Retrieval-Augmented Generation) to answer questions about the library

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS |
| Backend   | FastAPI, Python 3.11                |
| Database  | Google Sheets (via gspread)         |
| Vector DB | ChromaDB (in-memory)                |
| AI / LLM  | Ollama (llama3.1:8b + nomic-embed-text) |

---

## Prerequisites

Before running the project, make sure you have the following installed:

### System Requirements

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Ollama** — local LLM runner ([ollama.com](https://ollama.com))

### Ollama Models

After installing Ollama, pull the two required models:

```bash
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

Make sure the Ollama server is running before starting the backend:

```bash
ollama serve
```

### Google Sheets Service Account

The book catalog is stored in a Google Sheet. You need a Google Cloud service account with access to it:

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a service account.
2. Enable the **Google Sheets API** and **Google Drive API** for your project.
3. Download the service account JSON key file and save it as `service_account.json` in the project root.
4. Share your Google Sheet named `"AI Project"` with the service account's email address (give it Editor access).

The sheet must have the following columns:

| book_id | Title | Author | Language | Category | Shelf Location | status | holder_user_id | hold_until |
|---------|-------|--------|----------|----------|----------------|--------|----------------|------------|

---

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## Running the Project

### 1. Start the backend

From the project root:

```bash
uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`.

### 2. Start the frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Project Structure

```
AI Project/
├── backend/
│   ├── main.py           # FastAPI app and API routes
│   ├── sheets.py         # Google Sheets integration
│   ├── rag.py            # Embedding and vector search logic
│   ├── vector_store.py   # ChromaDB client setup
│   └── requirements.txt  # Python dependencies
├── frontend/
│   └── src/
│       ├── App.tsx               # Root app with routing
│       ├── booklist.tsx          # Book catalog page
│       └── pages/
│           ├── bookdetails.tsx   # Individual book page
│           └── chatbot.tsx       # AI chatbot page
├── service_account.json  # Google service account key (not committed)
└── README.md
```

---

## API Endpoints

| Method | Endpoint          | Description                        |
|--------|-------------------|------------------------------------|
| GET    | `/`               | Health check                       |
| GET    | `/books`          | Get all books from the catalog     |
| POST   | `/hold/{book_id}` | Place a hold on a book             |
| POST   | `/chat`           | Send a message to the AI assistant |

### Chat Request Body

```json
{
  "query": "Do you have any books about history?"
}
```

---

## Notes

- The ChromaDB vector store is in-memory and is rebuilt every time the backend starts. Books are automatically indexed from the Google Sheet on startup.
- `service_account.json` should never be committed to version control. Add it to `.gitignore`.
