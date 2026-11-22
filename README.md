# FixMate (client)

FixMate is a device and appliance repair marketplace. Customers browse and book repair services, technicians manage
their services and requests, and admins manage users, service approvals, bookings and transactions.

- **Live site:** https://fixmate-client-chi-ten.vercel.app
- **API (separate repo):** https://fixmate-client-vs29.vercel.app

## Features

- Public pages: Home, Services (server-side search, category/mode filters, sort, pagination kept in the URL), Service Details, About
- Better Auth email/password and Google sign-in; sessions are kept after reload; protected routes redirect to Sign In
- Customer: book a service, view and cancel bookings, Stripe Checkout "Pay Now", payment history, profile update
- Technician: add, edit and delete services, manage requests (accept, reject, start work, complete)
- Admin: users and roles, service approvals, bookings, transactions
- Image uploads (avatars and service photos) through the API
- Loading, error, not-found and empty states; confirmation dialogs for destructive actions

## Tech and packages

Next.js (App Router), React, TypeScript, Tailwind CSS, `better-auth` (client + JWT plugin).

## Environment variables

Set these in `.env.local` (local) and in Vercel (Production and Preview). Names only:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Base URL of the API, **no trailing slash**, e.g. `https://fixmate-client-vs29.vercel.app`. Used by browser requests and by the `/api/auth/*` rewrite in `next.config.ts`. Falls back to `http://localhost:8000` in development. |

It is read at **build time**, so redeploy after changing it. It must be the API's base URL only, not a callback URL or this site's URL.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

## Admin access

Admin credentials are not stored in this repository. Use the admin account provided with the submission, or promote a
registered user to `admin` in the database (see the API repository's README), then sign in at `/sign-in`.
