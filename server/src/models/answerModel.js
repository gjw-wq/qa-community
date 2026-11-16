const pool = require("../config/db");
const voteModel = require("./voteModel");

async function listByQuestion(questionId, currentUserId) {
  const [rows] = await pool.query(
    `SELECT a.id, a.content, a.votes, a.is_accepted, a.created_at,
       u.id AS author_id, u.username AS author_name, u.avatar AS author_avatar
     FROM answers a JOIN users u ON u.id = a.author_id
     WHERE a.question_id = ?
     ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
    [questionId]
  );
  const likedSet = await voteModel.getLikedTargetIds(
    currentUserId,
    "answer",
    rows.map((r) => r.id)
  );
  return rows.map((r) => ({
    id: r.id,
    content: r.content,
    votes: r.votes,
    is_accepted: !!r.is_accepted,
    is_liked: likedSet.has(r.id),
    created_at: r.created_at,
    author: {
      id: r.author_id,
      username: r.author_name,
      avatar: r.author_avatar
    }
  }));
}

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM answers WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findByIdWithQuestion(id) {
  const [rows] = await pool.query(
    `SELECT a.id, a.question_id, a.author_id, a.is_accepted,
       q.author_id AS question_author_id
     FROM answers a JOIN questions q ON q.id = a.question_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(conn, { questionId, content, authorId }) {
  const [result] = await conn.query(
    "INSERT INTO answers (question_id, content, author_id) VALUES (?, ?, ?)",
    [questionId, content, authorId]
  );
  return result.insertId;
}

async function clearAccepted(conn, questionId) {
  await conn.query(
    "UPDATE answers SET is_accepted = 0 WHERE question_id = ? AND is_accepted = 1",
    [questionId]
  );
}

async function markAccepted(conn, answerId) {
  await conn.query("UPDATE answers SET is_accepted = 1 WHERE id = ?", [answerId]);
}

module.exports = {
  listByQuestion,
  findById,
  findByIdWithQuestion,
  create,
  clearAccepted,
  markAccepted
};
