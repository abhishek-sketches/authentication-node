const router = require("express").Router();
const { signup, signin, getAllUser, logout } = require("../controller/user.controller");
const { authenticateUser } = require("../middleware/auth");
const { validate, credentials } = require("../middleware/validate");

router.post("/signup", validate(credentials), signup);
router.post("/signin", validate(credentials), signin);
// POST so that logging out cannot be triggered by cross-site GET requests.
router.post("/logout", logout);
router.get("/get-all-user", authenticateUser, getAllUser);

module.exports = router;
