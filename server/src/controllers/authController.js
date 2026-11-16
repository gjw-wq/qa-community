const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userModel = require("../models/userModel");
const { HttpError } = require("../middleware/errorHandler");

const WELCOME_POINTS = 20;

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function validateUsername(username) {
  return typeof username === "string" && username.trim().length >= 3 && username.trim().length <= 20;
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 6 && password.length <= 64;
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function register(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim();
    const password = req.body.password;

    if (!validateUsername(username)) {
      throw new HttpError(400, "用户名需为 3-20 个字符");
    }
    if (!validateEmail(email)) {
      throw new HttpError(400, "邮箱格式不正确");
    }
    if (!validatePassword(password)) {
      throw new HttpError(400, "密码至少 6 位");
    }
    if (await userModel.findByUsername(username)) {
      throw new HttpError(409, "用户名已存在");
    }
    if (await userModel.findByEmail(email)) {
      throw new HttpError(409, "邮箱已被注册");
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = await userModel.createUser({
      username,
      email,
      passwordHash,
      points: WELCOME_POINTS
    });
    const user = await userModel.findById(userId);
    res.status(201).json({
      message: "注册成功，赠送 " + WELCOME_POINTS + " 积分",
      token: signToken(user),
      user: userModel.toPublic(user)
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const username = String(req.body.username || "").trim();
    const password = req.body.password;
    if (!username || !password) {
      throw new HttpError(400, "请输入用户名和密码");
    }
    const user = await userModel.findByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new HttpError(400, "用户名或密码错误");
    }
    res.json({
      message: "登录成功",
      token: signToken(user),
      user: userModel.toPublic(user)
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      throw new HttpError(401, "用户不存在或已被删除");
    }
    res.json({ user: userModel.toPublic(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
