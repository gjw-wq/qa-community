import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { UserProfileResponse } from "../types";
import { formatDate } from "../utils";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      setError("参数不合法");
      return;
    }
    client
      .get<UserProfileResponse>(`/users/${userId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) {
    return <div className="bg-white rounded-lg p-8 text-center text-red-500">{error}</div>;
  }
  if (!data) {
    return <div className="py-20 text-center text-gray-500">加载中...</div>;
  }

  const { user, stats } = data;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
          <p className="text-sm text-gray-400 mt-1">加入于 {formatDate(user.created_at)}</p>
        </div>
        <div className="ml-auto text-center bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          <div className="text-xl font-bold text-amber-600">{user.points}</div>
          <div className="text-xs text-amber-600">积分</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.question_count}</div>
          <div className="text-sm text-gray-400 mt-1">提问数</div>
        </div>
        <div className="bg-white rounded-lg p-5 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.answer_count}</div>
          <div className="text-sm text-gray-400 mt-1">回答数</div>
        </div>
        <div className="bg-white rounded-lg p-5 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.accepted_count}</div>
          <div className="text-sm text-gray-400 mt-1">被采纳</div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          返回问题列表
        </Link>
      </div>
    </div>
  );
}
