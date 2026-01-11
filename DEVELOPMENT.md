# Zaydo - Development Guide

## 📋 Quick Start

### Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### Login Demo Credentials

- Email: `admin@demo.com`
- Password: `demo123`

## 🎯 What's Implemented

### ✅ Fully Functional

1. **Authentication System**
   - Login page with form validation
   - JWT token management with auto-refresh
   - Auth context for global state
   - Protected routes (redirect logic)

2. **Dashboard Overview**
   - Stats cards with KPIs
   - Sales and production charts
   - Low stock alerts table
   - Recent orders table
   - Dummy data for demo

3. **Products Management**
   - Product listing with search and filters
   - Add/Edit product modal
   - Product types (Finished Goods / Raw Materials)
   - Stock level indicators
   - Delete functionality

4. **Inventory Management**
   - Stock level monitoring
   - Stock In/Out transactions
   - Low stock alerts
   - Transaction history
   - Summary statistics

5. **Layout & Navigation**
   - Collapsible sidebar with route highlighting
   - Header with search, notifications, theme toggle
   - Dark mode support
   - Responsive design
   - User menu with profile/settings

### 🚧 Placeholder Pages (Ready for Implementation)

- Clients
- Suppliers
- Orders
- Invoices
- HR Module
- Settings (with tabs)
- Profile

## 🏗️ Architecture

### State Management

- **React Query**: Server state caching and synchronization
- **Context API**: Global state (auth, tenant, theme)
- **React Hook Form**: Form state

### API Integration

- Axios client with interceptors
- Automatic JWT injection
- Token refresh handling
- Tenant ID injection
- Error handling

### Component Structure

```
Components are organized by feature:
- ui/          → shadcn/ui base components
- layout/      → Sidebar, Header, Layout
- dashboard/   → StatsCard, ChartCard
```

## 🔧 Key Files

### Configuration

- `app/layout.tsx` - Root layout with providers
- `tailwind.config.ts` - TailwindCSS configuration
- `components.json` - shadcn/ui configuration
- `.env.local` - Environment variables

### Core Logic

- `contexts/auth-context.tsx` - Authentication logic
- `contexts/tenant-context.tsx` - Multi-tenant logic
- `lib/api/client.ts` - Axios instance
- `lib/api/index.ts` - API endpoints
- `types/index.ts` - TypeScript types

### Pages

- `app/(auth)/login/page.tsx` - Login page
- `app/(dashboard)/dashboard/page.tsx` - Dashboard overview
- `app/(dashboard)/dashboard/products/page.tsx` - Products page
- `app/(dashboard)/dashboard/inventory/page.tsx` - Inventory page

## 🎨 Styling

### Theme

- Uses CSS variables for theming
- Dark mode via `next-themes`
- shadcn/ui components are fully themed

### Tailwind Classes

Common patterns:

- Cards: `Card`, `CardHeader`, `CardTitle`, `CardContent`
- Buttons: `Button` with variants (default, outline, ghost)
- Tables: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`

## 📊 Data Flow

### Reading Data

```typescript
// Use React Query
const { data, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: productsApi.getAll,
});
```

### Mutating Data

```typescript
// Use React Query mutations
const mutation = useMutation({
  mutationFn: productsApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries(['products']);
    toast.success('Product created!');
  },
});
```

### Forms

```typescript
// React Hook Form + Zod
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## 🔐 Authentication Flow

1. User enters credentials on login page
2. `authApi.login()` sends POST to backend
3. Backend returns JWT tokens and user data
4. Tokens stored in localStorage
5. `auth-context` updates with user data
6. User redirected to dashboard
7. All API requests include JWT in headers
8. On 401 response, token refresh attempted
9. If refresh fails, user logged out

## 🏢 Multi-Tenancy

- Tenant ID stored in localStorage
- Automatically injected in API headers (`X-Tenant-ID`)
- Tenant context provides current tenant info
- Displayed in header with company logo

## 🚀 Adding New Features

### Add New Page

1. Create page file: `app/(dashboard)/dashboard/[name]/page.tsx`
2. Add route to sidebar: `components/layout/sidebar.tsx`
3. Add API functions: `lib/api/index.ts`
4. Add types: `types/index.ts`

### Add New Component

1. Create in appropriate folder (`ui/`, `layout/`, or `dashboard/`)
2. Export from component file
3. Import where needed

### Add New API Endpoint

1. Add function to `lib/api/index.ts`:

```typescript
export const myApi = {
  getAll: async () => {
    const response = await apiClient.get('/my-resource');
    return response.data;
  },
};
```

## 🐛 Debugging

### Common Issues

**Error: Module not found**

- Run `npm install`
- Check import paths use `@/` alias

**API not working**

- Check `.env.local` has correct API URL
- Verify backend is running
- Check Network tab in DevTools

**Styles not applying**

- Restart dev server
- Check Tailwind config
- Verify class names

**Auth not working**

- Clear localStorage
- Check JWT token format
- Verify backend auth endpoints

## 📱 Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

Use: `md:grid-cols-2` for responsive grids

## 🎯 Next Steps for Full Implementation

1. **Connect Real Backend**
   - Update API base URL
   - Test all endpoints
   - Handle loading states
   - Add error boundaries

2. **Complete CRUD Pages**
   - Implement Clients page
   - Implement Suppliers page
   - Implement Orders page
   - Implement Invoices page

3. **Add Advanced Features**
   - Real-time notifications (WebSocket)
   - PDF generation for invoices
   - Advanced filtering and sorting
   - Bulk operations
   - Export functionality

4. **Polish UI/UX**
   - Loading skeletons
   - Empty states
   - Error states
   - Success animations
   - Toast notifications

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

6. **Performance**
   - Lazy loading
   - Image optimization
   - Code splitting
   - Caching strategies

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TailwindCSS](https://tailwindcss.com)
- [React Query](https://tanstack.com/query)
- [React Hook Form](https://react-hook-form.com)

## 💡 Tips

- Use `console.log()` sparingly in production
- Always invalidate queries after mutations
- Use TypeScript for type safety
- Keep components small and focused
- Follow the existing code patterns
- Comment complex logic

---

Happy coding! 🚀
