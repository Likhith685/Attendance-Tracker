import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.credential'],
    censor: '[redacted]',
  },
  ...(env.isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
    },
  }),
});
