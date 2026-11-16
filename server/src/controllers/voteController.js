const pool = require("../config/db");
const voteModel = require("../models/voteModel");
const userModel = require("../models/userModel");
const { HttpError } = require("../middleware/errorHandler");

// 点赞积分：问题 +5 / 回答 +10（取消点赞回退相同数值）
const POINTS_MAP = { question: 5, answer: 10 };
const TABLE_MAP = { question: "questions", answer: "answers" };

async function toggleVote(req, res, next) {
  try {
    const targetType = req.body.target_type;
    const targetId = Number(req.body.target_id);

    if (!Object.prototype.hasOwnProperty.call(POINTS_MAP, targetType)) {
      throw new HttpError(400, "点赞目标类型不合法");
    }
    if (!Number.isInteger(targetId) || targetId <= 0) {
      throw new HttpError(400, "点赞目标 ID 不合法");
    }

    const table = TABLE_MAP[targetType];
    const delta = POINTS_MAP[targetType];

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [targets] = await conn.query(
        "SELECT id, author_id, votes FROM " + table + " WHERE id = ? FOR UPDATE",
        [targetId]
      );
      if (!targets.length) {
        throw new HttpError(404, "点赞目标不存在");
      }
      const target = targets[0];

      const existing = await voteModel.findByUserAndTarget(conn, req.user.id, targetType, targetId);
      let voted;
      if (existing) {
        await voteModel.remove(conn, existing.id);
        await conn.query("UPDATE " + table + " SET votes = votes - 1 WHERE id = ?", [targetId]);
        await userModel.changePoints(conn, target.author_id, -delta);
        voted = false;
      } else {
        await voteModel.create(conn, req.user.id, targetType, targetId);
        await conn.query("UPDATE " + table + " SET votes = votes + 1 WHERE id = ?", [targetId]);
        await userModel.changePoints(conn, target.author_id, delta);
        voted = true;
      }
      await conn.commit();
      const votes = target.votes + (voted ? 1 : -1);
      res.json({ voted, votes, message: voted ? "点赞成功" : "已取消点赞" });
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

module.exports = { toggleVote };
