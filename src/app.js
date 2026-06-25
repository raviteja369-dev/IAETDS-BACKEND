import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CLIENT_URL may be a single origin or a comma-separated allowlist.
  const allowedOrigins = String(env.clientUrl || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser requests (curl, health checks) that send no Origin.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        let hostname = '';
        try {
          hostname = new URL(origin).hostname;
        } catch {
          return callback(new Error(`Invalid origin: ${origin}`));
        }
        // Allow any Vercel preview/production deployment and local dev.
        if (hostname.endsWith('.vercel.app')) return callback(null, true);
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(compression());
  if (!env.isProd) app.use(morgan('dev'));

  const limiter = rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Too many requests, slow down.' } },
  });
  app.use('/api', limiter);

  app.get('/health', (_req, res) =>
    res.json({ success: true, status: 'ok', service: 'IAETDS API', time: new Date().toISOString() }),
  );

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
