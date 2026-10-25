// Integration tests. Require a reachable PostgreSQL (see .env.example); they
// use the `<DB_NAME>_test` database, which must already be migrated:
//   NODE_ENV=test npm run migrate
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ||= "test-secret-test-secret-test-secret-123";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../app");
const db = require("../models");

let server;
let base;
const email = `user-${Date.now()}@example.com`;
const password = "correct-horse-battery";
let cookie;

const post = (path, body) =>
  fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });

before(async () => {
  await db.sequelize.authenticate();
  await new Promise((r) => (server = app.listen(0, r)));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await db.users.destroy({ where: { email } });
  server.close();
  await db.sequelize.close();
});

test("signup validates input", async () => {
  assert.equal((await post("/user/signup", { email: "nope", password })).status, 400);
  assert.equal((await post("/user/signup", { email, password: "short" })).status, 400);
});

test("signup never returns the password hash", async () => {
  const res = await post("/user/signup", { email: email.toUpperCase(), password });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.email, email);
  assert.equal(body.password, undefined);
  assert.equal((await post("/user/signup", { email, password })).status, 409);
});

test("signin rejects bad credentials identically", async () => {
  const a = await post("/user/signin", { email, password: "wrong-password" });
  const b = await post("/user/signin", { email: "missing@example.com", password });
  assert.equal(a.status, 401);
  assert.deepEqual(await a.json(), await b.json());
});

test("signin sets an httpOnly cookie and protects routes", async () => {
  assert.equal((await fetch(base + "/user/get-all-user")).status, 401);
  const res = await post("/user/signin", { email, password });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get("set-cookie");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  cookie = setCookie.split(";")[0];
  const list = await fetch(base + "/user/get-all-user", { headers: { cookie } });
  assert.equal(list.status, 200);
  const { users } = await list.json();
  assert.ok(users.every((u) => u.password === undefined));
});

test("security headers and malformed JSON handling", async () => {
  const res = await fetch(base + "/health");
  assert.ok(res.headers.get("x-content-type-options"));
  assert.equal(res.headers.get("x-powered-by"), null);
  const bad = await fetch(base + "/user/signin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{oops",
  });
  assert.equal(bad.status, 400);
});
