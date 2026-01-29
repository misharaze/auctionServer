export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return res.status(400).json({
      error: "Validation error",
      details: result.error.issues.map(i => ({
        path: i.path,
        message: i.message,
      })),
    });
  }

  // ✅ кладём в отдельное поле
  req.validated = result.data;

  next();
};
