import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { Question, TagStat } from "../types";
import { formatDate } from "../utils";

const SORTS = [
  { key: "latest", label: "最新" },
  { key: "hot", label: "热门" },
  { key: "unsolved", label: "未解决" }
];

const PAGE_SIZE = 10;

interface QuestionsResponse {
  list: Question[];
  total: number;
  page: number;
  pageSize: number;
}

export default function Home() {
  const [sort, setSort] = useState("latest");
  const [tag, setTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [hotTags, setHotTags] = useState<TagStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params: Record<string, string | number> = { page, pageSize: PAGE_SIZE, sort };
    if (tag) {
      params.tag = tag;
    }
    client
      .get<QuestionsResponse>("/questions", { params })
      .then((res) => {
        if (active) {
          setList(res.data.list);
          setTotal(res.data.total);
        }
      })
      .catch(() => {
        if (active) setError("加载问题列表失败");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sort, tag, page]);

  useEffect(() => {
    client
      .get<{ list: TagStat[] }>("/questions/tags/hot")
      .then((res) => setHotTags(res.data.list))
      .catch(() => undefined);
  }, []);

  const changeSort = (key: string) => {
    setSort(key);
    setPage(1);
  };

  const toggleTag = (name: string) => {
    setTag((prev) => (prev === name ? null : name));
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-white rounded-lg p-1">
            {SORTS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => changeSort(item.key)}
                className={
                  "px-4 py-1.5 rounded-md text-sm transition-colors " +
                  (sort === item.key
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          {tag && (
            <button
              type="button"
              onClick={() => toggleTag(tag)}
              className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100"
            >
              标签：{tag} &times;
            </button>
          )}
        </div>

        {loading && <div className="py-16 text-center text-gray-500">加载中...</div>}
        {error && <div className="mt-4 py-16 text-center text-red-500">{error}</div>}
        {!loading && !error && (
          <>
            <div className="mt-4 space-y-3">
              {list.length === 0 && (
                <div className="bg-white rounded-lg py-16 text-center text-gray-500">
                  暂无问题
                </div>
              )}
              {list.map((question) => (
                <div
                  key={question.id}
                  className="bg-white rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link
                      to={`/question/${question.id}`}
                      className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                    >
                      {question.title}
                    </Link>
                    {question.is_solved && (
                      <span className="shrink-0 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                        已解决
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{question.excerpt}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.tags.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleTag(name)}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
                    <span>
                      {question.answers_count} 回答 · {question.votes} 点赞 · {question.views} 浏览
                    </span>
                    <span>
                      提问者{" "}
                      <Link
                        to={`/user/${question.author.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {question.author.username}
                      </Link>{" "}
                      · {formatDate(question.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="bg-white border border-gray-200 rounded-md px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                第 {page} / {totalPages} 页 · 共 {total} 个问题
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="bg-white border border-gray-200 rounded-md px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </>
        )}
      </div>

      <aside className="w-64 shrink-0 hidden md:block space-y-6">
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">热门标签</h3>
          <div className="flex flex-wrap gap-2">
            {hotTags.length === 0 && <span className="text-sm text-gray-400">暂无标签</span>}
            {hotTags.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleTag(item.name)}
                className={
                  "text-xs px-2 py-1 rounded transition-colors " +
                  (tag === item.name
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600")
                }
              >
                {item.name} · {item.count}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 text-sm text-gray-500 leading-6">
          <h3 className="font-semibold text-gray-900 mb-2">积分规则</h3>
          <p>发布问题 -5 · 发布回答 +10</p>
          <p>回答被采纳 +30 · 问题被赞 +5</p>
          <p>回答被赞 +10 · 注册赠送 20</p>
        </div>
      </aside>
    </div>
  );
}
