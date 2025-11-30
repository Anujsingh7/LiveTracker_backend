import express from 'express';
import cors from 'cors';
import groupRoutes from './routes/groups.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api', groupRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║  Location Tracker Backend API              ║
║  Server running on http://localhost:${PORT}  ║
╚════════════════════════════════════════════╝
  `);
});

// Cleanup expired groups every 5 minutes
import { cleanupExpiredGroups } from './models/store.js';
setInterval(() => {
    cleanupExpiredGroups();
}, 5 * 60 * 1000); // 5 minutes

console.log('[CLEANUP] Scheduled cleanup job for expired groups (every 5 minutes)');
