# 问答社区技术设计

## 技术栈

- 前端：React 18 + TypeScript（严格模式）+ Vite 5 + Tailwind CSS 3 + axios + react-router-dom 6 + react-markdown 9
- 后端：Node.js + Express 4 + mysql2（promise 池）+ jsonwebtoken + bcryptjs
- 数据库：MySQL 8（InnoDB、utf8mb4）

## 项目结构

```
14-qa-community/
  server/                 后端（Express）
    src/
      app.js              应用与路由挂载
      server.js           启动入口
      config/db.js        mysql2 连接池
      middleware/         auth（JWT）、errorHandler
      routes/             auth、questions、answers、votes、users
      controllers/        业务控制器
      models/             数据访问层
    db/init.sql           建库建表 + 种子数据
    scripts/seed.js       演示用户密码哈希与积分修正
  client/                 前端（React + TS + Vite）
    src/
      api/client.ts       axios 封装（自动带 token、401 跳登录）
      context/AuthContext.tsx
      components/         Layout、ProtectedRoute、VoteButton、Markdown
      pages/              Home、QuestionDetail、Ask、UserProfile、Login、Register
      types.ts utils.ts
```

## 数据库设计

### users（用户表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT UNSIGNED PK AI | 主键 |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password | VARCHAR(100) | bcrypt 哈希 |
| avatar | VARCHAR(255) NULL | 头像 |
| points | INT DEFAULT 0 | 积分 |
| created_at / updated_at | TIMESTAMP | 时间 |

### questions（问题表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT UNSIGNED PK AI | 主键 |
| title | VARCHAR(200) | 标题 |
| content | MEDIUMTEXT | Markdown 内容 |
| tags | JSON | 标签数组 |
| author_id | FK -> users.id | 提问者 |
| views | INT UNSIGNED | 浏览量 |
| answers_count | INT UNSIGNED | 回答数 |
| votes | INT | 点赞数 |
| is_solved | TINYINT(1) | 是否已解决 |
| created_at / updated_at | TIMESTAMP | 时间 |

索引：created_at、votes、author_id、is_solved。

### answers（回答表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT UNSIGNED PK AI | 主键 |
| content | MEDIUMTEXT | Markdown 内容 |
| question_id | FK -> questions.id | 所属问题 |
| author_id | FK -> users.id | 回答者 |
| votes | INT | 点赞数 |
| is_accepted | TINYINT(1) | 是否被采纳 |
| created_at / updated_at | TIMESTAMP | 时间 |

索引：question_id、author_id。

### votes（点赞表）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | INT UNSIGNED PK AI | 主键 |
| user_id | FK -> users.id | 点赞人 |
| target_type | ENUM('question','answer') | 目标类型 |
| target_id | INT UNSIGNED | 目标 ID |
| created_at | TIMESTAMP | 时间 |

唯一索引 (user_id, target_type, target_id) 防重复点赞；普通索引 (target_type, target_id)。
说明：target 为多态引用，不建外键，由应用层事务保证一致性。

## 积分规则表

| 动作 | 积分变化 |
| --- | --- |
| 新用户注册 | +20（赠送） |
| 发布问题 | -5 |
| 发布回答 | +10 |
| 回答被采纳 | +30 |
| 问题被点赞 | +5（取消点赞回退 -5） |
| 回答被点赞 | +10（取消点赞回退 -10） |

## 接口清单

| 方法 | 路径 | 说明 | 权限 |
| --- | --- | --- | --- |
| POST | /api/auth/register | 注册（赠送 20 积分），返回 token + user | 公开 |
| POST | /api/auth/login | 登录，返回 token + user | 公开 |
| GET | /api/auth/me | 当前用户信息 | 登录 |
| POST | /api/questions | 发布问题：校验积分 >= 5，事务扣 5 积分并插入 | 登录 |
| GET | /api/questions | 问题列表：page/pageSize/sort=latest\|hot\|unsolved/tag 筛选，含 is_liked | 公开 |
| GET | /api/questions/tags/hot | 热门标签聚合（最多 10 个） | 公开 |
| GET | /api/questions/:id | 详情：views+1、当前用户是否点赞、回答列表（含采纳/点赞状态） | 公开 |
| POST | /api/questions/:id/answers | 发布回答：事务 +10 积分、answers_count+1 | 登录 |
| PUT | /api/answers/:id/accept | 采纳：仅提问者；旧采纳置 false -> 新采纳置 true -> is_solved=1 -> 回答者 +30，全部事务内 | 登录 |
| POST | /api/votes/toggle | 点赞切换：存在则取消（计数-1、作者扣分），否则点赞（计数+1、作者加分），事务内完成 | 登录 |
| GET | /api/users/:id | 公开主页：积分、提问数、回答数、被采纳数 | 公开 |

## 关键技术点

1. 事务：扣积分（提问）、回答加分、采纳、点赞均使用 `getConnection + beginTransaction/commit/rollback`，行级锁（SELECT ... FOR UPDATE）防止并发重复点赞。
2. 防重复点赞：votes 表唯一索引兜底 + 事务内先查后写。
3. 每题单采纳：采纳时先把该问题旧的 is_accepted 全部置 0 再置新答案为 1。
4. 权限校验：JWT 必选/可选中间件；采纳接口校验「当前用户 = 提问者」。
5. 列表「是否已点赞」：optionalAuth 识别当前用户，批量查询 votes 表后拼装 is_liked 字段。
6. 前端：axios 拦截器自动携带 Bearer token，401 清理凭证并跳转 /login；ProtectedRoute 保护 /ask。
