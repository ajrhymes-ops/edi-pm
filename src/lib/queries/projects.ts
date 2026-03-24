import { sql } from "@/lib/db";
import type { Project } from "@/lib/types";

function serializeProject(row: Record<string, unknown>): Project {
  return {
    ...row,
    parent_id: row.parent_id ?? null,
    start_date: row.start_date ? new Date(row.start_date as string).toISOString().split("T")[0] : null,
    target_date: row.target_date ? new Date(row.target_date as string).toISOString().split("T")[0] : null,
    completed_at: row.completed_at ? new Date(row.completed_at as string).toISOString() : null,
    created_at: new Date(row.created_at as string).toISOString(),
    updated_at: new Date(row.updated_at as string).toISOString(),
  } as Project;
}

export async function listProjects(parentId?: number | null): Promise<Project[]> {
  if (parentId !== undefined) {
    // List sub-projects of a specific parent
    const { rows } = await sql`
      SELECT p.*,
        s.name as stage_name,
        s.color as stage_color,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count,
        parent.name as parent_name,
        (SELECT COUNT(*) FROM projects sub WHERE sub.parent_id = p.id) as sub_project_count
      FROM projects p
      LEFT JOIN stages s ON p.current_stage_id = s.id
      LEFT JOIN projects parent ON p.parent_id = parent.id
      WHERE p.parent_id = ${parentId}
      ORDER BY
        CASE p.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        p.updated_at DESC
    `;
    return rows.map(serializeProject);
  }

  // List top-level projects (no parent)
  const { rows } = await sql`
    SELECT p.*,
      s.name as stage_name,
      s.color as stage_color,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count,
      (SELECT COUNT(*) FROM projects sub WHERE sub.parent_id = p.id) as sub_project_count
    FROM projects p
    LEFT JOIN stages s ON p.current_stage_id = s.id
    WHERE p.parent_id IS NULL
    ORDER BY
      CASE p.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      p.updated_at DESC
  `;
  return rows.map(serializeProject);
}

export async function getProject(id: number): Promise<Project | null> {
  const { rows } = await sql`
    SELECT p.*,
      s.name as stage_name,
      s.color as stage_color,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count,
      parent.name as parent_name,
      (SELECT COUNT(*) FROM projects sub WHERE sub.parent_id = p.id) as sub_project_count
    FROM projects p
    LEFT JOIN stages s ON p.current_stage_id = s.id
    LEFT JOIN projects parent ON p.parent_id = parent.id
    WHERE p.id = ${id}
  `;
  return rows[0] ? serializeProject(rows[0]) : null;
}

export async function listSubProjects(parentId: number): Promise<Project[]> {
  return listProjects(parentId);
}

export async function listAllProjects(): Promise<Project[]> {
  const { rows } = await sql`
    SELECT p.*,
      s.name as stage_name,
      s.color as stage_color,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'done') as completed_task_count,
      parent.name as parent_name,
      (SELECT COUNT(*) FROM projects sub WHERE sub.parent_id = p.id) as sub_project_count
    FROM projects p
    LEFT JOIN stages s ON p.current_stage_id = s.id
    LEFT JOIN projects parent ON p.parent_id = parent.id
    ORDER BY
      CASE p.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      p.updated_at DESC
  `;
  return rows.map(serializeProject);
}

export async function createProject(data: {
  name: string;
  description?: string;
  client_name?: string;
  project_type: string;
  current_stage_id: number;
  parent_id?: number | null;
  start_date?: string;
  target_date?: string;
  priority: string;
  health_status?: string;
}): Promise<Project> {
  const { rows } = await sql`
    INSERT INTO projects (name, description, client_name, project_type, current_stage_id, parent_id, start_date, target_date, priority, health_status)
    VALUES (
      ${data.name},
      ${data.description ?? null},
      ${data.client_name ?? null},
      ${data.project_type},
      ${data.current_stage_id},
      ${data.parent_id ?? null},
      ${data.start_date ?? null},
      ${data.target_date ?? null},
      ${data.priority},
      ${data.health_status ?? "on_track"}
    )
    RETURNING *
  `;
  return rows[0] as Project;
}

export async function updateProject(
  id: number,
  data: Partial<{
    name: string;
    description: string;
    client_name: string;
    project_type: string;
    current_stage_id: number;
    start_date: string;
    target_date: string;
    priority: string;
    health_status: string;
    completed_at: string;
  }>
): Promise<Project> {
  const { rows } = await sql`
    UPDATE projects
    SET
      name = COALESCE(${data.name ?? null}, name),
      description = COALESCE(${data.description ?? null}, description),
      client_name = COALESCE(${data.client_name ?? null}, client_name),
      project_type = COALESCE(${data.project_type ?? null}, project_type),
      current_stage_id = COALESCE(${data.current_stage_id ?? null}, current_stage_id),
      start_date = COALESCE(${data.start_date ?? null}, start_date),
      target_date = COALESCE(${data.target_date ?? null}, target_date),
      priority = COALESCE(${data.priority ?? null}, priority),
      health_status = COALESCE(${data.health_status ?? null}, health_status),
      completed_at = COALESCE(${data.completed_at ?? null}, completed_at),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Project;
}

export async function deleteProject(id: number): Promise<void> {
  await sql`DELETE FROM projects WHERE id = ${id}`;
}
