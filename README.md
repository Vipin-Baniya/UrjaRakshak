# ⚡ UrjaRakshak
### Physics-Based Energy Integrity & Grid Intelligence Platform

> *Energy is a civilizational lifeline. We protect it with intelligence, humility, and ethics.*

**Developer & Founder:** Vipin Baniya

---

## Overview

UrjaRakshak is a physics-first, AI-augmented platform for detecting electricity theft, quantifying grid losses, and protecting energy infrastructure — without surveillance or privacy violation.

**Core Principle:** Physics before AI. Every result is grounded in thermodynamics and electrical engineering. No black-box accusations.

---

## Project Structure

```
urjarakshak/
├── backend/                    # FastAPI backend (Python 3.11)
│   ├── app/
│   │   ├── api/v1/             # REST API endpoints
│   │   │   ├── analysis.py     # Grid analysis endpoints
│   │   │   └── grid.py         # Grid management
│   │   ├── core/               # Physics & AI engines
│   │   │   ├── physics_engine.py       # ⚡ Physics Truth Engine (572 lines)
│   │   │   └── attribution_engine.py   # 🔍 Loss Attribution Engine (606 lines)
│   │   ├── ethics/             # Ethics & audit framework
│   │   │   ├── audit_logger.py
│   │   │   └── safeguards.py
│   │   ├── grid/               # Grid topology & synthetic data
│   │   │   └── synthetic_generator.py
│   │   ├── schemas/            # Pydantic models
│   │   ├── tests/              # Test suite
│   │   ├── config.py           # Settings management
│   │   ├── database.py         # Async PostgreSQL
│   │   └── main.py             # FastAPI app entry
│   ├── render.yaml             # Render free-tier deploy config
│   ├── requirements.txt        # Full dependencies
│   └── requirements-render-free.txt   # Stripped for free tier
│
├── frontend/                   # Next.js frontend (TypeScript)
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Landing page
│       │   ├── dashboard/      # Grid monitoring dashboard
│       │   ├── docs/           # API documentation
│       │   └── layout.tsx      # Root layout (includes Footer)
│       ├── components/ui/      # Reusable UI components
│       │   ├── Footer.tsx      # Footer with developer credits
│       │   └── AnimatedNumber.tsx
│       ├── hooks/              # React hooks
│       └── lib/api.ts          # API client
│
├── deployment/
│   └── supabase/schema.sql     # Database schema
├── docker-compose.yml          # Local dev environment
├── ETHICAL_CHARTER.md          # Ethics framework
├── RENDER_FREE_DEPLOYMENT.md   # Step-by-step Render guide
└── LICENSE
```

---

## Quick Start (Local)

```bash
# 1. Clone and setup
git clone https://github.com/YOUR_USERNAME/urjarakshak.git
cd urjarakshak

# 2. Backend
cd backend
cp .env.example .env         # Edit with your values
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000

# 3. Frontend
cd ../frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# → http://localhost:3000
```

Or with Docker:
```bash
docker-compose up
```

---

## Free Deployment (100% $0/month)

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Render** | Backend hosting | 512MB RAM |
| **Supabase** | PostgreSQL database | 500MB |
| **Vercel** | Frontend hosting | Unlimited |

See [`RENDER_FREE_DEPLOYMENT.md`](./RENDER_FREE_DEPLOYMENT.md) for full step-by-step guide.

---

## API Endpoints

```
GET  /                          # System info
GET  /health                    # Health check
POST /api/v1/analysis/validate  # Grid loss analysis
GET  /api/v1/grid               # Grid data
GET  /api/v1/physics/info       # Physics engine info
GET  /api/v1/stats              # System statistics
```

---

## Tech Stack

**Backend:** Python 3.11 · FastAPI · SQLAlchemy Async · asyncpg · Pydantic v2 · NumPy  
**Frontend:** Next.js · TypeScript · TailwindCSS · Framer Motion  
**Database:** PostgreSQL (Supabase)  
**Deployment:** Render · Vercel · Docker  

---

## Ethics

UrjaRakshak is designed with an **Ethics Firewall**:
- No individual-level surveillance
- Conservative attribution (never over-accuse)
- Explicit confidence scores on all outputs
- Human-in-the-loop enforcement — AI recommends, humans decide
- Full audit logging

See [`ETHICAL_CHARTER.md`](./ETHICAL_CHARTER.md) for details.

---

**Developer & Founder:** Vipin Baniya  
**© 2026 UrjaRakshak. All rights reserved.**
