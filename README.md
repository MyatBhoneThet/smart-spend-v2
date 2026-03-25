# Smart Spend (Senior Project)

Full-stack personal finance tracker with:
- `frontend/`: React + Vite UI
- `backend/`: Node.js + Express API

## Project Structure

```text
senior_project/
├── backend/
├── frontend/
├── docker-compose.yml
└── Jenkinsfile
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or cloud URI)

## Quick Start (Local)

### 1. Start Backend

```bash
cd backend
npm install
```

Create `backend/.env` (example):

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

Run backend:

```bash
npm run dev
```

### 2. Start Frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

Run frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8000`

## Docker (Optional)

If your compose setup is configured, run from project root:

```bash
docker compose up --build
```

## Notes

- If you see `ERR_CONNECTION_REFUSED` on `/api/v1/auth/me`, backend is not running or `VITE_API_BASE_URL` is wrong.
- Google OAuth 403 origin errors mean Google OAuth allowed origins need to include your frontend URL (for local: `http://localhost:5173`).

## More Details

- Backend docs: [`backend/README.md`](./backend/README.md)
- Frontend docs: [`frontend/README.md`](./frontend/README.md)
t
