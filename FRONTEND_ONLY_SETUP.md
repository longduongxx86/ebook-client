# Frontend-Only Setup Guide

This project is now **purely frontend** with a configurable API layer for backend integration.

## What Changed

### Before (Supabase Direct)
- Frontend directly connected to Supabase database
- Database credentials in frontend code
- Tightly coupled to Supabase

### Now (API-Based)
- Frontend calls backend API endpoints
- All database logic in backend
- Clean separation of concerns
- Backend agnostic (Node, Python, Java, etc.)

## Project Structure

```
src/
├── config/
│   └── api.ts                 # API base URL and endpoints
├── services/
│   └── api.ts                 # API client functions
├── contexts/
│   ├── AuthContext.tsx        # JWT authentication
│   └── CartContext.tsx        # Cart with API
├── components/
│   ├── Header.tsx
│   ├── LoginModal.tsx
│   ├── BookCatalog.tsx
│   ├── BookCard.tsx
│   ├── BookDetail.tsx
│   ├── FilterSidebar.tsx
│   ├── CartDrawer.tsx
│   └── Toast.tsx
└── App.tsx
```

## Key Files

### 1. Configuration

**File**: `src/config/api.ts`

Controls all API endpoints:
```typescript
export const API_ENDPOINTS = {
  books: { list: `${API_BASE_URL}/books`, ... },
  cart: { list: `${API_BASE_URL}/cart`, ... },
  reviews: { ... },
  auth: { ... },
  orders: { ... },
};
```

### 2. API Services

**File**: `src/services/api.ts`

All API calls organized by feature:
- `bookApi` - Books operations
- `cartApi` - Shopping cart operations
- `reviewApi` - Book reviews
- `authApi` - Authentication
- `orderApi` - Orders

### 3. Authentication Context

**File**: `src/contexts/AuthContext.tsx`

Manages JWT authentication:
- Stores token in localStorage
- Handles login/register/logout
- Token available in all components via `useAuth()`

### 4. Cart Context

**File**: `src/contexts/CartContext.tsx`

Manages shopping cart via API:
- Uses token from AuthContext
- All operations require authentication
- Automatic cart sync

## Configuration

### Environment Variables

Edit `.env`:

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:3000/api

# For production
# VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## How It Works

### 1. Book Listing

```
Frontend requests books
    ↓
bookApi.getBooks() in src/services/api.ts
    ↓
fetch(VITE_API_BASE_URL + '/books')
    ↓
Backend API
    ↓
Returns book data
```

### 2. Authentication

```
User fills login form
    ↓
authApi.login(email, password)
    ↓
Backend validates credentials
    ↓
Returns { token, user }
    ↓
Stored in localStorage
    ↓
Used for subsequent requests
```

### 3. Protected Operations

```
Add to cart action
    ↓
Check if user logged in (useAuth())
    ↓
If not logged in → Show login modal
    ↓
If logged in → cartApi.addToCart(bookId, token)
    ↓
API includes Authorization header
    ↓
Backend validates token & adds to cart
```

## Running the Frontend

### Development

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

Backend should run on `http://localhost:3000`

### Production Build

```bash
npm run build
```

Optimized build in `dist/` folder

## Backend Integration Checklist

- [ ] Create backend project (Node/Python/etc.)
- [ ] Implement all endpoints from `API_DOCUMENTATION.md`
- [ ] Add JWT authentication
- [ ] Add CORS headers
- [ ] Test locally with frontend
- [ ] Deploy to production

## Example APIs Implemented

### Books
- `GET /api/books` - List all books
- `GET /api/books/{id}` - Get book details
- `GET /api/books/search` - Search books

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - Logout

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add to cart
- `PUT /api/cart/{itemId}` - Update quantity
- `DELETE /api/cart/{itemId}` - Remove item

### Reviews
- `GET /api/books/{bookId}/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/{id}` - Update review
- `DELETE /api/reviews/{id}` - Delete review

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/{id}` - Get order details

## Documentation Files

1. **API_DOCUMENTATION.md** - Complete API specification
2. **API_INTEGRATION_GUIDE.md** - How to use the API services
3. **BACKEND_SETUP.md** - Backend implementation guide
4. **BACKEND_EXAMPLE.md** - Node.js and Python examples

## Removed Dependencies

The following Supabase-specific code has been removed:

- ❌ `import { supabase }` from Supabase JS client
- ❌ Direct database queries in components
- ❌ Supabase auth functions
- ❌ Row-level security policies (now backend responsibility)

## What's Included

✅ Clean React components
✅ API configuration system
✅ JWT authentication
✅ Error handling
✅ TypeScript support
✅ Responsive design
✅ Beautiful UI

## No Database in Frontend

This frontend has **zero database connections**. Everything goes through the API.

All data is:
1. Fetched from backend API
2. Processed in frontend
3. Displayed to user
4. Sent back to API for persistence

## Error Handling

All API errors are caught and handled:

```typescript
try {
  const books = await bookApi.getBooks();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Redirect to login
    } else if (error.status === 404) {
      // Show not found message
    }
  }
}
```

## Performance Notes

- Books loaded on page load
- Cart loaded on login
- Reviews loaded on demand
- Images served from Pexels CDN
- No unnecessary re-renders with React hooks

## Security

- JWT tokens stored in localStorage
- Token sent in Authorization header
- Backend validates all requests
- No credentials exposed in frontend
- CORS configured per environment

## Next Steps

1. Read `API_DOCUMENTATION.md` for endpoint specs
2. Choose backend technology (Node/Python/etc.)
3. Implement endpoints using `BACKEND_EXAMPLE.md`
4. Update `VITE_API_BASE_URL` in `.env`
5. Test frontend with backend
6. Deploy both frontend and backend

## Support

For detailed information:
- API endpoints: See `API_DOCUMENTATION.md`
- Integration guide: See `API_INTEGRATION_GUIDE.md`
- Backend setup: See `BACKEND_SETUP.md`
- Examples: See `BACKEND_EXAMPLE.md`
