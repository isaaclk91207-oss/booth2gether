import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { healthRouter } from './routes/health';
import { roomRouter } from './routes/room';
import { photoRouter } from './routes/photo';
import { errorHandler, type AppError } from './middleware/errorHandler';
import { swaggerSpec } from './config/swagger';

const app = express();

app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());

app.get('/api/swagger.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BoothTogether API Docs',
  swaggerOptions: {
    url: '/api/swagger.json',
  },
}));

app.use('/api', healthRouter);
app.use('/api', roomRouter);
app.use('/api', photoRouter);

app.use('/uploads', express.static(path.resolve('uploads')));

app.use((err: AppError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  errorHandler(err, _req, res, _next);
});

export { app };
