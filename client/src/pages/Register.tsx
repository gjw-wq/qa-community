import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { User } from "../types";

interface RegisterResponse {
  token: string;
  user: User;
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!username.trim() || !email.trim() || !password) {
      setError("请填写完整的注册信息");
      return;
    }
    if (username.trim().length < 3 || username.trim().length > 20) {
      setError("用户名需为 3-20 个字符");
      return;
    }
    if (password.length < 6) {
      setError("密码至少 6 位");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await client.post<RegisterResponse>("/auth/register", {
        username: username.trim(),
        email: email.trim(),
        password
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-8 mt-6">
      <h1 className="text-xl font-bold text-gray-900">注册</h1>
      <p className="mt-1 text-xs text-gray-400">新用户注册赠送 20 积分</p>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            placeholder="3-20 个字符"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="用于找回账号，不对外展示"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "注册中..." : "注册"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        已有账号？
        <Link to="/login" className="text-blue-600 hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
