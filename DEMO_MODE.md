# 🎮 Demo Mode

The application is currently running in **Demo Mode** for easy testing without a backend.

## 🔐 Demo Credentials

**Email:** `admin@demo.com`  
**Password:** `demo123`

## ✨ How It Works

### Authentication
- Login works **without hitting any backend API**
- Demo credentials are validated locally
- Mock user and tenant data is created automatically
- All tokens and user data stored in localStorage

### Demo User
When you login with demo credentials, you get:
- **Name:** Admin User
- **Role:** ADMIN
- **Email:** admin@demo.com
- **Company:** Demo Juice Company
- **Plan:** Professional

### Demo Company
The demo tenant includes:
- **Company Name:** Demo Juice Company
- **Industry:** Food & Beverage
- **Plan Type:** Professional
- **Features:** All enabled (except AI)

## 🎯 What Works in Demo Mode

✅ **Authentication**
- Login with demo credentials
- Logout functionality
- Session persistence (localStorage)
- Auth state management

✅ **Dashboard**
- View statistics and charts
- See low stock alerts
- View recent orders
- All with dummy data

✅ **Products Page**
- Browse product list
- Search and filter
- Add/Edit/Delete (UI only, no persistence)
- Stock level indicators

✅ **Inventory Page**
- View stock levels
- Stock in/out forms (UI only)
- Transaction history
- Alerts and warnings

✅ **Navigation**
- Full sidebar navigation
- All routes accessible
- Dark mode toggle
- Responsive design

## ⚠️ Limitations

❌ **No Data Persistence**
- Changes are not saved to a database
- Refresh will reset to default dummy data
- Forms submit but don't persist

❌ **No Real API Calls**
- All data is static/mocked
- No server-side validation
- No real-time updates

❌ **Placeholder Pages**
- Clients, Suppliers, Orders, Invoices, HR
- Settings and Profile pages
- These show "Coming Soon" messages

## 🔄 Switching to Real Backend

When ready to connect to your NestJS backend:

### 1. Update Auth Context
In `contexts/auth-context.tsx`, replace the demo login logic with:

```typescript
const login = async (credentials: LoginCredentials) => {
  try {
    const response: AuthResponse = await authApi.login(credentials);
    
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('tenantId', response.user.tenantId);
    
    setUser(response.user);
    
    toast.success('Login successful!');
    router.push('/dashboard');
  } catch (error: any) {
    console.error('Login error:', error);
    toast.error(error.response?.data?.message || 'Login failed.');
    throw error;
  }
};
```

### 2. Update Tenant Context
In `contexts/tenant-context.tsx`, replace with:

```typescript
const fetchTenant = async () => {
  try {
    const tenantData = await tenantApi.getCurrent();
    setTenant(tenantData);
  } catch (error) {
    console.error('Failed to fetch tenant:', error);
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Configure API URL
Update `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-url.com/api
```

### 4. Replace Dummy Data
In each page, replace dummy data arrays with React Query hooks:

```typescript
// Instead of:
const dummyProducts = [...];

// Use:
const { data: products, isLoading } = useQuery({
  queryKey: ['products'],
  queryFn: productsApi.getAll,
});
```

## 🎨 Testing the Demo

### Try These Features:

1. **Login**
   - Go to http://localhost:3000
   - Use demo credentials
   - See successful login

2. **Dashboard**
   - View KPI cards
   - Check interactive charts
   - See low stock alerts

3. **Products**
   - Browse product list
   - Use search and filters
   - Click "Add Product"
   - Edit existing products

4. **Inventory**
   - Check stock levels
   - Click "Stock In" or "Stock Out"
   - View transaction history

5. **Dark Mode**
   - Click moon/sun icon in header
   - See theme switch

6. **Navigation**
   - Click sidebar items
   - Try collapsing sidebar
   - Visit all pages

7. **User Menu**
   - Click avatar in header
   - See user info
   - Try logout

## 📝 Demo Data

### Products (5 items)
- Orange Juice 1L
- Apple Juice 500ml
- Sugar (Raw Material)
- Bottles 1L
- Labels

### Recent Orders (4 items)
- Various orders from different clients
- Different statuses

### Inventory Transactions (3 items)
- Stock in/out examples
- Different reasons

## 💡 Tips

- **Refresh Safe:** Your session persists across page refreshes
- **Logout:** Clears all localStorage data
- **Invalid Login:** Only demo credentials work in demo mode
- **Console Logs:** Check browser console for debugging

## 🚀 Benefits of Demo Mode

✅ **No Backend Required:** Test frontend independently
✅ **Fast Development:** No API delays
✅ **Easy Testing:** Predictable data
✅ **Showcase Ready:** Perfect for demos
✅ **Learning:** Understand UI flow before backend

---

**Ready to explore? Login at http://localhost:3000 with the demo credentials!**
