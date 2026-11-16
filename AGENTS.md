# 问答社区 AI 开发指令（AGENTS.md）

## 项目概述

问答社区全栈项目：React + TypeScript + Vite 前端，Express + MySQL 后端，JWT 认证，积分激励（提问 -5 / 回答 +10 / 被采纳 +30 / 被点赞 +5 或 +10）。

## 开发环境

- 操作系统：Windows 10，终端使用 Git Bash 或 PowerShell，命令需 Windows 兼容
- Node.js 18+、MySQL 8.0+（utf8mb4）
- 后端端口 3001，前端 Vite 端口 5173，前端通过 proxy 将 /api 转发到后端

## 开发规范

- 后端：CommonJS（require），Express 4，mysql2 promise 池；路由 -> 控制器 -> 模型分层
- 前端：函数式组件 + Hooks，TypeScript 严格模式，禁止 any；样式统一 Tailwind CSS
- 代码与配置文件一律使用 ASCII 直引号，不使用中文标点写在代码里
- 所有面向用户的文案（界面、错误提示）使用中文
- 不留 TODO、FIXME 注释，不写占位代码

## 事务与一致性要求（最高优先级）

- 提问扣积分、回答加积分、采纳、点赞切换必须放在数据库事务中
- 点赞：votes 表唯一索引 (user_id, target_type, target_id) 防重复；目标 votes 计数与 votes 表记录必须同事务更新
- 采纳：先把旧采纳回答 is_accepted 置 0，再置新回答为 1，并把问题 is_solved 置 1、给被采纳者 +30 积分，同一事务完成
- 权限：采纳仅限提问者；写操作一律 requiredAuth

## 代码风格

- 组件名 PascalCase，函数名 camelCase，常量 UPPER_SNAKE_CASE
- 接口错误统一返回 JSON `{ "message": "中文错误信息" }`，配合 HttpError(status, message)
- 列表接口必须返回 is_liked（当前用户是否已点赞）
- SQL 与数据访问只写在 models 层，控制器负责参数校验与编排

## 测试要求

- 每个功能完成后用演示账号 demo/123456、alice/123456 手动验证
- 重点验证：重复点赞不重复计数、每题只有一个采纳、非提问者无法采纳、积分变化正确

## 注意事项

- 保持代码简洁，避免过度设计；优先实现核心业务
- 移动端基础适配（响应式布局）
- 离线交付：只写源码，不执行 npm install 或连接数据库
