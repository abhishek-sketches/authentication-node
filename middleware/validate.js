const { z } = require("zod");

const credentials = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  // bcrypt only uses the first 72 bytes, so cap the length.
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = { validate, credentials };
