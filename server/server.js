// server.js - Express Server Entry Point
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const journalRoutes = require('./routes/journals');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow all cross-origin requests for offline workspace testing
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-UID']
}));
app.use(express.json());

// Register API Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/ai', aiRoutes);

// Base Check-in route
app.get('/', (req, res) => {
  res.json({ message: 'Sleep Clarity backend server running successfully.' });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Listen
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
