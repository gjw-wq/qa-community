# 问答社区（Q&A Community）

一个基于 React + TypeScript + Express + MySQL 的全栈问答社区。提问者消耗积分发布问题，回答者赚取积分，提问者采纳最佳答案，形成完整的积分激励闭环。

## 功能

- 用户注册 / 登录（JWT），注册赠送 20 积分
- 发布问题：Markdown 内容 + 标签（最多 5 个），消耗 5 积分
- 问题列表：分页、排序（最新 / 热门 / 未解决）、标签筛选、热门标签侧栏
- 问题详情：Markdown 渲染、浏览量统计、点赞 / 取消点赞、回答列表
- 发布回答：奖励 10 积分
- 采纳最佳答案：仅提问者可操作，每题只有一个，被采纳者 +30 积分，问题标记已解决
- 点赞：问题与回答均可点赞 / 取消点赞，防重复点赞，前端显示当前用户点赞状态
- 用户主页：积分、提问数、回答数、被采纳数

## 积分规则

| 动作 | 积分变化 |
| --- | --- |
| 新用户注册 | +20（赠送） |
| 发布问题 | -5 |
| 发布回答 | +10 |
| 回答被采纳 | +30 |
| 问题被点赞 | +5（取消点赞回退） |
| 回答被点赞 | +10（取消点赞回退） |

## 环境准备

- Node.js 18+
- MySQL 8.0+

## 后端启动（server/）

```bash
cd server
npm install
copy .env.example .env   # 按需修改数据库账号密码
```

1. 初始化数据库（创建库、四张表并写入种子数据：8 个问题、22 条回答、16 条点赞记录，其中 2 个问题已解决并有采纳答案）：

```bash
mysql -u root -p < db/init.sql
```

2. 执行种子脚本：使用 bcryptjs 现算哈希，写入演示用户 demo/123456 与 alice/123456，修正种子数据 author_id，并按种子数据重算积分：

```bash
npm run seed
```

3. 启动开发服务（nodemon，端口 3001）：

```bash
npm run dev
```

## 前端启动（client/）

```bash
cd client
npm install
npm run dev
```

浏览器访问 http://localhost:5173（Vite 已将 /api 代理到 http://localhost:3001）。

## 演示账号

| 用户名 | 密码 | 说明 |
| --- | --- | --- |
| demo | 123456 | 演示用户，已发布 4 个问题、11 条回答 |
| alice | 123456 | 演示用户，已发布 4 个问题、11 条回答 |

## 目录结构

```
14-qa-community/
  RESEARCH.md            需求研究
  PRD.md                 产品需求文档
  TECH_DESIGN.md         技术设计（数据库设计 / 积分规则 / 接口清单）
  AGENTS.md              AI 开发指令
  server/                Express 后端
    src/config/db.js     mysql2 连接池
    src/middleware/      auth（JWT 校验）、errorHandler（统一错误处理）
    src/routes/          auth / questions / answers / votes / users
    src/controllers/     业务控制器
    src/models/          数据访问层
    db/init.sql          建库建表 + 种子数据
    scripts/seed.js      演示用户哈希与积分修正
  client/                React + TS + Vite 前端
    src/pages/           Home / QuestionDetail / Ask / UserProfile / Login / Register
    src/components/      Layout / ProtectedRoute / VoteButton / Markdown
    src/context/         AuthContext
    src/api/client.ts    axios 封装（自动带 token，401 跳登录）
```

## 关键实现说明

- 积分、采纳、点赞等写操作全部使用数据库事务，配合 `SELECT ... FOR UPDATE` 行锁防止并发重复点赞
- votes 表 (user_id, target_type, target_id) 唯一索引兜底防重复
- 采纳答案在同一事务内完成：旧采纳置否 -> 新采纳置真 -> 问题置已解决 -> 被采纳者 +30 积分
- 前端 TypeScript 严格模式，axios 拦截器自动携带 Bearer token，401 自动清理凭证并跳转登录页
