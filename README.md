# WorkLink (Kaam-Do)

Full-stack starter for the local jobs and on-demand services platform.

## Stack

- Frontend: React + Tailwind CSS (Vite)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Project Structure

- `frontend` - React client
- `backend` - Express API

## Quick Start

### 1) Backend setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

API runs on `http://localhost:5000`.

### 2) Frontend setup

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Endpoints

- `GET /api/health`
- `GET /api/jobs?q=keyword`
- `POST /api/jobs`
- `GET /api/services`
- `POST /api/services`
- `GET /api/applications?jobId=<jobId>`
- `POST /api/applications`

## First Iteration Includes

- Post a local job
- Search job listings
- View on-demand service providers
- Apply to jobs from the frontend
- Add service provider profiles from the frontend
