import { useState } from "react";
import client, { getErrorMessage } from "../api/client";

interface VoteButtonProps {
  targetType: "question" | "answer";
  targetId: number;
  votes: number;
  liked: boolean;
  onVoted: (voted: boolean, votes: number) => void;
}

export default function VoteButton({
  targetType,
  targetId,
  votes,
  liked,
  onVoted
}: VoteButtonProps) {
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await client.post<{ voted: boolean; votes: number }>("/votes/toggle", {
        target_type: targetType,
        target_id: targetId
      });
      onVoted(res.data.voted, res.data.votes);
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        "flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border transition-colors " +
        (liked
          ? "bg-red-50 border-red-300 text-red-500 hover:bg-red-100"
          : "bg-white border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-500")
      }
      title={liked ? "取消点赞" : "点赞"}
    >
      <span>&#9650;</span>
      <span>{votes}</span>
      <span className="hidden sm:inline">{liked ? "已点赞" : "点赞"}</span>
    </button>
  );
}
