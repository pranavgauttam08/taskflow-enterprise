export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (err) {
      const errors = err.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [{ message: 'Validation failed' }];
      
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (err) {
      const errors = err.errors?.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })) || [{ message: 'Validation failed' }];
      
      return res.status(400).json({ error: 'Query validation failed', details: errors });
    }
  };
}
