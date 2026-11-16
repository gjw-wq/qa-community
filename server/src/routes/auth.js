const router = require("express").Router();
const { register, login, me } = require("../controllers/authController");
const { requiredAuth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", requiredAuth, me);

module.exports = router;
