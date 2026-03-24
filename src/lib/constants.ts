import type { HealthStatus, Priority, ProjectType } from "./types";

export const DEFAULT_STAGES = [
  { name: "Discovery", slug: "discovery", sort_order: 1, color: "#6366f1" },
  { name: "Setup", slug: "setup", sort_order: 2, color: "#f59e0b" },
  { name: "Testing", slug: "testing", sort_order: 3, color: "#3b82f6" },
  { name: "Go-Live", slug: "go-live", sort_order: 4, color: "#10b981" },
  { name: "Complete", slug: "complete", sort_order: 5, color: "#6b7280" },
] as const;

export const HEALTH_STATUS_CONFIG: Record<
  HealthStatus,
  { label: string; color: string; bgColor: string }
> = {
  on_track: { label: "On Track", color: "#10b981", bgColor: "#d1fae5" },
  at_risk: { label: "At Risk", color: "#f59e0b", bgColor: "#fef3c7" },
  blocked: { label: "Blocked", color: "#ef4444", bgColor: "#fee2e2" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: "Low", color: "#6b7280", bgColor: "#f3f4f6" },
  medium: { label: "Medium", color: "#3b82f6", bgColor: "#dbeafe" },
  high: { label: "High", color: "#f59e0b", bgColor: "#fef3c7" },
  urgent: { label: "Urgent", color: "#ef4444", bgColor: "#fee2e2" },
};

export const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { label: string; color: string; bgColor: string }
> = {
  onboarding: {
    label: "Onboarding",
    color: "#6366f1",
    bgColor: "#e0e7ff",
  },
  integration: {
    label: "Integration",
    color: "#3b82f6",
    bgColor: "#dbeafe",
  },
  custom: { label: "Custom", color: "#8b5cf6", bgColor: "#ede9fe" },
};

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  project_created: "Project created",
  project_updated: "Project updated",
  project_deleted: "Project deleted",
  stage_changed: "Stage changed",
  task_created: "Task created",
  task_updated: "Task updated",
  task_completed: "Task completed",
  task_deleted: "Task deleted",
  comment_added: "Comment added",
};
