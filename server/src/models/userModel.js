const pool = require("../config/db");

async function findById(id) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
}

async function findByUsername(username) {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
}

async function createUser({ username, email, passwordHash, points }) {
  const [result] = await pool.query(
    "INSERT INTO users (username, email, password, points) VALUES (?, ?, ?, ?)",
    [username, email, passwordHash, points]
  );
  return result.insertId;
}

async function changePoints(executor, userId, delta) {
  await executor.query("UPDATE users SET points = points + ? WHERE id = ?", [delta, userId]);
}

function toPublic(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    points: user.points,
    created_at: user.created_at
  };
}

module.exports = { findById, findByUsername, findByEmail, createUser, changePoints, toPublic };
