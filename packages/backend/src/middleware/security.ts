import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import type { Express } from 'express';

export function applySecurityMiddleware(app: Express): void {
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(compression());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });
  app.use('/api', limiter);

  const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: { error: 'Too many uploads, please try again later' },
  });
  app.use('/api/photos/upload', uploadLimiter);
}
