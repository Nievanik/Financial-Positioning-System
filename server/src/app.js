import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';
import profileRoutes from './routes/profiles.routes.js';
import editRoutes from './routes/edit.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();
app.set('trust proxy', 1); // Render puts one proxy in front; without this every client shares one IP for rate limiting

// CLIENT_ORIGIN may be a comma-separated list; unset allows only same-origin/no-origin requests.
const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '100kb' }));

app.use('/api/v1', healthRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', editRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
