const pool = require("../config/db");
const questionModel = require("../models/questionModel");
const answerModel = require("../models/answerModel");
const { HttpError } = require("../middleware/errorHandler");

const QUESTION_COST = 5;

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}

function normalizeTags(tags) {
  if (tags === undefined || tags === null) return [];
  if (!Array.isArray(tags)) {
    throw new HttpError(400, "标签格式不正确");
  }
  const list = tags.map((t) => String(t).trim()).filter(Boolean);
  if (list.length > 5) {
    throw new HttpError(400, "标签数量不能超过 5 个");
  }
  for (const tag of list) {
    if (tag.length > 20) {
      throw new HttpError(400, "单个标签不能超过 20 个字符");
    }
  }
  return list;
}

async function createQuestion(req, res, next) {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
    const content = typeof req.body.content === "string" ? req.body.content : "";
    if (title.length < 2 || title.length > 100) {
      throw new HttpError(400, "标题长度需在 2 到 100 个字符之间");
    }
    if (!content.trim()) {
      throw new HttpError(400, "问题内容不能为空");
    }
    const tags = normalizeTags(req.body.tags);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [users] = await conn.query("SELECT points FROM users WHERE id = ? FOR UPDATE", [
        req.user.id
      ]);
      if (!users.length) {
        throw new HttpError(401, "用户不存在或已被删除");
      }
      if (users[0].points < QUESTION_COST) {
        throw new HttpError(400, "积分不足，发布问题需要 " + QUESTION_COST + " 积分");
      }
      await conn.query("UPDATE users SET points = points - ? WHERE id = ?", [
        QUESTION_COST,
        req.user.id
      ]);
      const questionId = await questionModel.create(conn, {
        title,
        content,
        tags,
        authorId: req.user.id
      });
      await conn.commit();
      res.status(201).json({ message: "发布成功", data: { id: questionId } });
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

async function listQuestions(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const sort = ["latest", "hot", "unsolved"].includes(req.query.sort) ? req.query.sort : "latest";
    const tag = req.query.tag ? String(req.query.tag).trim() : null;

    const result = await questionModel.list({
      page,
      pageSize,
      sort,
      tag: tag || null,
      currentUserId: req.user ? req.user.id : null
    });
    res.json({ list: result.list, total: result.total, page, pageSize });
  } catch (err) {
    next(err);
  }
}

async function getQuestionDetail(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      throw new HttpError(400, "参数不合法");
    }
    const question = await questionModel.findById(id, req.user ? req.user.id : null);
    if (!question) {
      throw new HttpError(404, "问题不存在");
    }
    await questionModel.addViews(id);
    question.views += 1;
    const answers = await answerModel.listByQuestion(id, req.user ? req.user.id : null);
    res.json({ question, answers });
  } catch (err) {
    next(err);
  }
}

async function hotTags(req, res, next) {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const list = await questionModel.hotTags(limit);
    res.json({ list });
  } catch (err) {
    next(err);
  }
}

module.exports = { createQuestion, listQuestions, getQuestionDetail, hotTags };
