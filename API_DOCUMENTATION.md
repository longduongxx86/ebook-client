# Bookstore API Documentation

## Overview

This document describes the API endpoints that should be implemented on the backend. The frontend is configured to call these endpoints via the API configuration system.

## API Configuration

**Base URL:** `http://localhost:3000/api` (configurable via `VITE_API_BASE_URL` in `.env`)

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {token}  # For protected endpoints
```

---

## Books Endpoints

### List All Books
```
GET /api/books
```

**Parameters:**
- `skip` (optional): Number of books to skip (default: 0)
- `limit` (optional): Number of books to return (default: 50)
- `category` (optional): Filter by category
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `minRating` (optional): Minimum rating filter
- `search` (optional): Search query for title/author

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Đắc Nhân Tâm",
      "author": "Dale Carnegie",
      "publisher": "NXB Tổng Hợp",
      "year_published": 2018,
      "isbn": "978-1234567001",
      "price": 95000,
      "cover_url": "https://...",
      "description": "...",
      "excerpt": "...",
      "category": "Kỹ năng sống",
      "rating_avg": 4.5,
      "rating_count": 123,
      "stock": 50
    }
  ],
  "total": 100,
  "skip": 0,
  "limit": 50
}
```

### Get Book Details
```
GET /api/books/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Đắc Nhân Tâm",
  "author": "Dale Carnegie",
  "publisher": "NXB Tổng Hợp",
  "year_published": 2018,
  "isbn": "978-1234567001",
  "price": 95000,
  "cover_url": "https://...",
  "description": "...",
  "excerpt": "...",
  "category": "Kỹ năng sống",
  "rating_avg": 4.5,
  "rating_count": 123,
  "stock": 50
}
```

### Search Books
```
GET /api/books/search?q={query}
```

**Parameters:**
- `q`: Search query (searches title, author, ISBN)

**Response:** Same as List All Books

---

## Cart Endpoints

### Get User Cart
```
GET /api/cart
Authorization: Bearer {token}
```

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "book_id": "uuid",
      "book": {
        "id": "uuid",
        "title": "Đắc Nhân Tâm",
        "author": "Dale Carnegie",
        "price": 95000,
        "cover_url": "https://...",
        "stock": 50
      },
      "quantity": 2,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 190000,
  "itemCount": 2
}
```

### Add to Cart
```
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookId": "uuid",
  "quantity": 1
}
```

**Response:**
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "quantity": 1,
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Update Cart Item
```
PUT /api/cart/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 3
}
```

**Response:** Same as Add to Cart

### Remove from Cart
```
DELETE /api/cart/{itemId}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

### Clear Cart
```
DELETE /api/cart/clear
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Cart cleared"
}
```

---

## Reviews Endpoints

### Get Book Reviews
```
GET /api/books/{bookId}/reviews
```

**Parameters:**
- `skip` (optional): Number of reviews to skip
- `limit` (optional): Number of reviews to return (default: 20)
- `sort` (optional): Sort order (newest, oldest, highest, lowest)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "book_id": "uuid",
      "user_id": "uuid",
      "rating": 5,
      "comment": "Sách rất hay!",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z",
      "user": {
        "id": "uuid",
        "full_name": "Nguyễn Văn A"
      }
    }
  ],
  "total": 25
}
```

### Create Review
```
POST /api/reviews
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookId": "uuid",
  "rating": 5,
  "comment": "Sách rất hay!"
}
```

**Response:**
```json
{
  "id": "uuid",
  "book_id": "uuid",
  "user_id": "uuid",
  "rating": 5,
  "comment": "Sách rất hay!",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Update Review
```
PUT /api/reviews/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 4,
  "comment": "Sách hay nhưng hơi đắt"
}
```

**Response:** Same as Create Review

### Delete Review
```
DELETE /api/reviews/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Review deleted"
}
```

---

## Authentication Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Nguyễn Văn A"
  },
  "token": "jwt_token_here",
  "expiresIn": 3600
}
```

### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyễn Văn A"
}
```

**Response:** Same as Login

### Get Profile
```
GET /api/auth/profile
Authorization: Bearer {token}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Nguyễn Văn A",
  "avatar_url": "https://...",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Refresh Token
```
POST /api/auth/refresh
Authorization: Bearer {token}
```

**Response:**
```json
{
  "token": "new_jwt_token",
  "expiresIn": 3600
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Orders Endpoints

### Get User Orders
```
GET /api/orders
Authorization: Bearer {token}
```

**Parameters:**
- `skip` (optional): Number of orders to skip
- `limit` (optional): Number of orders to return
- `status` (optional): Filter by status (pending, completed, cancelled)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "items": [
        {
          "book_id": "uuid",
          "book_title": "Đắc Nhân Tâm",
          "quantity": 2,
          "unit_price": 95000,
          "subtotal": 190000
        }
      ],
      "total": 190000,
      "status": "completed",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 5
}
```

### Create Order
```
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "bookId": "uuid",
      "quantity": 2
    }
  ]
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "items": [
    {
      "book_id": "uuid",
      "book_title": "Đắc Nhân Tâm",
      "quantity": 2,
      "unit_price": 95000,
      "subtotal": 190000
    }
  ],
  "total": 190000,
  "status": "pending",
  "created_at": "2025-01-15T10:30:00Z"
}
```

### Get Order Details
```
GET /api/orders/{id}
Authorization: Bearer {token}
```

**Response:** Same as Create Order

### Cancel Order
```
POST /api/orders/{id}/cancel
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have permission
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate entry (e.g., user already exists)
- `500 Internal Server Error`: Server error

---

## Frontend Integration

### Usage Example

```typescript
import { bookApi, cartApi, reviewApi, authApi } from './services/api';

// Get all books
const books = await bookApi.getBooks(token);

// Add to cart
await cartApi.addToCart(bookId, 1, token);

// Create review
await reviewApi.createReview(bookId, 5, 'Great book!', token);

// Login
const { token, user } = await authApi.login(email, password);
```

### Error Handling

```typescript
import { ApiError, bookApi } from './services/api';

try {
  const books = await bookApi.getBooks();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`);
  }
}
```

---

## Environment Variables

Add to `.env`:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_BASE_URL=https://api.yourdomain.com/api  # For production
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT tokens should be included in the `Authorization` header as `Bearer {token}`
- The frontend handles token refresh automatically
- CORS should be enabled on the backend for the frontend origin
- Rate limiting is recommended for production
