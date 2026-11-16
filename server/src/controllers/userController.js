const pool = require("../config/db");
const { HttpError } = require("../middleware/errorHandler");

async function getPublicProfile(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "参数不合法");
    }
    const [users] = await pool.query(
      "SELECT id, username, avatar, points, created_at FROM users WHERE id = ?",
      [id]
    );
    if (!users.length) {
      throw new HttpError(404, "用户不存在");
    }
    const [questionRows] = await pool.query(
      "SELECT COUNT(*) AS c FROM questions WHERE author_id = ?",
      [id]
    );
    const [answerRows] = await pool.query(
      "SELECT COUNT(*) AS c FROM answers WHERE author_id = ?",
      [id]
    );
    const [acceptedRows] = await pool.query(
      "SELECT COUNT(*) AS c FROM answers WHERE author_id = ? AND is_accepted = 1",
      [id]
    );
    res.json({
      user: users[0],
      stats: {
        question_count: questionRows[0].c,
        answer_count: answerRows[0].c,
        accepted_count: acceptedRows[0].c
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicProfile };
