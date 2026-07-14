import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { roomRouter } from './routes/room';
import { photoRouter } from './routes/photo';
import { errorHandler, type AppError } from './middleware/errorHandler';
import { applySecurityMiddleware } from './middleware/security';
import { requestLogger } from './middleware/logger';
import { swaggerSpec } from './config/swagger';

const app = express();

applySecurityMiddleware(app);

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use(requestLogger);

app.get('/api/swagger.json', (_req, res) => {
  res.json(swaggerSpec);
});

if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'BoothTogether API Docs',
    swaggerOptions: {
      url: '/api/swagger.json',
    },
  }));
}

app.use('/api', healthRouter);
app.use('/api', roomRouter);
app.use('/api', photoRouter);

app.use('/uploads', express.static(path.resolve('uploads'), {
  maxAge: '1d',
  immutable: true,
}));

app.use((err: AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  errorHandler(err, _req, res, _next);
});

export { app };
