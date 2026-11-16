const pool = require("../config/db");
const voteModel = require("./voteModel");

function safeParseTags(raw) {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}

function makeExcerpt(content) {
  const plain = String(content)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`~!]/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > 150 ? plain.slice(0, 150) + "..." : plain;
}

function mapQuestion(row, likedSet) {
  return {
    id: row.id,
    title: row.title,
    excerpt: makeExcerpt(row.content),
    tags: safeParseTags(row.tags),
    views: row.views,
    answers_count: row.answers_count,
    votes: row.votes,
    is_solved: !!row.is_solved,
    is_liked: likedSet ? likedSet.has(row.id) : false,
    created_at: row.created_at,
    author: {
      id: row.author_id,
      username: row.author_name,
      avatar: row.author_avatar
    }
  };
}

const LIST_SQL = `SELECT q.id, q.title, q.content, q.tags, q.views, q.answers_count, q.votes, q.is_solved, q.created_at,
  u.id AS author_id, u.username AS author_name, u.avatar AS author_avatar
  FROM questions q JOIN users u ON u.id = q.author_id`;

async function list({ page, pageSize, sort, tag, currentUserId }) {
  const where = [];
  const params = [];
  if (sort === "unsolved") {
    where.push("q.is_solved = 0");
  }
  if (tag) {
    where.push("JSON_CONTAINS(q.tags, JSON_QUOTE(?))");
    params.push(tag);
  }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const orderSql =
    sort === "hot" ? "ORDER BY q.votes DESC, q.created_at DESC" : "ORDER BY q.created_at DESC";
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    "SELECT COUNT(*) AS total FROM questions q " + whereSql,
    params
  );
  const [rows] = await pool.query(
    LIST_SQL + " " + whereSql + " " + orderSql + " LIMIT ? OFFSET ?",
    [...params, pageSize, offset]
  );
  const likedSet = await voteModel.getLikedTargetIds(
    currentUserId,
    "question",
    rows.map((r) => r.id)
  );
  return {
    total: countRows[0].total,
    list: rows.map((r) => mapQuestion(r, likedSet))
  };
}

async function findById(id, currentUserId) {
  const [rows] = await pool.query(LIST_SQL + " WHERE q.id = ?", [id]);
  if (!rows.length) return null;
  const likedSet = await voteModel.getLikedTargetIds(currentUserId, "question", [id]);
  const question = mapQuestion(rows[0], likedSet);
  question.content = rows[0].content;
  delete question.excerpt;
  return question;
}

async function create(conn, { title, content, tags, authorId }) {
  const [result] = await conn.query(
    "INSERT INTO questions (title, content, tags, author_id) VALUES (?, ?, ?, ?)",
    [title, content, JSON.stringify(tags), authorId]
  );
  return result.insertId;
}

async function addViews(id) {
  await pool.query("UPDATE questions SET views = views + 1 WHERE id = ?", [id]);
}

async function updateAnswersCount(conn, questionId, delta) {
  await conn.query("UPDATE questions SET answers_count = answers_count + ? WHERE id = ?", [
    delta,
    questionId
  ]);
}

async function setSolved(conn, questionId) {
  await conn.query("UPDATE questions SET is_solved = 1 WHERE id = ?", [questionId]);
}

async function hotTags(limit) {
  const [rows] = await pool.query("SELECT tags FROM questions");
  const counter = {};
  for (const row of rows) {
    for (const tag of safeParseTags(row.tags)) {
      counter[tag] = (counter[tag] || 0) + 1;
    }
  }
  return Object.keys(counter)
    .map((name) => ({ name, count: counter[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

module.exports = { list, findById, create, addViews, updateAnswersCount, setSolved, hotTags };
