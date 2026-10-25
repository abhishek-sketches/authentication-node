// Loads .env and validates required settings once, at startup.
require("dotenv").config({ quiet: true });

const required = ["JWT_SECRET", "DB_NAME", "DB_USER"];
const missing = required.filter((key) => !process.env[key]);

function assertServerEnv() {
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }
}

module.exports = { assertServerEnv };
