# authentication-node

Express + Sequelize (PostgreSQL) user authentication API: sign up, sign in with
a JWT stored in an httpOnly cookie, a protected route, and logout.

## Requirements

- Node.js 20+
- PostgreSQL

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values (see below)
npm run migrate           # creates/updates the tables
npm start
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | yes | Signing key, at least 32 chars. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DB_NAME`, `DB_USER` | yes | PostgreSQL database and user |
| `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | no | Default host `127.0.0.1`, port `5432` |
| `DB_SSL` | no | `true` to require TLS to the database in production |
| `PORT` | no | Default `8080` |
| `JWT_EXPIRES_IN` | no | Token/cookie lifetime in seconds (default `3600`) |
| `CORS_ORIGINS` | no | Comma-separated allowed browser origins. Empty = no CORS headers |
| `AUTH_RATE_LIMIT` | no | Sign-in/sign-up attempts per IP per 15 min (default `20`) |
| `TRUST_PROXY` | no | Set (e.g. `1`) when behind a reverse proxy so rate limiting sees client IPs |

Never commit `.env`. Database credentials are no longer stored in `config/config.json`; `config/config.js` reads the variables above, and `.sequelizerc` points `sequelize-cli` at it.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the server |
| `npm run dev` | Start with `node --watch` |
| `npm run migrate` / `npm run migrate:undo` | Apply / revert the latest migration |
| `npm test` | Integration tests (need PostgreSQL; run `NODE_ENV=test npm run migrate` first. Uses `<DB_NAME>_test`) |

## API

| Method | Path | Auth | Body | Notes |
| --- | --- | --- | --- | --- |
| GET | `/health` | no | | Liveness check |
| POST | `/user/signup` | no | `{ email, password }` | Password 8-72 chars. `201` with `{ id, email, createdAt }`; `409` if taken |
| POST | `/user/signin` | no | `{ email, password }` | Sets `token` cookie; `401` with one generic message for any bad credential |
| POST | `/user/logout` | no | | Clears the cookie (was `GET`; changed to avoid cross-site logout) |
| GET | `/user/get-all-user` | cookie | | Lists `{ id, email, createdAt }` |

## Security notes

- Passwords hashed with bcrypt (12 rounds); hashes are never returned by the API.
- JWTs are HS256-only, expire, and are sent in an httpOnly, `SameSite=Strict` cookie (`Secure` when `NODE_ENV=production`).
- `helmet`, JSON body size limit, schema validation (zod), rate limiting on sign-in/sign-up, opt-in CORS.
- `npm audit` reports a moderate advisory for `uuid` via `sequelize` 6. It only affects `uuid` v3/v5/v6 called with a caller-supplied buffer, which Sequelize does not do; no non-breaking fix exists.
