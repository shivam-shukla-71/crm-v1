const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
// Capture raw body for Facebook signature verification
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to SalesMagnetCRM API v1.0' });
});

// API Routes (consolidated)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/leads', require('./routes/lead.routes'));
app.use('/api/assignments', require('./routes/lead-assignment.routes'));
app.use('/api/stages', require('./routes/lead-stage.routes'));
app.use('/api/activities', require('./routes/lead-activity.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/reporting', require('./routes/reporting.routes'));
app.use('/webhooks', require('./routes/webhooks.routes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`SalesMagnetCRM Server is running on port ${PORT}`);
});
