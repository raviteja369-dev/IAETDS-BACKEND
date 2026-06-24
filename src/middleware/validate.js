import { ApiError } from '../utils/ApiError.js';

/**
 * Validates `req` parts against a Zod schema object: { body, query, params }.
 */
export function validate(schema) {
  return (req, _res, next) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
      next();
    } catch (err) {
      const details = err.errors?.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      next(ApiError.badRequest('Validation failed', details));
    }
  };
}
