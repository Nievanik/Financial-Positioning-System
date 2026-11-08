import app from './app.js';
import { connectDb } from './config/db.js';

const port = process.env.PORT || 5000;

// Listen first so /api/v1/health works even if MongoDB is down.
app.listen(port, () => console.log(`FPS server listening on :${port}`));
connectDb().catch((err) => console.error('MongoDB connection failed:', err.message));
