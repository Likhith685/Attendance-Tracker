import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';
import apiRouter from './routes/index.js';
import { logger } from './utils/logger.js';

function isAllowedOrigin(origin) {
  // Requests without an Origin header (curl, server-to-server, health checks) are not CORS requests.
  return !origin || env.corsOrigins.includes('*') || env.corsOrigins.includes(origin);
}

export function createApp() {
  const app = express();

  app.set('trust proxy', env.trustProxy);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      maxAge: 600,
    }),
  );
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => res.json({ name: 'Attendance Tracker API', health: '/api/health' }));
  app.use('/api', apiLimiter, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
