# API Integration Guide

## Overview

This frontend application has been refactored to use a separate backend API instead of directly querying the database. All API calls are centralized and configurable, making it easy to switch between backends or environments.

## Architecture

```
Frontend (React)
    ↓
API Services Layer (src/services/api.ts)
    ↓
API Configuration (src/config/api.ts)
    ↓
Backend API (Node.js, Python, etc.)
    ↓
Database
```

## File Structure

```
src/
├── config/
│   └── api.ts                    # API configuration and endpoints
├── services/
│   └── api.ts                    # API service functions
├── contexts/
│   ├── AuthContext.tsx           # Authentication with JWT tokens
│   └── CartContext.tsx           # Cart management via API
└── components/
    ├── BookDetail.tsx            # Uses bookApi, reviewApi
    ├── BookCard.tsx
    └── ...
```

## Configuration

### 1. Set API Base URL

Edit `.env`:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

For production:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 2. API Endpoints Configuration

All endpoints are defined in `src/config/api.ts`:

```typescript
export const API_ENDPOINTS = {
  books: {
    list: `${API_BASE_URL}/books`,
    detail: (id: string) => `${API_BASE_URL}/books/${id}`,
    search: `${API_BASE_URL}/books/search`,
  },
  // ... more endpoints
};
```

## API Services Usage

### Books API

```typescript
import { bookApi } from './services/api';

// Get all books
const books = await bookApi.getBooks();

// Get single book
const book = await bookApi.getBook(bookId);

// Search books
const results = await bookApi.searchBooks(query);
```

### Cart API

```typescript
import { cartApi } from './services/api';

// Get user's cart (requires token)
const cart = await cartApi.getCart(token);

// Add to cart
await cartApi.addToCart(bookId, quantity, token);

// Update quantity
await cartApi.updateCart(itemId, newQuantity, token);

// Remove from cart
await cartApi.removeFromCart(itemId, token);

// Clear cart
await cartApi.clearCart(token);
```

### Reviews API

```typescript
import { reviewApi } from './services/api';

// Get reviews for a book
const reviews = await reviewApi.getReviews(bookId);

// Create review (requires token)
await reviewApi.createReview(bookId, rating, comment, token);

// Update review
await reviewApi.updateReview(reviewId, rating, comment, token);

// Delete review
await reviewApi.deleteReview(reviewId, token);
```

### Auth API

```typescript
import { authApi } from './services/api';

// Login
const { token, user } = await authApi.login(email, password);

// Register
const { token, user } = await authApi.register(email, password, fullName);

// Get profile
const profile = await authApi.getProfile(token);

// Refresh token
const { token } = await authApi.refreshToken(oldToken);

// Logout
await authApi.logout(token);
```

### Orders API

```typescript
import { orderApi } from './services/api';

// Get all orders (requires token)
const orders = await orderApi.getOrders(token);

// Create order
const order = await orderApi.createOrder(items, token);

// Get order details
const order = await orderApi.getOrder(orderId, token);

// Cancel order
await orderApi.cancelOrder(orderId, token);
```

## Error Handling

All API errors inherit from `ApiError`:

```typescript
import { ApiError, bookApi } from './services/api';

try {
  const books = await bookApi.getBooks();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`);
    // Handle specific errors
    if (error.status === 401) {
      // Unauthorized - redirect to login
    } else if (error.status === 404) {
      // Not found
    }
  }
}
```

## Authentication Flow

### 1. Login/Register

```
User fills form
    ↓
authApi.login() / authApi.register()
    ↓
Backend returns { token, user }
    ↓
Frontend stores token in localStorage
    ↓
Token sent in Authorization header for subsequent requests
```

### 2. Protected Requests

All protected API calls automatically include the token:

```typescript
// Token is automatically added to headers
const headers = getHeaders(token);
// Result: { 'Authorization': 'Bearer {token}', 'Content-Type': 'application/json' }
```

### 3. Token Refresh

When token expires, call refresh endpoint:

```typescript
const { token: newToken } = await authApi.refreshToken(expiredToken);
localStorage.setItem('bookstore_token', newToken);
```

## Integration with React Contexts

### AuthContext

Manages user login state and provides authentication functions:

```typescript
const { user, token, signInWithEmail, signUpWithEmail, signOut } = useAuth();

// After successful login:
// - user: { id, email, full_name, ... }
// - token: JWT token for API requests
```

### CartContext

Manages shopping cart with API:

```typescript
const { cartItems, cartCount, addToCart, updateQuantity, removeFromCart } = useCart();

// All cart operations use the token from AuthContext
await addToCart(bookId);
```

## Environment-Specific Configuration

### Development

`.env.local`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

### Staging

`.env.staging`:
```bash
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api
```

### Production

`.env.production`:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## CORS Configuration (Backend)

Your backend must allow requests from the frontend:

```javascript
// Express.js example
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

## API Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

Or directly return data:

```json
{
  "id": "...",
  "title": "...",
  ...
}
```

### Error Response

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

## Troubleshooting

### 1. CORS Error

**Problem**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution**:
- Check backend CORS configuration allows frontend origin
- Verify `VITE_API_BASE_URL` in `.env` is correct

### 2. 401 Unauthorized

**Problem**: API returns 401 for protected endpoints

**Solution**:
- Check token is valid and not expired
- Verify token is stored in localStorage
- Check Authorization header is being sent correctly

### 3. API Not Responding

**Problem**: Connection refused or timeout

**Solution**:
- Verify backend is running
- Check `VITE_API_BASE_URL` matches backend URL
- Check network tab in DevTools for actual requests

### 4. Mock API for Development

If your backend isn't ready yet, you can mock API responses:

```typescript
// src/services/api.mock.ts
export const mockBooks = [
  { id: '1', title: 'Book 1', ... },
  { id: '2', title: 'Book 2', ... },
];

// Then in bookApi:
export const bookApi = {
  async getBooks() {
    // return mockBooks; // for development
    return fetchAPI(API_ENDPOINTS.books.list);
  },
};
```

## Performance Optimization

### 1. Reduce API Calls

Cache data when possible:

```typescript
const [books, setBooks] = useState([]);
const [hasLoaded, setHasLoaded] = useState(false);

useEffect(() => {
  if (!hasLoaded) {
    fetchBooks();
    setHasLoaded(true);
  }
}, []);
```

### 2. Pagination

Use skip/limit parameters:

```typescript
const { data, total } = await bookApi.getBooks({
  skip: 0,
  limit: 20,
});
```

### 3. Lazy Loading

Load images and reviews on demand:

```typescript
const [reviews, setReviews] = useState([]);
const [loadedReviews, setLoadedReviews] = useState(false);

const loadReviews = async () => {
  if (!loadedReviews) {
    const data = await reviewApi.getReviews(bookId);
    setReviews(data);
    setLoadedReviews(true);
  }
};
```

## Backend Implementation Checklist

- [ ] Implement all endpoints from `API_DOCUMENTATION.md`
- [ ] Add JWT authentication
- [ ] Implement CORS headers
- [ ] Add input validation
- [ ] Add error handling
- [ ] Add database models (books, users, cart, reviews, orders)
- [ ] Add API documentation
- [ ] Test with frontend
- [ ] Deploy to production

## Support Resources

- `API_DOCUMENTATION.md` - Complete API endpoint specification
- `BACKEND_SETUP.md` - Backend implementation guide
- `src/config/api.ts` - API configuration
- `src/services/api.ts` - API service implementations
