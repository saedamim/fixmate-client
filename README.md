# FixMate — Frontend

A modern, responsive device and home appliance repair service booking platform built with Next.js. FixMate connects customers with technicians, allowing customers to explore repair services, request bookings, track repair progress, and make secure online payments.

**Live Website:** https://fixmate-client-chi-ten.vercel.app

**Backend API:** https://fixmate-client-vs29.vercel.app

## Features

### 1. Authentication
- Sign up and sign in using email and password.
- Google OAuth authentication.
- Role-based access for Customer, Technician, and Admin.
- Protected dashboard routes.
- User profile management.

### 2. Home Page
- Responsive navigation bar and footer.
- Hero section introducing FixMate.
- Featured repair services.
- Service categories.
- How It Works section.
- Call-to-action sections.

### 3. Services
- Browse available repair services.
- Search services by keyword.
- Filter services by category.
- Sort services by price.
- View detailed service information.
- Access services through category-based navigation.

### 4. Customer Dashboard
- View booking statistics.
- Track repair requests.
- View booking details and status.
- Cancel eligible booking requests.
- Pay for completed repair services.
- View payment history.

### 5. Technician Dashboard
- Add new repair services.
- Edit and delete owned services.
- Manage service availability.
- View incoming repair requests.
- Accept or reject requests.
- Update repair progress.
- Mark jobs as completed.

### 6. Admin Dashboard
- Manage users and user roles.
- Review and approve technician services.
- Monitor all bookings.
- View payment transactions.
- Monitor platform statistics and revenue.

### 7. Additional Features
- Responsive design for mobile, tablet, and desktop.
- Image upload through ImgBB.
- Loading, error, and empty states.
- Toast notifications and confirmation dialogs.
- Stripe Checkout integration.

## How It Works

### Customer Workflow
1. Create an account or sign in.
2. Browse available repair services.
3. Select a service and submit a repair request with issue details.
4. Track the booking status from the dashboard.
5. The technician accepts and completes the repair.
6. Once the booking is completed, pay securely through Stripe Checkout.
7. View payment history.

### Technician Workflow
1. Sign in as a technician.
2. Add repair services with descriptions, pricing, and images.
3. Wait for admin approval.
4. Receive customer repair requests.
5. Accept or reject requests.
6. Update the repair status as work progresses.
7. Mark the repair as completed.

### Admin Workflow
1. Sign in as an admin.
2. Manage registered users and their roles.
3. Review technician service listings.
4. Approve or manage services.
5. Monitor bookings and payment transactions.
6. Track platform revenue.

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- Better Auth
- Stripe Checkout
- ImgBB
- Lucide React



## Backend Repository

https://github.com/saedamim/fixmate-serversite

## Deployment

The frontend is deployed on Vercel:

https://fixmate-client-chi-ten.vercel.app
