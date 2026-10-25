// Database configuration, read from environment variables (see .env.example).
// Used by both the app (models/index.js) and sequelize-cli (.sequelizerc).
require("dotenv").config({ quiet: true });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 5432,
  dialect: "postgres",
  logging: false,
};

module.exports = {
  development: base,
  test: { ...base, database: process.env.DB_NAME_TEST || `${base.database}_test` },
  production: {
    ...base,
    dialectOptions:
      process.env.DB_SSL === "true" ? { ssl: { require: true, rejectUnauthorized: true } } : {},
  },
};
