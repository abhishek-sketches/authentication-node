const router = require("express").Router();
const userRoutes = require("./user.route");

router.get("/health", (req, res) => res.json({ status: "ok" }));
router.use("/user", userRoutes);

module.exports = router;
