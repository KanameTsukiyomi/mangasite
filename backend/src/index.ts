import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';

import authRoutes    from './routes/auth';
import seriesRoutes  from './routes/series';
import chaptersRoutes from './routes/chapters';
import usersRoutes   from './routes/users';
import paymentsRoutes from './routes/payments';
import adminRoutes   from './routes/admin';
import settingsRoutes from './routes/settings';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Webhooks de pago necesitan el body raw, antes del JSON parser ──
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// ── Middlewares globales ──────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rutas de la API ───────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/series',   seriesRoutes);
app.use('/api/chapters', chaptersRoutes);
app.use('/api/users',    usersRoutes);
app.use('/api/coins',    paymentsRoutes);  // paquetes + checkout
app.use('/api/webhooks', paymentsRoutes);  // webhooks de pago
app.use('/api/admin',    adminRoutes);
app.use('/api/settings', settingsRoutes);  // configuración pública (colores, nombre)

// ── Manejo de errores ─────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ MangaSite API — puerto ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL ?? 'http://localhost:3000'}`);
});

export default app;
