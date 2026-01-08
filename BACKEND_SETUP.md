# Backend API Setup Guide

## Overview

This frontend application is configured to communicate with a backend API. The backend should implement all endpoints described in `API_DOCUMENTATION.md`.

## Quick Start

### 1. Configure API Base URL

Edit `.env` file and set the backend API URL:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

For production:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 2. Frontend API Services

All API calls are centralized in `src/services/api.ts`. The services are organized by feature:

- **Books**: `bookApi.getBooks()`, `bookApi.getBook(id)`, `bookApi.searchBooks(query)`
- **Cart**: `cartApi.addToCart()`, `cartApi.getCart()`, `cartApi.updateCart()`, etc.
- **Reviews**: `reviewApi.getReviews()`, `reviewApi.createReview()`, etc.
- **Auth**: `authApi.login()`, `authApi.register()`, `authApi.getProfile()`, etc.
- **Orders**: `orderApi.createOrder()`, `orderApi.getOrders()`, etc.

### 3. Backend Requirements

Your backend must implement:

1. **Authentication**
   - JWT-based token authentication
   - Email/password login and registration
   - Token refresh mechanism
   - CORS support for frontend origin

2. **Books Management**
   - List books with filtering and pagination
   - Get individual book details
   - Search functionality

3. **Shopping Cart**
   - User-specific cart management
   - Add/remove/update items
   - Cart retrieval

4. **Reviews**
   - Get reviews for a book
   - Create/update/delete reviews
   - Associate reviews with users

5. **Orders**
   - Create orders from cart
   - Track order status
   - Cancel orders

## API Response Format

All responses should follow this structure:

### Success Response (200, 201)
```json
{
  "data": {...},
  "message": "Success message (optional)"
}
```

### Error Response (4xx, 5xx)
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

## Error Handling

Frontend automatically handles these error cases:

- **401 Unauthorized**: Token missing or invalid
- **403 Forbidden**: User doesn't have permission
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Duplicate entry (e.g., review already exists)
- **500 Server Error**: Shows user-friendly message

## Token Management

The frontend manages JWT tokens internally:

1. Token is stored after successful login
2. Token is sent in `Authorization: Bearer {token}` header for protected endpoints
3. Token refresh happens automatically when needed
4. Token is cleared on logout

Backend should:
- Issue tokens with reasonable expiration (e.g., 24 hours)
- Provide a refresh endpoint for token renewal
- Validate tokens on protected endpoints
- Return 401 for invalid/expired tokens

## CORS Configuration

Your backend should allow requests from the frontend origin:

```
Access-Control-Allow-Origin: http://localhost:5173 (dev)
Access-Control-Allow-Origin: https://yourdomain.com (production)
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Database Schema (Reference)

The backend should maintain these entity relationships:

```
users
├── id (UUID, PK)
├── email (unique)
├── password (hashed)
├── full_name
├── avatar_url
└── created_at

books
├── id (UUID, PK)
├── title
├── author
├── price
├── category
├── rating_avg (calculated from reviews)
├── rating_count (calculated from reviews)
├── stock
└── ... other fields

cart_items
├── id (UUID, PK)
├── user_id (FK to users)
├── book_id (FK to books)
├── quantity
└── created_at

reviews
├── id (UUID, PK)
├── book_id (FK to books)
├── user_id (FK to users)
├── rating (1-5)
├── comment
└── created_at

orders
├── id (UUID, PK)
├── user_id (FK to users)
├── items (list of order items)
├── total (decimal)
├── status (pending, completed, cancelled)
└── created_at
```

## Testing API Integration

### Using cURL

```bash
# Get books
curl http://localhost:3000/api/books

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Add to cart
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"bookId":"book-uuid","quantity":1}'
```

### Using Frontend DevTools

Open browser console and test:

```javascript
import { bookApi, authApi } from '/src/services/api.ts';

// Test getting books
const books = await bookApi.getBooks();
console.log(books);

// Test login
const result = await authApi.login('test@example.com', 'password');
console.log(result);
```

## Production Deployment

1. **Update API URL**
   ```bash
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. **Enable HTTPS**
   - Backend should use HTTPS in production
   - Update CORS policy with production domain

3. **Security Headers**
   - Add security headers (HSTS, CSP, etc.)
   - Implement rate limiting

4. **Monitoring**
   - Log API errors
   - Monitor API performance
   - Track failed requests

## Troubleshooting

### CORS Errors

**Problem**: "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution**:
- Check backend CORS configuration
- Ensure Access-Control-Allow-Origin header is set correctly
- Verify API base URL in `.env`

### 401 Unauthorized

**Problem**: API returns 401 for protected endpoints

**Solution**:
- Check token is being sent in Authorization header
- Verify token hasn't expired
- Ensure backend validates token correctly

### API Not Responding

**Problem**: Frontend shows "Connection refused" or timeout

**Solution**:
- Verify backend is running
- Check VITE_API_BASE_URL is correct
- Check network connectivity
- Look at browser DevTools Network tab

## Support

For issues with API integration, check:
1. `API_DOCUMENTATION.md` for endpoint specifications
2. `src/services/api.ts` for client-side implementation
3. `src/config/api.ts` for configuration
4. Browser console for error details
