import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { User } from "../types";

interface LoginResponse {
  token: string;
  user: User;
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!username.trim() || !password) {
      setError("请输入用户名和密码");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await client.post<LoginResponse>("/auth/login", {
        username: username.trim(),
        password
      });
      login(res.data.token, res.data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg p-8 mt-6">
      <h1 className="text-xl font-bold text-gray-900">登录</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? "登录中..." : "登录"}
        </button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        还没有账号？
        <Link to="/register" className="text-blue-600 hover:underline">
          注册
        </Link>
      </p>
      <p className="mt-2 text-xs text-gray-400">演示账号：demo / 123456、alice / 123456</p>
    </div>
  );
}
