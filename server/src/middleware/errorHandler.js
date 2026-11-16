class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ message: "接口不存在" });
}

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "请求数据格式不正确" });
  }
  console.error(err);
  res.status(500).json({ message: "服务器内部错误" });
}

module.exports = { HttpError, notFound, errorHandler };
