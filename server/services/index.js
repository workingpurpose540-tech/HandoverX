
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/uploadroutes');
const projectRoutes = require('./routes/projectroutes');

const app = express();
const PORT = process.env.PORT || 5000;


const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://handover-x.vercel.app',
    'http://localhost:5173',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    }
}));

app.use(express.json({ limit: '2mb' }));

// Upload API
app.use('/api/upload', uploadRoutes);

// Project API
app.use('/api/projects', projectRoutes);

// Main route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'HandoverX API is running'
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        services: {
            server: 'online',
            gemini: 'configured',
            firebase: 'configured'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`HandoverX server running at http://localhost:${PORT}`);
});
