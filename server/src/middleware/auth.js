const jwt = require("jsonwebtoken");

function requiredAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "请先登录" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch (err) {
    return res.status(401).json({ message: "登录已过期，请重新登录" });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      req.user = { id: payload.id, username: payload.username };
    } catch (err) {
      // token 无效时按未登录处理，公开接口仍可访问
    }
  }
  next();
}

module.exports = { requiredAuth, optionalAuth };
