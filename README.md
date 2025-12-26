# BYKI Admin Dashboard

Admin dashboard for managing the BYKI mobile app ecosystem.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Setup Instructions

1. **Firebase Configuration**
   - The app is configured to use Firebase project `oxhub-42c99`
   - Update `.env` file with your Firebase Web App ID from the Firebase Console
   - Ensure your Firebase project has Firestore, Authentication, and Storage enabled

2. **Create Admin User**
   - In Firebase Console > Authentication, create a user with email/password
   - In Firestore, create a document in the `users` collection with:
     ```json
     {
       "email": "your-admin@email.com",
       "name": "Admin Name",
       "role": "admin",
       "isActive": true
     }
     ```

3. **Run the App**
   ```bash
   npm run dev
   ```
   - Open http://localhost:5173
   - Login with your admin credentials

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── Charts/        # Chart components (StatsCard, RevenueChart, etc.)
│   ├── Common/        # Common components (StatusBadge, UserAvatar, etc.)
│   └── Layout/        # Layout components (AdminLayout, Sidebar)
├── config/            # Firebase and app configuration
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   ├── Auth/          # Login page
│   ├── Bookings/      # Booking management
│   ├── Catalog/       # Products, Workshops, Vouchers
│   ├── Dashboard/     # Main dashboard
│   ├── Emergency/     # Emergency requests
│   ├── Orders/        # Order management
│   ├── Settings/      # Admin settings
│   ├── Support/       # Support tickets
│   └── Users/         # User management
├── services/          # Firebase service layer
├── store/             # Zustand state management
├── types/             # TypeScript interfaces
└── utils/             # Utility functions
```

## Features

- 📊 **Dashboard** - Overview with stats, charts, and recent activity
- 📦 **Orders** - View and manage customer orders
- 📅 **Bookings** - Manage service appointments
- 🚨 **Emergency** - Real-time emergency request monitoring
- 💬 **Support** - Customer support ticket management
- 👥 **Users** - User management with detailed profiles
- 🛒 **Products** - Product catalog with inventory tracking
- 🔧 **Workshops** - Workshop/service center management
- 🎟️ **Vouchers** - Promotions and voucher management

## Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Ant Design 5.x (UI framework)
- Firebase (Auth, Firestore, Storage)
- Zustand (state management)
- React Query (data fetching)
- Recharts (charts)
- React Router v6 (routing)
