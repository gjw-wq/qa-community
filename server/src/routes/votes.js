const router = require("express").Router();
const { toggleVote } = require("../controllers/voteController");
const { requiredAuth } = require("../middleware/auth");

router.post("/toggle", requiredAuth, toggleVote);

module.exports = router;
