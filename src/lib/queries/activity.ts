import { sql } from "@/lib/db";
import type { ActivityAction, ActivityEntry } from "@/lib/types";

export async function listActivityByProject(
  projectId: number
): Promise<ActivityEntry[]> {
  const { rows } = await sql`
    SELECT * FROM activity_log
    WHERE project_id = ${projectId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows as ActivityEntry[];
}

export async function logActivity(data: {
  project_id: number;
  task_id?: number;
  action: ActivityAction;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await sql`
    INSERT INTO activity_log (project_id, task_id, action, detail)
    VALUES (
      ${data.project_id},
      ${data.task_id ?? null},
      ${data.action},
      ${JSON.stringify(data.detail ?? {})}
    )
  `;
}
