const { assertServerEnv } = require("./config/env");
assertServerEnv(); // loads .env and fails fast on missing/weak settings

const app = require("./app");

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
