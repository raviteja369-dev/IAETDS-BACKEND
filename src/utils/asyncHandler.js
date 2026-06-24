/**
 * Wraps async route handlers and forwards rejected promises to Express
 * error-handling middleware, removing repetitive try/catch blocks.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
