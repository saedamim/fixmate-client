# FixMate — Frontend

A modern, responsive device and home appliance repair service booking platform built with Next.js. FixMate connects customers with technicians, allowing customers to explore repair services, request bookings, track repair progress, and make secure online payments.

**Live Website:** https://fixmate-client-chi-ten.vercel.app

**Backend API:** https://fixmate-client-vs29.vercel.app

## Features

### Authentication
- Sign up with name, email, password and a role (Customer or Technician). Admin accounts cannot be created from the form.
- Password rules: at least 6 characters, one uppercase and one lowercase letter, with errors shown under the field.
- Sign in with email and password, or with Google.
- Signed-in users are sent to the page they asked for, or to their own dashboard.
- Protected dashboards for every role, and a profile page (name, phone, area, bio, photo).

### Public site
- Sticky navbar with the active page highlighted, a mobile menu, and an avatar menu with the role's dashboard links.
- Home page with a hero, featured services, categories, How it works and Why FixMate sections.
- Services page with server-side search, category and service mode filters, sorting and pagination. Filters stay in the URL.
- Service details with price, duration, mode, service area and a technician summary.

### Customer
- Request a repair with phone, address, preferred date and a problem description.
- Track bookings by status, cancel while a request is still pending, and see the bill the technician sends.
- Pay completed jobs with Stripe Checkout, and view payment history.

### Technician
- Add services with an image upload, edit and delete them, and see their approval status.
- Manage requests: accept or reject, start work, and complete the job by sending a bill.
- Overview with services, pending requests and earnings.

### Admin
- Overview of users, services, bookings and revenue.
- Change user roles, approve or reject services, view all bookings and every transaction.

### Quality
- Responsive layout, loading skeletons, error and not-found pages, empty states.
- Toast notifications and confirmation dialogs for destructive actions.

## How It Works

1. A customer or technician signs up and chooses a role.
2. A technician adds a service. It stays pending until an admin approves it.
3. A customer sends a repair request for an approved service.
4. The technician accepts it, starts the work and completes it by sending the final bill.
5. The customer sees **Pay Now** and pays with Stripe. The backend confirms the payment and marks the booking paid.
6. The admin monitors users, services, bookings and transactions.

## Demo Accounts

The Sign in page lists ready-to-use accounts. Passwords are never shown there.

| Role | Email | Password |
| --- | --- | --- |
| Admin | yeasminmem@gmail.com | _add the admin password here_ |

Stripe runs in test mode. Use the card `4242 4242 4242 4242` with any future date and any CVC.

## Technologies Used

- [Next.js](https://nextjs.org/) (App Router) and React
- TypeScript
- Tailwind CSS
- [Better Auth](https://www.better-auth.com/) for sessions and sign in
- [Sonner](https://sonner.emilkowal.ski/) for toast notifications
- Stripe Checkout (through the backend)
- ImgBB for image uploads (through the backend)

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file in the project root (it is git-ignored):

```
NEXT_PUBLIC_BETTER_AUTH_URL=<URL of the Express API>
```

Requests to `/api/auth/*` are forwarded to that API by `next.config.ts`, so the session cookie belongs to this site.

## Backend Repository

https://github.com/saedamim/fixmate-serversite

## Deployment

The frontend is deployed on Vercel:

https://fixmate-client-chi-ten.vercel.app
