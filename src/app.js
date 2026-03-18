const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const profileRoutes = require('./routes/profileRoutes');
const cvRoutes = require('./routes/cvRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const recruiterRoutes = require('./routes/recruiterRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/v1/cvs', cvRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: "Welcome to JobMajunga API v1" });
});

// Health check route
app.get('/api/v1/health', (req, res) => {
    res.json({ status: "up", timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message
    });
});

module.exports = app;
