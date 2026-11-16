const router = require("express").Router();
const {
  createQuestion,
  listQuestions,
  getQuestionDetail,
  hotTags
} = require("../controllers/questionController");
const { createAnswer } = require("../controllers/answerController");
const { requiredAuth, optionalAuth } = require("../middleware/auth");

// 注意：/tags/hot 必须注册在 /:id 之前
router.get("/tags/hot", hotTags);

router.post("/", requiredAuth, createQuestion);
router.get("/", optionalAuth, listQuestions);
router.get("/:id", optionalAuth, getQuestionDetail);
router.post("/:id/answers", requiredAuth, createAnswer);

module.exports = router;
