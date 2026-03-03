# 🚀 Secure Multi-Tenant SaaS Platform

A full-stack multi-tenant SaaS application with isolated data, custom branding, JWT auth, AI-powered analytics, and AWS S3 storage.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | Passport.js + JWT |
| AI | Claude API (Anthropic) |
| Storage | AWS S3 |
| Deployment | Docker + Docker Compose |

## Features

-  **Multi-tenancy**: Tenant identification via subdomain or `X-Tenant-ID` header
-  **Data isolation**: All models scoped by `tenant` field with compound indexes
-  **Custom branding**: Logo upload (AWS S3), primary/secondary color themes applied via CSS variables
-  **Role-based auth**: `superadmin`, `admin`, `user` with JWT
-  **AI analytics**: Claude API generates weekly insights from usage logs
-  **Usage logging**: Automatic API activity tracking with 90-day TTL
-  **User management**: CRUD with per-tenant user limits
-  **Cron jobs**: Weekly reports auto-generated every Sunday midnight

## Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- (Optional) Anthropic API key, AWS credentials

### 1. Clone and setup

```bash
git clone <repo>
cd saas-platform
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env with your values
npm install
node utils/seed.js   # Seed demo data
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at: http://localhost:3000  
API runs at: http://localhost:5000

### Docker (full stack)

```bash
# Create .env from docker-compose.yml environment section
docker-compose up --build -d
docker-compose exec backend node utils/seed.js
```

## Demo Accounts

After running `npm run seed`:

| Role | Email | Password | Subdomain |
|------|-------|----------|-----------|
| Admin | admin@acme.com | Password123! | acme |
| User | user@acme.com | Password123! | acme |
| Admin | admin@techstart.io | Password123! | techstart |
| Superadmin | super@platform.com | SuperAdmin123! | platform-admin |

## API Reference

### Auth
- `POST /api/auth/register` — Create tenant + admin user
- `POST /api/auth/login` — Login (pass `subdomain` in body)
- `GET /api/auth/me` — Current user
- `PUT /api/auth/me` — Update profile
- `PUT /api/auth/change-password` — Change password

### Tenants
- `GET /api/tenants/current` — Get tenant info
- `PUT /api/tenants/branding` — Update logo/colors *(admin)*
- `PUT /api/tenants/settings` — Update settings *(admin)*
- `GET /api/tenants/check-subdomain/:sub` — Availability check

### Users
- `GET /api/users` — List users *(admin)*
- `POST /api/users` — Create user *(admin)*
- `PUT /api/users/:id` — Update user *(admin)*
- `DELETE /api/users/:id` — Delete user *(admin)*

### Analytics
- `GET /api/analytics/overview` — Usage metrics
- `GET /api/analytics/logs` — Raw usage logs
- `GET /api/analytics/reports` — Weekly AI reports
- `POST /api/analytics/generate-report` — Trigger AI report
- `POST /api/analytics/log` — Log frontend action

### Uploads
- `POST /api/uploads/logo` — Upload tenant logo
- `POST /api/uploads/avatar` — Upload user avatar

## Tenant Identification

Tenants are identified by (in priority order):
1. `X-Tenant-ID` header (recommended for API clients)
2. Subdomain (e.g., `acme.yourdomain.com`)
3. `?tenant=acme` query param (dev fallback)

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saas_platform
JWT_SECRET=your_secret
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=sk-ant-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket
FRONTEND_URL=http://localhost:3000
```

## Project Structure

```
saas-platform/
├── backend/
│   ├── config/         # DB, Passport, AWS configs
│   ├── middleware/      # Auth, tenant, error, rate limit
│   ├── models/          # Tenant, User, UsageLog, AnalyticsReport
│   ├── routes/          # auth, tenants, users, analytics, uploads, admin
│   ├── services/        # analyticsService (Claude AI), cronService
│   ├── utils/           # logger, asyncHandler, seed
│   └── server.js
├── frontend/
│   └── src/
│       ├── contexts/    # AuthContext (branding, state)
│       ├── pages/       # Login, Register, Dashboard, Users, Analytics, Reports, Branding, Settings, Profile
│       ├── components/  # DashboardLayout with sidebar
│       └── services/    # API client (axios)
├── docker-compose.yml
└── README.md
```
