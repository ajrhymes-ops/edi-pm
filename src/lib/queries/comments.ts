import { sql } from "@/lib/db";
import type { Comment } from "@/lib/types";

export async function listCommentsByProject(
  projectId: number
): Promise<Comment[]> {
  const { rows } = await sql`
    SELECT * FROM comments
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
  `;
  return rows as Comment[];
}

export async function createComment(data: {
  project_id: number;
  task_id?: number;
  content: string;
}): Promise<Comment> {
  const { rows } = await sql`
    INSERT INTO comments (project_id, task_id, content)
    VALUES (${data.project_id}, ${data.task_id ?? null}, ${data.content})
    RETURNING *
  `;
  return rows[0] as Comment;
}

export async function deleteComment(id: number): Promise<void> {
  await sql`DELETE FROM comments WHERE id = ${id}`;
}
