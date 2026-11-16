const pool = require("../config/db");
const questionModel = require("../models/questionModel");
const answerModel = require("../models/answerModel");
const userModel = require("../models/userModel");
const { HttpError } = require("../middleware/errorHandler");

const ANSWER_REWARD = 10;
const ACCEPT_REWARD = 30;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

async function createAnswer(req, res, next) {
  try {
    const questionId = parseId(req.params.id);
    const content = typeof req.body.content === "string" ? req.body.content : "";
    if (!questionId) {
      throw new HttpError(400, "参数不合法");
    }
    if (!content.trim()) {
      throw new HttpError(400, "回答内容不能为空");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [questions] = await conn.query("SELECT id FROM questions WHERE id = ?", [questionId]);
      if (!questions.length) {
        throw new HttpError(404, "问题不存在");
      }
      const answerId = await answerModel.create(conn, {
        questionId,
        content,
        authorId: req.user.id
      });
      await questionModel.updateAnswersCount(conn, questionId, 1);
      await userModel.changePoints(conn, req.user.id, ANSWER_REWARD);
      await conn.commit();
      res.status(201).json({ message: "回答发布成功，积分 +" + ANSWER_REWARD, data: { id: answerId } });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

async function acceptAnswer(req, res, next) {
  try {
    const answerId = parseId(req.params.id);
    if (!answerId) {
      throw new HttpError(400, "参数不合法");
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const answer = await answerModel.findByIdWithQuestion(answerId);
      if (!answer) {
        throw new HttpError(404, "回答不存在");
      }
      if (answer.question_author_id !== req.user.id) {
        throw new HttpError(403, "只有提问者可以采纳回答");
      }
      if (answer.is_accepted) {
        throw new HttpError(400, "该回答已被采纳");
      }
      // 每题只能有一个采纳：先把旧采纳置为未采纳
      await answerModel.clearAccepted(conn, answer.question_id);
      await answerModel.markAccepted(conn, answerId);
      await questionModel.setSolved(conn, answer.question_id);
      await userModel.changePoints(conn, answer.author_id, ACCEPT_REWARD);
      await conn.commit();
      res.json({ message: "采纳成功，回答者积分 +" + ACCEPT_REWARD });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

module.exports = { createAnswer, acceptAnswer };
