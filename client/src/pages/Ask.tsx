import { useState } from "react";
import { useNavigate } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Markdown from "../components/Markdown";

export default function Ask() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 100) {
      setError("标题长度需在 2 到 100 个字符之间");
      return;
    }
    if (!content.trim()) {
      setError("问题内容不能为空");
      return;
    }
    const tags = tagsInput
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (tags.length > 5) {
      setError("标签数量不能超过 5 个");
      return;
    }
    setSubmitting(true);
    try {
      const res = await client.post<{ data: { id: number } }>("/questions", {
        title: trimmedTitle,
        content,
        tags
      });
      refreshUser();
      navigate(`/question/${res.data.data.id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-lg p-6">
        <h1 className="text-xl font-bold text-gray-900">提问</h1>
        <p className="mt-1 text-xs text-gray-400">
          发布问题将消耗 5 积分，当前积分 {user ? user.points : 0}，回答被采纳可获得 30 积分
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-md px-4 py-2">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="一句话说清你的问题，2-100 个字符"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            标签<span className="text-gray-400 font-normal">（用逗号分隔，最多 5 个）</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="例如：React, 前端"
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">问题详情</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={
                  "px-3 py-1 rounded-md text-xs " +
                  (!preview ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")
                }
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={
                  "px-3 py-1 rounded-md text-xs " +
                  (preview ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")
                }
              >
                预览
              </button>
            </div>
          </div>
          {preview ? (
            <div className="min-h-[240px] border border-gray-200 rounded-md p-4">
              {content.trim() ? (
                <Markdown content={content} />
              ) : (
                <p className="text-sm text-gray-400">暂无内容可预览</p>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              placeholder="支持 Markdown 语法，尽量把背景、代码、期望结果写清楚"
              className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "发布中..." : "发布问题"}
        </button>
      </div>
    </div>
  );
}
