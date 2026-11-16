const pool = require("../config/db");

async function findByUserAndTarget(executor, userId, targetType, targetId) {
  const [rows] = await executor.query(
    "SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ? FOR UPDATE",
    [userId, targetType, targetId]
  );
  return rows[0] || null;
}

async function create(executor, userId, targetType, targetId) {
  await executor.query(
    "INSERT INTO votes (user_id, target_type, target_id) VALUES (?, ?, ?)",
    [userId, targetType, targetId]
  );
}

async function remove(executor, voteId) {
  await executor.query("DELETE FROM votes WHERE id = ?", [voteId]);
}

async function getLikedTargetIds(userId, targetType, targetIds) {
  if (!userId || !targetIds.length) return new Set();
  const [rows] = await pool.query(
    "SELECT target_id FROM votes WHERE user_id = ? AND target_type = ? AND target_id IN (?)",
    [userId, targetType, targetIds]
  );
  return new Set(rows.map((r) => r.target_id));
}

module.exports = { findByUserAndTarget, create, remove, getLikedTargetIds };
