const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");
const routes = require("./routes");

const app = express();

if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
app.disable("x-powered-by");
app.use(helmet());

const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (origins.length) {
  app.use(cors({ origin: origins, credentials: true }));
}

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Brute-force protection for the credential endpoints.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});
app.use(["/user/signin", "/user/signup"], authLimiter);

app.use("/", routes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
