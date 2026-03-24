import { sql } from "@/lib/db";
import type { Stage } from "@/lib/types";

export async function listStages(): Promise<Stage[]> {
  const { rows } = await sql`
    SELECT * FROM stages ORDER BY sort_order ASC
  `;
  return rows as Stage[];
}

export async function createStage(data: {
  name: string;
  slug: string;
  sort_order: number;
  color: string;
}): Promise<Stage> {
  const { rows } = await sql`
    INSERT INTO stages (name, slug, sort_order, color, is_default)
    VALUES (${data.name}, ${data.slug}, ${data.sort_order}, ${data.color}, false)
    RETURNING *
  `;
  return rows[0] as Stage;
}

export async function updateStage(
  id: number,
  data: { name?: string; sort_order?: number; color?: string }
): Promise<Stage> {
  const { rows } = await sql`
    UPDATE stages
    SET
      name = COALESCE(${data.name ?? null}, name),
      sort_order = COALESCE(${data.sort_order ?? null}, sort_order),
      color = COALESCE(${data.color ?? null}, color)
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Stage;
}

export async function deleteStage(id: number): Promise<void> {
  // Check if stage has any projects or tasks
  const { rows: projects } = await sql`
    SELECT COUNT(*) as count FROM projects WHERE current_stage_id = ${id}
  `;
  const { rows: tasks } = await sql`
    SELECT COUNT(*) as count FROM tasks WHERE stage_id = ${id}
  `;

  if (Number(projects[0].count) > 0 || Number(tasks[0].count) > 0) {
    throw new Error(
      "Cannot delete stage with assigned projects or tasks"
    );
  }

  await sql`DELETE FROM stages WHERE id = ${id} AND is_default = false`;
}
