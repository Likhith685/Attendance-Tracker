import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// Express recognises error handlers by their four-argument signature.
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      ...(err.code && { code: err.code }),
      ...(err.details && { details: err.details }),
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'A record with the same unique value already exists.' });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }

  // Errors raised by body parsing (malformed JSON, payload too large, ...).
  const status = err?.status ?? err?.statusCode;
  if (status >= 400 && status < 500 && err.expose) {
    return res.status(status).json({ message: err.message });
  }

  (req.log ?? logger).error({ err }, 'Unhandled error');
  return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
}
