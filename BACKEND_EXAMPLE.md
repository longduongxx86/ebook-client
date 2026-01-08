# Backend Example Implementation

This document provides example implementations for common backend technologies.

## Node.js + Express Example

### 1. Setup

```bash
npm init -y
npm install express cors dotenv jsonwebtoken bcryptjs
npm install -D nodemon
```

### 2. .env

```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/bookstore
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
```

### 3. Basic Server (app.js)

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      error: {
        code: 'NO_TOKEN',
        message: 'No authentication token provided',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
  }
};

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/cart', authMiddleware, require('./routes/cart'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/orders', authMiddleware, require('./routes/orders'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message,
    },
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

module.exports = app;
```

### 4. Auth Routes (routes/auth.js)

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');

// Helper to generate token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'Email and password required' },
      });
    }

    // Find user
    const user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const userData = user.rows[0];
    const token = generateToken(userData);

    res.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: { code: 'INVALID_INPUT', message: 'All fields required' },
      });
    }

    // Check if user exists
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { code: 'USER_EXISTS', message: 'User already registered' },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, avatar_url',
      [email, passwordHash, fullName]
    );

    const userData = result.rows[0];
    const token = generateToken(userData);

    res.status(201).json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get profile
router.get('/profile', (req, res) => {
  // req.user is set by authMiddleware
  res.json(req.user);
});

// Logout
router.post('/logout', (req, res) => {
  // Just respond success - token is stateless
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
```

### 5. Books Routes (routes/books.js)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all books with filters
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, limit = 50, category, minPrice, maxPrice, search } = req.query;
    let query = 'SELECT * FROM books WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    if (minPrice) {
      query += ` AND price >= $${paramCount++}`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND price <= $${paramCount++}`;
      params.push(parseFloat(maxPrice));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount})`;
      params.push(searchTerm);
      paramCount++;
    }

    // Get total count
    const countResult = await db.query(`SELECT COUNT(*) FROM books WHERE 1=1` + query.substring('SELECT * FROM books WHERE 1=1'.length), params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, skip);

    const result = await db.query(query, params);

    res.json({
      data: result.rows,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    next(error);
  }
});

// Get single book
router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Book not found' },
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 6. Cart Routes (routes/cart.js)

```javascript
const express = require('express');
const router = express.Router();
const db = require('../db');

// Get cart
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        ci.id,
        ci.book_id,
        ci.quantity,
        b.id as book_id,
        b.title as book_title,
        b.author,
        b.price,
        b.cover_url,
        b.stock
      FROM cart_items ci
      JOIN books b ON ci.book_id = b.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [req.user.id]);

    const total = result.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
      items: result.rows.map(row => ({
        id: row.id,
        book_id: row.book_id,
        quantity: row.quantity,
        book: {
          id: row.book_id,
          title: row.book_title,
          author: row.author,
          price: row.price,
          cover_url: row.cover_url,
          stock: row.stock,
        },
      })),
      total,
      itemCount: result.rows.length,
    });
  } catch (error) {
    next(error);
  }
});

// Add to cart
router.post('/add', async (req, res, next) => {
  try {
    const { bookId, quantity = 1 } = req.body;

    // Check if already in cart
    const existing = await db.query(
      'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND book_id = $2',
      [req.user.id, bookId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update quantity
      result = await db.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND book_id = $3 RETURNING *',
        [quantity, req.user.id, bookId]
      );
    } else {
      // Insert new item
      result = await db.query(
        'INSERT INTO cart_items (user_id, book_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [req.user.id, bookId, quantity]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update cart item
router.put('/:itemId', async (req, res, next) => {
  try {
    const { quantity } = req.body;

    if (quantity <= 0) {
      // Remove item
      await db.query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [req.params.itemId, req.user.id]);
      return res.json({ success: true });
    }

    const result = await db.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, req.params.itemId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart item not found' } });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Remove from cart
router.delete('/:itemId', async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.itemId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Cart item not found' } });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

## Python + Flask Example

### 1. Setup

```bash
pip install flask flask-cors flask-sqlalchemy pyjwt bcrypt python-dotenv
```

### 2. app.py

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET')

CORS(app, origins=[os.getenv('FRONTEND_URL')])

# Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({
                'error': {'code': 'NO_TOKEN', 'message': 'No token provided'}
            }), 401

        try:
            data = jwt.decode(token, app.config['JWT_SECRET'], algorithms=['HS256'])
            request.user_id = data['id']
        except:
            return jsonify({
                'error': {'code': 'INVALID_TOKEN', 'message': 'Invalid token'}
            }), 401

        return f(*args, **kwargs)
    return decorated

# Routes
from routes import auth, books, cart, reviews, orders

app.register_blueprint(auth.bp)
app.register_blueprint(books.bp)
app.register_blueprint(cart.bp)
app.register_blueprint(reviews.bp)
app.register_blueprint(orders.bp)

if __name__ == '__main__':
    app.run(debug=True, port=3000)
```

### 3. routes/auth.py

```python
from flask import Blueprint, request, jsonify, current_app
import jwt
import bcrypt
from models import User, db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('fullName')

    if not all([email, password, full_name]):
        return jsonify({
            'error': {'code': 'INVALID_INPUT', 'message': 'All fields required'}
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            'error': {'code': 'USER_EXISTS', 'message': 'User already exists'}
        }), 409

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    user = User(email=email, password_hash=hashed.decode(), full_name=full_name)
    db.session.add(user)
    db.session.commit()

    token = jwt.encode(
        {'id': user.id, 'email': user.email},
        current_app.config['JWT_SECRET'],
        algorithm='HS256'
    )

    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'avatar_url': user.avatar_url
        }
    }), 201

# Similar implementations for login, profile, logout...
```

## Next Steps

1. Choose your backend framework
2. Implement all endpoints from `API_DOCUMENTATION.md`
3. Test with the frontend using `VITE_API_BASE_URL=http://localhost:3000/api`
4. Deploy to production

For more details, see `API_DOCUMENTATION.md`.
