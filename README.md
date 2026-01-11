# Zaydo - SaaS Project Management Platform

A modern, full-stack SaaS platform for commercial and industrial project management, built with Next.js 14, TypeScript, TailwindCSS, and shadcn/ui.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Beautiful UI**: shadcn/ui components with dark mode support
- **Authentication**: JWT-based auth with refresh token handling
- **Multi-tenancy**: Built-in tenant context for multi-company support
- **State Management**: React Query (TanStack Query) for server state
- **Form Validation**: React Hook Form with Zod schemas
- **Charts & Analytics**: Recharts for data visualization
- **Responsive Design**: Mobile-first, works on all devices

## 🛠️ Tech Stack

### Core

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS

### UI Components

- **shadcn/ui** - Accessible component library
- **Lucide React** - Icon library
- **Recharts** - Charts and data visualization
- **next-themes** - Dark mode support

### State & Data

- **TanStack Query (React Query)** - Server state management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Set up environment variables**
   Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

3. **Run the development server**

```bash
npm run dev
```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Authentication

The app uses JWT-based authentication with automatic token refresh.

### Demo Credentials

- **Email**: admin@demo.com
- **Password**: demo123

## 📊 Pages Implemented

- ✅ **Dashboard Overview**: Stats cards, charts, alerts
- ✅ **Products**: CRUD operations, filters, stock tracking
- ✅ **Inventory**: Stock management, transactions, alerts
- ✅ **Login**: Authentication page
- 🚧 **Clients, Suppliers, Orders, Invoices, HR, Settings, Profile**: Placeholders ready for implementation

## 🔌 API Integration

The app is ready to connect to a NestJS backend. All API functions are defined in `lib/api/index.ts`.

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## 📝 Project Structure

```
zaydo/
├── app/                        # Next.js App Router
│   ├── (auth)/login/          # Login page
│   └── (dashboard)/dashboard/ # All dashboard pages
├── components/                 # React components
│   ├── ui/                    # shadcn/ui components
│   ├── layout/                # Layout components
│   └── dashboard/             # Dashboard components
├── contexts/                   # React contexts
├── lib/api/                    # API client and endpoints
├── types/                      # TypeScript definitions
└── hooks/                      # Custom React hooks
```

## 🔮 Future Enhancements

- [ ] AI Assistant module
- [ ] WebSocket integration
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ using Next.js, TypeScript, and TailwindCSS
