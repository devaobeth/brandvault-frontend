# BrandVault Frontend

React + TypeScript (Vite) client for BrandVault.

## Requirements

- Node.js 20+ (or current LTS)
- npm

## Setup (local)

```bash
cd frontend

cp .env.example .env
npm install
```

Edit `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Use your backend URL if the API is not on port 8000.

Then:

```bash
npm run dev
```

App runs at **http://localhost:5173**

## Demo login

With the backend seeded:

- Email: `demo@brandvault.dev`
- Password: `Demo1234!`
- Or use **Continue as demo** on the login page

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview production build
```

## Backend

Start the API first (see the backend README), then point `VITE_API_URL` at it.
