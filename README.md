# Nhà Sách - Personal Bookstore Website

A beautiful, production-ready bookstore frontend application built with React and TypeScript.

## Features

✨ **Beautiful UI**
- Warm amber/orange color scheme
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Professional typography with serif fonts

🛒 **Shopping Features**
- Browse books with grid/list view
- Advanced filtering (category, price, rating, alphabet)
- Search functionality
- Shopping cart with quantity management
- Quick add to cart

👤 **User Features**
- Email/password authentication
- User profile management
- Order history (when backend available)

📚 **Book Management**
- Detailed book pages with tabs
- Star ratings and reviews
- Customer reviews and comments
- Book search and filtering
- Stock tracking

⚙️ **Technical**
- API-based architecture (backend agnostic)
- JWT authentication
- TypeScript support
- Tailwind CSS styling
- Lucide React icons
- Full error handling

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd bookstore

# Install dependencies
npm install

# Configure API
cp .env.example .env
# Edit .env and set VITE_API_BASE_URL

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── config/
│   └── api.ts                 # API configuration
├── services/
│   └── api.ts                 # API client functions
├── contexts/
│   ├── AuthContext.tsx        # Authentication with JWT
│   └── CartContext.tsx        # Shopping cart management
├── components/
│   ├── Header.tsx             # Navigation header
│   ├── LoginModal.tsx         # Login/Register modal
│   ├── BookCatalog.tsx        # Books list with filters
│   ├── BookCard.tsx           # Individual book card
│   ├── BookDetail.tsx         # Detailed book view
│   ├── FilterSidebar.tsx      # Filter controls
│   ├── CartDrawer.tsx         # Shopping cart drawer
│   └── Toast.tsx              # Notifications
├── index.css                  # Global styles
├── main.tsx                   # Entry point
└── App.tsx                    # Main application
```

## Configuration

### Environment Variables

Create `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# For production
# VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API endpoint specifications
- **[API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md)** - How to use API services
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Backend implementation guide
- **[BACKEND_EXAMPLE.md](./BACKEND_EXAMPLE.md)** - Node.js and Python examples
- **[FRONTEND_ONLY_SETUP.md](./FRONTEND_ONLY_SETUP.md)** - Frontend setup guide
- **[REFACTORING_SUMMARY.md](./REFACTORING_SUMMARY.md)** - What changed from original

## API Endpoints Required

The frontend expects a backend API with these endpoints:

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/profile`
- `POST /api/auth/logout`

### Books
- `GET /api/books`
- `GET /api/books/{id}`
- `GET /api/books/search`

### Cart
- `GET /api/cart`
- `POST /api/cart/add`
- `PUT /api/cart/{itemId}`
- `DELETE /api/cart/{itemId}`

### Reviews
- `GET /api/books/{bookId}/reviews`
- `POST /api/reviews`
- `PUT /api/reviews/{id}`
- `DELETE /api/reviews/{id}`

### Orders
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{id}`

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full specifications.

## Technology Stack

- **Frontend Framework**: React 18.3
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite 5.4
- **HTTP Client**: Fetch API

## Authentication

JWT-based authentication with token storage:

1. User logs in with email/password
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent in `Authorization` header for protected routes
5. Backend validates token on each request

## Error Handling

All API errors are caught and handled gracefully:

```typescript
try {
  await bookApi.getBooks();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`Error ${error.status}: ${error.message}`);
  }
}
```

## Performance Optimization

- Lazy loading of reviews
- Pagination support
- CSS minification via Tailwind
- JavaScript minification via Vite
- Image CDN (Pexels)
- Efficient React re-renders

## Responsive Design

- **Mobile**: Full-width, single column
- **Tablet**: 2-3 column grid
- **Desktop**: 3-4 column grid
- **Touch Targets**: Minimum 44px for mobile

## Accessibility

- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Alt text for images

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers

## Scripts

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Linting
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript type check
```

## Backend Implementation

To use this frontend, implement a backend API with the endpoints listed above.

See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for requirements.

Example implementations available in [BACKEND_EXAMPLE.md](./BACKEND_EXAMPLE.md):
- Node.js + Express
- Python + Flask

## Deployment

### Frontend Deployment

```bash
# Build
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - AWS S3 + CloudFront
# - Any static hosting
```

### Backend Deployment

Deploy your backend API to:
- Heroku
- AWS EC2/Lambda
- Google Cloud
- Azure
- DigitalOcean
- etc.

Update `VITE_API_BASE_URL` to point to your production API.

## Testing

### Manual Testing

```bash
# 1. Start backend on http://localhost:3000
# 2. Start frontend
npm run dev
# 3. Test in browser at http://localhost:5173
```

### API Testing

Use Postman or curl:

```bash
# Get books
curl http://localhost:3000/api/books

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Troubleshooting

### CORS Error
- Check backend CORS configuration
- Verify API_BASE_URL in .env

### 401 Unauthorized
- Check token is valid
- Check Authorization header is sent

### API Not Responding
- Verify backend is running
- Check VITE_API_BASE_URL in .env

See [API_INTEGRATION_GUIDE.md](./API_INTEGRATION_GUIDE.md) for more details.

## License

MIT License - see LICENSE file for details

## Support

For questions or issues:
1. Check the documentation files
2. Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. Check [BACKEND_EXAMPLE.md](./BACKEND_EXAMPLE.md)
4. Review error messages in browser console

## Credits

- UI Design: Custom design with Tailwind CSS
- Icons: Lucide React
- Stock Photos: Pexels
- Typography: System fonts for performance
