# masa-internal-dashboard

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_4KJ5nab4WRBWyKKEx1DUZCwoKSzU)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project structure

This app uses the standard Next.js App Router layout: **routes** live under `app/`, **UI components** live under `components/`, and **data/helpers** live under `lib/`.

```
app/
├── layout.tsx                  # Root HTML shell, fonts, global styles
└── (dashboard)/                # Route group — all dashboard pages share a sidebar layout
    ├── layout.tsx              # Sidebar wrapper (DashboardLayout)
    ├── page.tsx                # / — MRR & ARR
    ├── unit-economics/page.tsx # /unit-economics
    └── accounts/page.tsx       # /accounts

components/
├── dashboard-layout.tsx        # SidebarProvider + AppSidebar shell
├── dashboard-page.tsx          # Per-page header + <main> wrapper
├── app-sidebar.tsx             # Navigation
├── charts/                     # Shared chart primitives (date pickers, currency toggle, etc.)
├── mrr-arr/                    # Components for the MRR & ARR page
├── unit-economics/             # Components for the Unit Economics page
├── accounts/                   # Components for the Accounts page
└── ui/                         # shadcn/ui primitives

lib/
├── finance/
│   ├── shared.ts               # Types, time series, formatting utilities
│   ├── mrr-arr.ts              # MRR/ARR KPIs and range filtering
│   └── unit-economics.ts       # Revenue & receivables filtering
└── accounts-data.ts            # Bank accounts and transactions
```

### Page → component mapping

| Route | Page file | Components |
|---|---|---|
| `/` | `app/(dashboard)/page.tsx` | `components/mrr-arr/` |
| `/unit-economics` | `app/(dashboard)/unit-economics/page.tsx` | `components/unit-economics/` |
| `/accounts` | `app/(dashboard)/accounts/page.tsx` | `components/accounts/` |

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
