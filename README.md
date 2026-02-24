# LO Commission Portal

A comprehensive commission tracking portal for Loan Officers.

## Features

### Phase 1 — Commission Dashboard
- Commission summary: current month total, YTD, breakdown by loan type
- Fee deductions & splits itemized
- Transaction history table with filters (date range, loan type, lender)
- Export to CSV

### Phase 2 — Loan Pipeline
- Active loans with pipeline stage badges (Application → Processing → Underwriting → Closing)
- Expected closing dates, projected commission

### Phase 3 — Lender Directory
- Lender cards: name, contact, loan types, commission rates
- Searchable + filterable

## Stack

- **Next.js 14** — App router
- **Convex** — Backend/database (shiny-bass-900)
- **Tailwind CSS** — Styling
- **Vercel** — Deployment

## Auth

Simple passphrase login. Set `NEXT_PUBLIC_PORTAL_PASSPHRASE` in your env (default: `revolvemtg`).

## Setup

```bash
cp .env.example .env.local
# Fill in your values

npm install
npx convex dev  # In separate terminal
npm run dev
```

## Mock Data

On first load, the app automatically seeds mock data for all three sections (transactions, loans, lenders). No real LOS connection required.

## TODO
- [ ] Connect to real LOS (Encompass, BytePro, etc.)
- [ ] Full auth system (per-user logins)
- [ ] Email notifications for commission payouts
- [ ] Goal tracking
