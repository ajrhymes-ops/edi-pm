export interface Stage {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  color: string;
  is_default: boolean;
  created_at: string;
}

export type ProjectType = "onboarding" | "integration" | "custom";
export type Priority = "low" | "medium" | "high" | "urgent";
export type HealthStatus = "on_track" | "at_risk" | "blocked";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  client_name: string | null;
  project_type: ProjectType;
  current_stage_id: number;
  parent_id: number | null;
  start_date: string | null;
  target_date: string | null;
  priority: Priority;
  health_status: HealthStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  stage_name?: string;
  stage_color?: string;
  task_count?: number;
  completed_task_count?: number;
  parent_name?: string;
  sub_project_count?: number;
}

export interface Task {
  id: number;
  project_id: number;
  stage_id: number;
  title: string;
  description: string | null;
  assignee: string | null;
  due_date: string | null;
  status: TaskStatus;
  sort_order: number;
  depends_on: number[];
  created_at: string;
  updated_at: string;
  // Joined fields
  stage_name?: string;
  stage_color?: string;
}

export interface Comment {
  id: number;
  project_id: number;
  task_id: number | null;
  content: string;
  created_at: string;
}

export type ActivityAction =
  | "project_created"
  | "project_updated"
  | "project_deleted"
  | "stage_changed"
  | "task_created"
  | "task_updated"
  | "task_completed"
  | "task_deleted"
  | "comment_added";

export interface ActivityEntry {
  id: number;
  project_id: number;
  task_id: number | null;
  action: ActivityAction;
  detail: Record<string, unknown>;
  created_at: string;
}
