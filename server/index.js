
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const uploadRoutes = require('./routes/uploadroutes');
const projectRoutes = require('./routes/projectroutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS configuration supporting production Vercel frontend and local dev origins
const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://handover-x.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]
    .filter(Boolean)
    .map((origin) => origin.replace(/^["']|["']$/g, '').replace(/\/+$/, '').trim());

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow any localhost/127.0.0.1 origin in development
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use('/api/upload', uploadRoutes);
app.use('/api/projects', projectRoutes);

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'HandoverX API is running'
    });
});

app.get('/api/health', (req, res) => {
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
    const configuredModel = 'gemini-3.5-flash';
    const modelDisplayName = 'Gemini 3.5 Flash';

    res.json({
        success: true,
        services: {
            server: 'online',
            gemini: {
                status: hasGeminiKey ? 'online' : 'unconfigured',
                model: configuredModel,
                modelDisplayName: modelDisplayName
            },
            firebase: 'online'
        }
    });
});

// Explicitly bind to 0.0.0.0 to listen on all IPv4 interfaces reliably
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`HandoverX server running at http://localhost:${PORT}`);
});

// Configure keep-alive timeouts to prevent connection drops and resets
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

