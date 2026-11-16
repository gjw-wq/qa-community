const router = require("express").Router();
const { acceptAnswer } = require("../controllers/answerController");
const { requiredAuth } = require("../middleware/auth");

router.put("/:id/accept", requiredAuth, acceptAnswer);

module.exports = router;
