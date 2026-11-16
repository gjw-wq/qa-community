-- 问答社区数据库初始化脚本
-- 用法：mysql -u root -p < db/init.sql
-- 说明：
--   1. 本脚本创建 qa_community 库、四张表（users/questions/answers/votes）并写入种子数据
--   2. 两个演示用户（demo / alice）的密码为占位哈希，执行 npm run seed 后会被替换为
--      bcryptjs 现算的真实哈希（密码均为 123456），并按种子数据重算积分
--   3. 种子数据：8 个问题、22 条回答、16 条点赞记录，其中 2 个问题已解决且有采纳答案

CREATE DATABASE IF NOT EXISTS qa_community DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qa_community;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  email VARCHAR(100) NOT NULL COMMENT '邮箱',
  password VARCHAR(100) NOT NULL COMMENT 'bcrypt 哈希',
  avatar VARCHAR(255) DEFAULT NULL COMMENT '头像 URL',
  points INT NOT NULL DEFAULT 0 COMMENT '积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '用户表';

-- 问题表
CREATE TABLE questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL COMMENT '标题',
  content MEDIUMTEXT NOT NULL COMMENT 'Markdown 内容',
  tags JSON NOT NULL COMMENT '标签数组',
  author_id INT UNSIGNED NOT NULL COMMENT '提问者 ID',
  views INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '浏览量',
  answers_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '回答数',
  votes INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  is_solved TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已解决',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_questions_created_at (created_at),
  INDEX idx_questions_votes (votes),
  INDEX idx_questions_author (author_id),
  INDEX idx_questions_solved (is_solved),
  CONSTRAINT fk_questions_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '问题表';

-- 回答表
CREATE TABLE answers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content MEDIUMTEXT NOT NULL COMMENT 'Markdown 内容',
  question_id INT UNSIGNED NOT NULL COMMENT '所属问题 ID',
  author_id INT UNSIGNED NOT NULL COMMENT '回答者 ID',
  votes INT NOT NULL DEFAULT 0 COMMENT '点赞数',
  is_accepted TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否被采纳',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_answers_question (question_id),
  INDEX idx_answers_author (author_id),
  CONSTRAINT fk_answers_question FOREIGN KEY (question_id) REFERENCES questions (id),
  CONSTRAINT fk_answers_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '回答表';

-- 点赞表（target 为多态引用，不建外键，由应用层事务保证一致性）
CREATE TABLE votes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL COMMENT '点赞用户 ID',
  target_type ENUM('question', 'answer') NOT NULL COMMENT '目标类型',
  target_id INT UNSIGNED NOT NULL COMMENT '目标 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_votes_user_target (user_id, target_type, target_id),
  INDEX idx_votes_target (target_type, target_id),
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '点赞表';

-- ============ 种子数据 ============

-- 演示用户占位行（密码哈希由 scripts/seed.js 替换为 bcryptjs 现算值）
-- 积分按种子数据核算：4 个问题(-20) + 11 条回答(+110) + 1 个采纳(+30) + 4 个问题被赞(+20) + 4 条回答被赞(+40) = 180
INSERT INTO users (id, username, email, password, avatar, points, created_at) VALUES
(1, 'demo', 'demo@example.com', 'PLACEHOLDER_HASH_TO_BE_REPLACED_BY_SEED', NULL, 180, DATE_SUB(NOW(), INTERVAL 30 DAY)),
(2, 'alice', 'alice@example.com', 'PLACEHOLDER_HASH_TO_BE_REPLACED_BY_SEED', NULL, 180, DATE_SUB(NOW(), INTERVAL 30 DAY));

-- 8 个问题（views / answers_count / votes 与下方回答、点赞数据保持一致）
INSERT INTO questions (id, title, content, tags, author_id, views, answers_count, votes, is_solved, created_at) VALUES
(1, 'Vue 3 组合式 API 相比选项式 API 有什么优势？',
'最近在重构一个中后台项目，团队对是否全面切换到组合式 API 有争议。

想请教大家：

- 组合式 API 相比选项式 API 的**核心优势**是什么？
- 逻辑复用方面 composables 相比 mixins 好在哪里？
- 实践中有哪些常见的坑？

示例代码：

```js
export function useCounter() {
  const count = ref(0);
  const increment = () => count.value++;
  return { count, increment };
}
```',
'["Vue", "前端"]', 1, 156, 2, 1, 1, DATE_SUB(NOW(), INTERVAL 20 DAY)),

(2, 'MySQL 深分页 LIMIT 100000,10 为什么慢？如何优化？',
'列表页翻到很后面时接口明显变慢，SQL 大概是这样：

```sql
SELECT id, title FROM articles ORDER BY id LIMIT 100000, 10;
```

为什么 offset 越大越慢？有什么实用的优化方案？',
'["MySQL", "数据库"]', 2, 232, 2, 1, 1, DATE_SUB(NOW(), INTERVAL 18 DAY)),

