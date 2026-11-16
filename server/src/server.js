require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log("数据库连接成功");
  } catch (err) {
    console.error("数据库连接失败：" + err.message);
    process.exit(1);
  }
  app.listen(PORT, () => {
    console.log("问答社区后端已启动: http://localhost:" + PORT);
  });
}

start();
