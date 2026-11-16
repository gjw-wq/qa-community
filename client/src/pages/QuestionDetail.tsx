import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Markdown from "../components/Markdown";
import VoteButton from "../components/VoteButton";
import { Answer, Question } from "../types";
import { formatDate } from "../utils";

interface DetailResponse {
  question: Question;
  answers: Answer[];
}

export default function QuestionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    const questionId = Number(id);
    if (!Number.isInteger(questionId) || questionId <= 0) {
      setError("参数不合法");
      return;
    }
    client
      .get<DetailResponse>(`/questions/${questionId}`)
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  if (error && !data) {
    return <div className="bg-white rounded-lg p-8 text-center text-red-500">{error}</div>;
  }
  if (!data) {
    return <div className="py-20 text-center text-gray-500">加载中...</div>;
  }

  const { question, answers } = data;
  const isQuestionAuthor = !!user && user.id === question.author.id;

  const onQuestionVoted = (voted: boolean, votes: number) => {
    setData({ ...data, question: { ...question, votes, is_liked: voted } });
  };

  const onAnswerVoted = (answerId: number, voted: boolean, votes: number) => {
    setData({
      ...data,
      answers: answers.map((item) =>
        item.id === answerId ? { ...item, votes, is_liked: voted } : item
      )
    });
  };

  const acceptAnswer = async (answerId: number) => {
    try {
      await client.put(`/answers/${answerId}/accept`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const submitAnswer = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await client.post(`/questions/${id}/answers`, { content });
      setContent("");
      setPreview(false);
      load();
      refreshUser();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
          {question.is_solved && (
            <span className="shrink-0 bg-green-100 text-green-700 text-sm px-2.5 py-1 rounded">
              已解决
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span>
            提问者{" "}
            <Link to={`/user/${question.author.id}`} className="text-blue-600 hover:underline">
              {question.author.username}
            </Link>
          </span>
          <span>发布于 {formatDate(question.created_at)}</span>
          <span>{question.views} 浏览</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {question.tags.map((name) => (
            <span key={name} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
              {name}
            </span>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          {question.content && <Markdown content={question.content} />}
        </div>
        <div className="mt-4">
          <VoteButton
            targetType="question"
            targetId={question.id}
            votes={question.votes}
            liked={question.is_liked}
            onVoted={onQuestionVoted}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {answers.length} 个回答
          {question.is_solved && (
            <span className="ml-2 text-sm font-normal text-green-600">
              已有采纳答案
            </span>
          )}
        </h2>
        <div className="mt-4 space-y-4">
          {answers.length === 0 && (
            <p className="text-sm text-gray-400">还没有回答，来抢第一个回答吧</p>
          )}
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <Link
                    to={`/user/${answer.author.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {answer.author.username}
                  </Link>
                  <span>{formatDate(answer.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {answer.is_accepted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      已采纳
                    </span>
                  )}
                  {isQuestionAuthor && !answer.is_accepted && (
                    <button
                      type="button"
                      onClick={() => acceptAnswer(answer.id)}
                      className="text-xs border border-green-500 text-green-600 px-2.5 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      采纳
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Markdown content={answer.content} />
              </div>
              <div className="mt-3">
                <VoteButton
                  targetType="answer"
                  targetId={answer.id}
                  votes={answer.votes}
                  liked={answer.is_liked}
                  onVoted={(voted, votes) => onAnswerVoted(answer.id, voted, votes)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900">写回答</h2>
        {user ? (
          <div className="mt-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setPreview(false)}
                className={
                  "px-3 py-1 rounded-md text-sm " +
                  (!preview ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")
                }
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setPreview(true)}
                className={
                  "px-3 py-1 rounded-md text-sm " +
                  (preview ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")
                }
              >
                预览
              </button>
            </div>
            {preview ? (
              <div className="min-h-[160px] border border-gray-200 rounded-md p-4">
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
                placeholder="支持 Markdown 语法，回答问题将获得 10 积分"
                rows={8}
                className="w-full border border-gray-200 rounded-md p-3 text-sm focus:outline-none focus:border-blue-500"
              />
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={submitAnswer}
                disabled={submitting}
                className="bg-blue-600 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "发布中..." : "发布回答"}
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:underline">
              登录
            </Link>{" "}
            后即可回答问题
          </p>
        )}
      </div>
    </div>
  );
}
