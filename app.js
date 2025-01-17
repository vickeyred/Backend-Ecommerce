const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const createDbConnection = require('./config/database');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const allProductsRoutes = require('./routes/allproducts');
const productRoutes = require('./routes/products');
const authenticateToken = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const cors = require('cors'); // Import the CORS middleware

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true })); // Enable CORS with your frontend's origin
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/categories', authenticateToken, categoryRoutes);
app.use('/allproducts', authenticateToken, allProductsRoutes);
app.use('/products', authenticateToken, productRoutes);

// Public Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'categories.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Database Setup
createDbConnection()
    .then(() => console.log('Database initialized successfully.'))
    .catch((err) => {
        console.error('Failed to initialize database:', err.message);
        process.exit(1);
    });

// Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
