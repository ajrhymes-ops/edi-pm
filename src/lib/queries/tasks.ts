import { sql } from "@/lib/db";
import type { Task } from "@/lib/types";

export async function listTasksByProject(projectId: number): Promise<Task[]> {
  const { rows } = await sql`
    SELECT t.*,
      s.name as stage_name,
      s.color as stage_color
    FROM tasks t
    LEFT JOIN stages s ON t.stage_id = s.id
    WHERE t.project_id = ${projectId}
    ORDER BY s.sort_order ASC, t.sort_order ASC
  `;
  return rows as Task[];
}

export async function listTasksByStage(stageId: number): Promise<Task[]> {
  const { rows } = await sql`
    SELECT t.*,
      s.name as stage_name,
      s.color as stage_color
    FROM tasks t
    LEFT JOIN stages s ON t.stage_id = s.id
    WHERE t.stage_id = ${stageId}
    ORDER BY t.sort_order ASC
  `;
  return rows as Task[];
}

export async function getTask(id: number): Promise<Task | null> {
  const { rows } = await sql`
    SELECT t.*,
      s.name as stage_name,
      s.color as stage_color
    FROM tasks t
    LEFT JOIN stages s ON t.stage_id = s.id
    WHERE t.id = ${id}
  `;
  return (rows[0] as Task) || null;
}

export async function createTask(data: {
  project_id: number;
  stage_id: number;
  title: string;
  description?: string;
  assignee?: string;
  due_date?: string;
  status?: string;
}): Promise<Task> {
  // Get the next sort order for this stage
  const { rows: maxOrder } = await sql`
    SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
    FROM tasks WHERE project_id = ${data.project_id} AND stage_id = ${data.stage_id}
  `;

  const { rows } = await sql`
    INSERT INTO tasks (project_id, stage_id, title, description, assignee, due_date, status, sort_order)
    VALUES (
      ${data.project_id},
      ${data.stage_id},
      ${data.title},
      ${data.description ?? null},
      ${data.assignee ?? null},
      ${data.due_date ?? null},
      ${data.status ?? "todo"},
      ${maxOrder[0].next_order}
    )
    RETURNING *
  `;
  return rows[0] as Task;
}

export async function updateTask(
  id: number,
  data: Partial<{
    stage_id: number;
    title: string;
    description: string;
    assignee: string;
    due_date: string;
    status: string;
    sort_order: number;
  }>
): Promise<Task> {
  const { rows } = await sql`
    UPDATE tasks
    SET
      stage_id = COALESCE(${data.stage_id ?? null}, stage_id),
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      assignee = COALESCE(${data.assignee ?? null}, assignee),
      due_date = COALESCE(${data.due_date ?? null}, due_date),
      status = COALESCE(${data.status ?? null}, status),
      sort_order = COALESCE(${data.sort_order ?? null}, sort_order),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Task;
}

export async function deleteTask(id: number): Promise<void> {
  await sql`DELETE FROM tasks WHERE id = ${id}`;
}

export async function batchUpdateTasks(
  updates: { id: number; stage_id: number; sort_order: number }[]
): Promise<void> {
  for (const update of updates) {
    await sql`
      UPDATE tasks
      SET stage_id = ${update.stage_id}, sort_order = ${update.sort_order}, updated_at = NOW()
      WHERE id = ${update.id}
    `;
  }
}
