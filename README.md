#  Shop Buddy - Modern Point of Sale & Management System

A comprehensive, multi-tenant Point of Sale (POS) and shop management system built with modern web technologies. Shop Buddy provides complete business management tools for retail operations with real-time activity tracking, staff management, and customer portals.

##  Key Features

###  **Multi-Role Authentication System**
- **Super Admin Portal**: System-wide management and shop approval
- **Shop Owner Dashboard**: Complete business oversight with staff monitoring
- **Staff Dashboard**: Daily operations with activity tracking
- **Customer Portal**: Order history, preferences, and account management

###  **Point of Sale System**
- Complete POS interface for retail transactions
- Real-time inventory updates
- Multiple payment method support
- Receipt generation and transaction history

###  **Business Management**
- **Real-time Activity Tracking**: Monitor all staff actions and system events
- **Inventory Management**: Product catalog, stock levels, and automated alerts
- **Customer Management**: Customer invitations, profiles, and order history
- **Staff Management**: Role-based access control and session monitoring
- **Analytics & Reporting**: Business insights, sales reports, and performance metrics

###  **Multi-Tenant Architecture**
- Shop registration and approval workflow
- Data isolation between different shops
- Scalable infrastructure for multiple businesses

##  Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible UI component library

### **Backend & Database**
- **Supabase** - Backend-as-a-Service platform
  - PostgreSQL database with real-time subscriptions
  - Built-in authentication and authorization
  - Row Level Security (RLS) for data isolation
  - Real-time updates for live activity tracking

### **State Management & Data**
- **TanStack Query (React Query)** - Server state management
- **React Hook Form** - Form handling with Zod validation
- **Zustand** - Client state management

### **UI & Visualization**
- **Recharts** - Data visualization and charts
- **Lucide React** - Modern icon system
- **Radix UI** - Headless UI primitives

### **Development & Testing**
- **Playwright** - End-to-end testing framework
- **ESLint** - Code linting and quality
- **PostCSS** - CSS processing

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/KeenanHusselmann/ShopBuddy.git
cd ShopBuddy
```

2. Install dependencies:
```bash
npm install
# or using bun (recommended for faster installation)
bun install
```

3. Set up environment variables:
Copy `env.example` to `.env.local` and configure your Supabase credentials:
```bash
cp env.example .env.local
```

Required environment variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up the database:
Run the provided SQL migrations in your Supabase project (see [Database Setup](#database-setup))

5. Start the development server:
```bash
npm run dev
# or with bun
bun run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser.

##  Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run Playwright tests
- `npm run test:ui` - Run tests with UI
- `npm run test:headed` - Run tests in headed mode

##  Project Structure

```
ShopBuddy/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/        # shadcn/ui components
│   │   └── ...        # Custom components
│   ├── pages/         # Application pages & routes
│   ├── hooks/         # Custom React hooks
│   ├── integrations/  # External service integrations
│   ├── lib/          # Utility libraries & configurations
│   ├── utils/        # Helper functions & utilities
│   └── types/        # TypeScript type definitions
├── supabase/
│   └── migrations/   # Database schema migrations
├── docs/            # Comprehensive documentation
├── tests/           # Playwright test files
├── public/          # Static assets
└── ...
```

##  Database Setup

The project uses Supabase with comprehensive database migrations including:

### Core Tables
- **Authentication & Profiles** - User management and role-based access
- **Multi-tenant Shop System** - Shop registration and data isolation
- **Staff Management** - Staff invitations, roles, and permissions
- **Customer Management** - Customer profiles and invitations
- **Product & Inventory** - Complete product catalog and stock management
- **Order Management** - Order processing and history
- **Activity Tracking** - Real-time staff activity logging

### Security Features
- **Row Level Security (RLS)** - Data isolation between shops
- **Role-based Permissions** - Granular access control
- **Audit Logging** - Complete activity tracking and monitoring

### Migration Setup
1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations/` directory
3. Enable real-time subscriptions for live updates
4. Configure RLS policies for data security

For detailed setup instructions, see [docs/SUPABASE_MIGRATION_INSTRUCTIONS.md](./docs/SUPABASE_MIGRATION_INSTRUCTIONS.md)

##  Key Features Implemented

###  **Real-time Activity Tracking**
- **Staff Activity Monitoring** - Track all staff actions in real-time
- **Session Management** - Monitor active staff sessions
- **Audit Trail** - Complete history of all system activities
- **Performance Analytics** - Staff productivity insights

###  **Advanced Security**
- **Multi-tenant Data Isolation** - Complete separation between shops
- **Role-based Access Control** - Granular permissions system
- **Real-time Security Monitoring** - Track access patterns and locations
- **Comprehensive Audit Logging** - Full compliance support

###  **Business Management**
- **Shop Registration Workflow** - Complete onboarding process
- **Staff Invitation System** - Secure staff onboarding
- **Customer Portal** - Self-service customer management
- **Inventory Alerts** - Automated low-stock notifications

##  Documentation

The [docs/](./docs/) directory contains comprehensive documentation:

### **Setup & Configuration**
- [Setup Instructions](./docs/setup.md)
- [Admin Setup Guide](./docs/ADMIN_SETUP.md)
- [Database Migration Instructions](./docs/SUPABASE_MIGRATION_INSTRUCTIONS.md)

### **Feature Documentation** 
- [Shop Registration Flow](./docs/SHOP_REGISTRATION_FLOW.md)
- [Staff & Customer System](./docs/STAFF_AND_CUSTOMER_SYSTEM.md)
- [Activity Tracking Setup](./docs/activity-tracking-setup.md)
- [Implementation Summary](./docs/IMPLEMENTATION_SUMMARY.md)

### **Development**
- [Routing Configuration](./docs/ROUTING_FIXES.md)
- [Authentication Portals](./docs/SEPARATE_AUTHENTICATION_PORTALS.md)
- [Database Schema](./docs/database-tables.md)

##  Testing

The project includes comprehensive end-to-end testing with Playwright:

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run specific test suites
npm run test:products
npm run test:slow
```

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run test && npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

###  **Built with modern technologies for scalable retail management**

**Shop Buddy** provides everything you need to run a modern retail business with comprehensive staff monitoring, customer management, and real-time business insights.
