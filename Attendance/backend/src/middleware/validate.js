import { ApiError } from '../utils/ApiError.js';

const formatPath = (path) => path.map(String).join('.');

/**
 * Validates request parts with zod schemas. Parsed values are exposed on
 * `req.validated` ({ params, query, body }) because Express 5 makes `req.query` read-only.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const validated = { params: req.params, query: req.query, body: req.body };

    for (const part of ['params', 'query', 'body']) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: formatPath(issue.path),
          message: issue.message,
        }));
        const [first] = details;
        const message = first.field ? `${first.field}: ${first.message}` : first.message;
        throw ApiError.badRequest(message, { code: 'VALIDATION_ERROR', details });
      }
      validated[part] = result.data;
    }

    req.validated = validated;
    next();
  };
}
