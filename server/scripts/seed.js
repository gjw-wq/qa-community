/**
 * 种子脚本：在 db/init.sql 执行之后运行（npm run seed）
 * 1. 使用 bcryptjs 现算哈希，写入两个演示用户：demo/123456、alice/123456
 * 2. 修正种子数据的 author_id / user_id 引用，保证外键完整性
 * 3. 按种子数据重算两个演示用户的积分，保证积分与行为记录一致
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

const DEMO_USERS = [
  { id: 1, username: "demo", email: "demo@example.com", password: "123456" },
  { id: 2, username: "alice", email: "alice@example.com", password: "123456" }
];

async function ensureDemoUsers(conn) {
  for (const user of DEMO_USERS) {
    const passwordHash = bcrypt.hashSync(user.password, 10);
    const [rows] = await conn.query("SELECT id FROM users WHERE id = ? OR username = ?", [
      user.id,
      user.username
    ]);
    if (rows.length) {
      await conn.query("UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?", [
        user.username,
        user.email,
        passwordHash,
        user.id
      ]);
      console.log("已更新演示用户: " + user.username + " / " + user.password);
    } else {
      await conn.query(
        "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
        [user.id, user.username, user.email, passwordHash]
      );
      console.log("已创建演示用户: " + user.username + " / " + user.password);
    }
  }
}

async function fixSeedReferences(conn) {
  // 若种子数据的作者引用指向不存在的用户，统一归到演示用户 demo（id=1）
  await conn.query("UPDATE questions SET author_id = 1 WHERE author_id NOT IN (SELECT id FROM users)");
  await conn.query("UPDATE answers SET author_id = 1 WHERE author_id NOT IN (SELECT id FROM users)");
  await conn.query("UPDATE votes SET user_id = 1 WHERE user_id NOT IN (SELECT id FROM users)");
  console.log("种子数据 author_id / user_id 引用已校验");
}

async function recomputePoints(conn, userId) {
  const [questionRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM questions WHERE author_id = ?",
    [userId]
  );
  const [answerRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM answers WHERE author_id = ?",
    [userId]
  );
  const [acceptedRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM answers WHERE author_id = ? AND is_accepted = 1",
    [userId]
  );
  const [questionVoteRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM votes v JOIN questions q ON q.id = v.target_id " +
      "AND v.target_type = 'question' WHERE q.author_id = ?",
    [userId]
  );
  const [answerVoteRows] = await conn.query(
    "SELECT COUNT(*) AS c FROM votes v JOIN answers a ON a.id = v.target_id " +
      "AND v.target_type = 'answer' WHERE a.author_id = ?",
    [userId]
  );
  const points =
    questionRows[0].c * -5 +
    answerRows[0].c * 10 +
    acceptedRows[0].c * 30 +
    questionVoteRows[0].c * 5 +
    answerVoteRows[0].c * 10;
  await conn.query("UPDATE users SET points = ? WHERE id = ?", [points, userId]);
  return points;
}

async function main() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureDemoUsers(conn);
    await fixSeedReferences(conn);
    for (const user of DEMO_USERS) {
      const points = await recomputePoints(conn, user.id);
      console.log("用户 " + user.username + " 积分已重算: " + points);
    }
    await conn.commit();
    console.log("种子数据初始化完成");
    console.log("演示账号: demo / 123456、alice / 123456");
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("种子数据初始化失败：" + err.message);
  process.exit(1);
});
