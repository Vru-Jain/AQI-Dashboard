# Community Health & Air Quality Dashboard

British Council Climate Action Project — analyzing respiratory health and pollution exposure from community survey data (161 responses).

## Architecture

- **Frontend**: Next.js 16 + shadcn/ui + Recharts → Vercel
- **Backend**: FastAPI + scikit-learn → Render

## Quick Start

```bash
# Backend (Terminal 1)
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

## Deployment

### Backend → Render
1. Create a **Web Service** on [render.com](https://render.com)
2. Root directory: `backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend → Vercel
1. Import project on [vercel.com](https://vercel.com)
2. Root directory: `frontend`
3. Environment variable: `NEXT_PUBLIC_API_URL` = `https://your-api.onrender.com`