(3, 'React 的 useEffect 依赖数组为空时如何避免闭包陷阱？',
'遇到一个诡异的问题：定时器里读到的 state 永远是初始值。

```js
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远输出 0
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

为什么依赖数组为空时 count 不更新？有哪些正确的写法？',
'["React", "前端"]', 1, 98, 2, 1, 0, DATE_SUB(NOW(), INTERVAL 15 DAY)),

(4, 'Node.js 事件循环中 nextTick 和 setImmediate 有什么区别？',
'文档说 nextTick 在当前操作完成后立即执行，setImmediate 在事件循环的 check 阶段执行，但还是容易混淆。

想请教：

- 两者的执行时机具体差在哪里？
- 什么场景该用哪个？
- 有没有经典的坑？',
'["Node.js", "后端"]', 2, 187, 3, 1, 0, DATE_SUB(NOW(), INTERVAL 12 DAY)),

(5, 'JWT 无状态认证如何实现退出登录？',
'JWT 是无状态的，服务端不保存会话，那用户点击退出登录时：

- 只是让前端删掉本地 token 就够了吗？
- 如果要求 token 立即失效，业界一般怎么做？
- 有没有兼顾安全与性能的折中方案？',
'["JWT", "认证"]', 1, 143, 3, 1, 0, DATE_SUB(NOW(), INTERVAL 9 DAY)),

(6, 'Tailwind CSS 和传统手写 CSS 应该如何选择？',
'新项目在纠结样式方案：

- Tailwind 的原子类在大型项目里会不会难以维护？
- 传统 CSS / CSS Modules 在什么场景更合适？
- 大家实际项目里是怎么取舍的？',
'["CSS", "前端"]', 2, 76, 2, 1, 0, DATE_SUB(NOW(), INTERVAL 7 DAY)),

(7, 'MySQL 事务的四个隔离级别分别解决什么问题？',
'复习数据库基础时对隔离级别总是记不牢：

- 四个隔离级别分别解决了脏读、不可重复读、幻读中的哪些问题？
- MySQL InnoDB 默认级别下幻读到底会不会出现？
- 实际项目中一般怎么选？',
'["MySQL", "数据库"]', 1, 210, 3, 1, 0, DATE_SUB(NOW(), INTERVAL 4 DAY)),

(8, 'Vite 开发环境为什么比 Webpack 快这么多？',
'把一个老项目从 Webpack 迁到 Vite 后，冷启动从 40 秒变成 1 秒以内，差别非常大。

想了解背后的原理：

- Vite 开发环境为什么不用全量打包？
- 依赖预构建做了什么？
- 生产环境构建为什么仍然用 Rollup？',
'["Vite", "工程化"]', 2, 165, 5, 1, 0, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- 22 条回答（votes / is_accepted 与下方点赞、采纳数据保持一致）
INSERT INTO answers (id, question_id, author_id, content, votes, is_accepted, created_at) VALUES
(1, 1, 2,
'核心优势是**逻辑关注点聚合**：选项式 API 把同一功能的代码拆散在 data、methods、computed 里，组合式 API 可以把它们组织在一起，组件越大收益越明显。

逻辑复用方面，composables 相比 mixins 有两个关键改进：

- 没有命名冲突
- 来源清晰，useMouse() 返回什么一目了然

```js
export function useMouse() {
  const x = ref(0);
  const y = ref(0);
  const update = (e) => { x.value = e.pageX; y.value = e.pageY; };
  onMounted(() => window.addEventListener("mousemove", update));
  onUnmounted(() => window.removeEventListener("mousemove", update));
  return { x, y };
}
```

常见的坑：对 reactive 对象直接解构会丢失响应性，需要用 toRefs；组合式函数里注册的生命周期要在 setup 同步调用链中执行。',
1, 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),

(2, 1, 1,
'补充一点：选项式 API 并没有过时，小项目、快速原型用它反而更顺手。组合式 API 的优势主要在**大型组件拆分**和 **TypeScript 类型推导**上，建议按项目规模选，不必一刀切。',
0, 0, DATE_SUB(NOW(), INTERVAL 18 DAY)),

(3, 2, 1,
'慢的原因很直接：LIMIT 100000, 10 需要扫描前 100010 行，然后丢弃前 100000 行，offset 越大浪费越多。

常用两种优化：

**1. 延迟关联**：先用覆盖索引拿到目标主键，再回表：

```sql
SELECT a.id, a.title
FROM articles a
JOIN (SELECT id FROM articles ORDER BY id LIMIT 100000, 10) t ON a.id = t.id;
```

**2. 游标分页**：记录上一页最后一条的 id，避免大 offset：

```sql
SELECT id, title FROM articles WHERE id > 100000 ORDER BY id LIMIT 10;
```

产品层面还可以限制最大页数，或引导用户用搜索代替深翻页。',
1, 1, DATE_SUB(NOW(), INTERVAL 17 DAY)),

(4, 2, 2,
'补充一个业务侧的思路：如果列表是给搜索用的，深分页需求往往可以转交给 Elasticsearch 这类搜索引擎，主库只服务前几页的流量，架构上更干净。',
0, 0, DATE_SUB(NOW(), INTERVAL 16 DAY)),

(5, 3, 2,
'原因：useEffect 的回调闭包捕获的是**首次渲染时**的 count，之后更新不会反映进去。

三种正确写法：

- 把依赖写全，配合 cleanup 重建定时器
- 函数式更新，不依赖外部闭包值
- 用 ref 保存最新值并在渲染时同步

```js
useEffect(() => {
  const timer = setInterval(() => setCount((c) => c + 1), 1000);
  return () => clearInterval(timer);
}, []);
```',
1, 0, DATE_SUB(NOW(), INTERVAL 14 DAY)),

(6, 3, 1,
'再安利一下 eslint-plugin-react-hooks 的 exhaustive-deps 规则，绝大多数闭包问题在写代码时就能被提示出来。',
0, 0, DATE_SUB(NOW(), INTERVAL 13 DAY)),

(7, 4, 1,
'简单记法：

- process.nextTick：当前阶段**所有同步代码和微任务之后**、事件循环进入下一阶段之前执行
- setImmediate：事件循环的 **check 阶段**执行

经典实验：

```js
setImmediate(() => console.log("immediate"));
process.nextTick(() => console.log("nextTick"));
// 输出顺序永远是 nextTick -> immediate
```

经典坑：递归调用 nextTick 会阻止事件循环进入下一阶段，IO 回调会被饿死；所以循环逻辑优先用 setImmediate。',
1, 0, DATE_SUB(NOW(), INTERVAL 11 DAY)),

(8, 4, 2,
'补充官方文档的结论：

- **nextTick** 适合在事件循环继续之前做收尾工作，例如在同一个 tick 内把回调注册后再清理临时状态
- **setImmediate** 适合把工作拆到下一次循环，避免阻塞 IO

开发者绝大多数时候应该用 setImmediate，nextTick 留给框架作者。',
0, 0, DATE_SUB(NOW(), INTERVAL 10 DAY)),

(9, 4, 1,
'一个记忆技巧：可以把 nextTick 理解为插队到当前阶段末尾的 VIP 队列，而 setImmediate 是正常排到 check 阶段的普通队列，所以 nextTick 总是先执行。',
0, 0, DATE_SUB(NOW(), INTERVAL 9 DAY)),

(10, 5, 2,
'JWT 一旦签发服务端无法单方面作废，这是设计上的取舍。常见方案按严格程度排列：

1. **前端删除 token**：成本最低，但 token 本身仍有效，适合一般站点
2. **短有效期 + refresh token**：access token 15 分钟，配合较长周期的 refresh token 轮换，泄露窗口小
3. **服务端黑名单**：登出时把 token 的 jti 写入 Redis 并设置与 token 相同的 TTL，校验时先查黑名单，这是让 token 立即失效的标准做法',
1, 0, DATE_SUB(NOW(), INTERVAL 8 DAY)),

(11, 5, 1,
'补充：黑名单方案本质上让无状态认证退化成了有状态，如果登出安全要求高，其实可以重新评估 session 方案，未必要硬撑 JWT。',
0, 0, DATE_SUB(NOW(), INTERVAL 7 DAY)),

(12, 5, 2,
'实践里比较平衡的组合是：短有效期的 access token + refresh token + 敏感操作二次校验密码。登出时同时作废 refresh token，access token 顶多再活几分钟。',
0, 0, DATE_SUB(NOW(), INTERVAL 6 DAY)),

(13, 6, 1,
'我的经验：

- **组件库 / 设计系统**：Tailwind 配合 tailwind.config 里的设计令牌很好用，团队不容易写出偏离规范的样式
- **复杂动画、复杂选择器**：原生 CSS 或 CSS Modules 更顺手
- **老项目渐进改造**：可以局部引入 Tailwind，与现有样式共存

关键是把重复的原子类抽成组件（比如 Button、Card），而不是让业务代码里堆几百个类名。',
1, 0, DATE_SUB(NOW(), INTERVAL 6 DAY)),

(14, 6, 2,
'不太同意无脑上 Tailwind。HTML 里几十个类名其实把样式问题转移成了可读性问题。我的取舍是：内部工具和快速原型用 Tailwind，面向用户、需要长期维护的页面用 CSS Modules 加设计令牌。',
0, 0, DATE_SUB(NOW(), INTERVAL 5 DAY)),

(15, 7, 2,
'一张表总结：

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
| --- | --- | --- | --- |
| 读未提交 | 可能 | 可能 | 可能 |
| 读已提交 | 避免 | 可能 | 可能 |
| 可重复读 | 避免 | 避免 | 基本避免 |
| 串行化 | 避免 | 避免 | 避免 |

InnoDB 默认是可重复读，并通过 **MVCC + 间隙锁**在相当程度上避免了幻读：快照读靠 MVCC，当前读靠 next-key lock。',
1, 0, DATE_SUB(NOW(), INTERVAL 3 DAY)),

(16, 7, 1,
'补充 next-key lock 的细节：可重复读级别下 SELECT ... FOR UPDATE 会锁住索引记录以及记录间的间隙，从而阻止其他事务在范围内插入新行；但如果查询条件没有命中索引，锁会退化为全表扫描加锁，性能很差，这是常见的生产事故来源。',
0, 0, DATE_SUB(NOW(), INTERVAL 60 HOUR)),

(17, 7, 2,
'实践建议：绝大多数互联网业务用默认的可重复读即可；对一致性要求极高的资金类操作，要么用串行化，要么在应用层加乐观锁（version 字段）或悲观锁，显式控制比依赖隔离级别更可审计。',
0, 0, DATE_SUB(NOW(), INTERVAL 36 HOUR)),

(18, 8, 1,
'核心区别是开发环境对模块的处理方式：

- **Webpack**：不管开发还是生产都要先把整个应用打包成 bundle，项目越大启动越慢
- **Vite**：开发环境直接基于浏览器原生 ESM，按需编译，打开页面时才编译用到的模块，所以启动几乎不花时间

依赖预构建：第三方依赖大多是 CommonJS，Vite 启动时用 esbuild 把它们转成 ESM 并合并请求，esbuild 用 Go 写的，比 JS 工具快一个数量级。

生产环境仍然用 Rollup，是因为浏览器原生 ESM 在生产环境会有大量网络请求和兼容性问题，打包 + tree-shaking 才是最优解。',
1, 0, DATE_SUB(NOW(), INTERVAL 40 HOUR)),

(19, 8, 2,
'补充一组参考数据：我们项目 1200 个模块左右，Webpack 冷启动约 50 秒、热更新 2 到 3 秒；Vite 冷启动 1 秒出头、热更新基本无感。迁移成本主要在环境变量和一些 Webpack 专有配置上。',
0, 0, DATE_SUB(NOW(), INTERVAL 30 HOUR)),

(20, 8, 1,
'迁移时注意 commonjs 依赖和 CSS 里的 url 引用，esbuild 预构建偶尔会有需要手动 exclude 的包，其余基本无痛。',
0, 0, DATE_SUB(NOW(), INTERVAL 20 HOUR)),

(21, 8, 2,
'追问一下：按需编译在多页面、路由很多的场景下，第一次进入某个页面会不会有明显等待？有没有做过 code splitting 的最佳实践？',
0, 0, DATE_SUB(NOW(), INTERVAL 10 HOUR)),

(22, 8, 1,
'会有一点点编译等待，但都在百毫秒级。实践上：路由级动态 import 做懒加载，把首屏用不到的重型依赖（图表库、编辑器）也放在异步 chunk 里，开发体验和生产体积都能兼顾。',
0, 0, DATE_SUB(NOW(), INTERVAL 5 HOUR));

-- 16 条点赞记录（8 个问题各 1 条 + 8 条回答各 1 条）
INSERT INTO votes (id, user_id, target_type, target_id, created_at) VALUES
(1, 2, 'question', 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),
(2, 1, 'question', 2, DATE_SUB(NOW(), INTERVAL 17 DAY)),
(3, 2, 'question', 3, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(4, 1, 'question', 4, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(5, 2, 'question', 5, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(6, 1, 'question', 6, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(7, 2, 'question', 7, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 1, 'question', 8, DATE_SUB(NOW(), INTERVAL 40 HOUR)),
(9, 1, 'answer', 1, DATE_SUB(NOW(), INTERVAL 19 DAY)),
(10, 2, 'answer', 3, DATE_SUB(NOW(), INTERVAL 17 DAY)),
(11, 1, 'answer', 5, DATE_SUB(NOW(), INTERVAL 14 DAY)),
(12, 2, 'answer', 7, DATE_SUB(NOW(), INTERVAL 11 DAY)),
(13, 1, 'answer', 10, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(14, 2, 'answer', 13, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(15, 1, 'answer', 15, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(16, 2, 'answer', 18, DATE_SUB(NOW(), INTERVAL 40 HOUR));
