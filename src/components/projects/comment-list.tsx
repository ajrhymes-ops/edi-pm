"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import type { Comment } from "@/lib/types";
import { MessageSquare } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CommentList({ projectId }: { projectId: number }) {
  const { data: comments, mutate } = useSWR<Comment[]>(
    `/api/projects/${projectId}/comments`,
    fetcher
  );
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setPosting(true);
    try {
      await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setContent("");
      mutate();
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
        />
        <Button type="submit" size="sm" disabled={posting}>
          {posting ? "Posting..." : "Add Comment"}
        </Button>
      </form>

      <div className="space-y-3">
        {comments?.map((comment) => (
          <div key={comment.id} className="rounded-md border p-3">
            <p className="text-sm">{comment.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        ))}
      </div>

      {comments?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
        </div>
      )}
    </div>
  );
}
