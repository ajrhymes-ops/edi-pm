import type { HealthStatus, Priority, ProjectType } from "./types";

export const DEFAULT_STAGES = [
  { name: "Discovery", slug: "discovery", sort_order: 1, color: "#6366f1" },
  { name: "Setup", slug: "setup", sort_order: 2, color: "#f59e0b" },
  { name: "Testing", slug: "testing", sort_order: 3, color: "#0891b2" },
  { name: "Go-Live", slug: "go-live", sort_order: 4, color: "#10b981" },
  { name: "Complete", slug: "complete", sort_order: 5, color: "#64748b" },
] as const;

export const HEALTH_STATUS_CONFIG: Record<
  HealthStatus,
  { label: string; color: string; bgColor: string; darkBgColor: string }
> = {
  on_track: { label: "On Track", color: "#10b981", bgColor: "#d1fae5", darkBgColor: "rgba(16,185,129,0.15)" },
  at_risk: { label: "At Risk", color: "#f59e0b", bgColor: "#fef3c7", darkBgColor: "rgba(245,158,11,0.15)" },
  blocked: { label: "Blocked", color: "#ef4444", bgColor: "#fee2e2", darkBgColor: "rgba(239,68,68,0.15)" },
};

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bgColor: string; darkBgColor: string }
> = {
  low: { label: "Low", color: "#64748b", bgColor: "#f1f5f9", darkBgColor: "rgba(100,116,139,0.15)" },
  medium: { label: "Medium", color: "#0891b2", bgColor: "#cffafe", darkBgColor: "rgba(8,145,178,0.15)" },
  high: { label: "High", color: "#f59e0b", bgColor: "#fef3c7", darkBgColor: "rgba(245,158,11,0.15)" },
  urgent: { label: "Urgent", color: "#ef4444", bgColor: "#fee2e2", darkBgColor: "rgba(239,68,68,0.15)" },
};

export const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { label: string; color: string; bgColor: string; darkBgColor: string }
> = {
  onboarding: {
    label: "Onboarding",
    color: "#6366f1",
    bgColor: "#e0e7ff",
    darkBgColor: "rgba(99,102,241,0.15)",
  },
  integration: {
    label: "Integration",
    color: "#0891b2",
    bgColor: "#cffafe",
    darkBgColor: "rgba(8,145,178,0.15)",
  },
  custom: { label: "Custom", color: "#8b5cf6", bgColor: "#ede9fe", darkBgColor: "rgba(139,92,246,0.15)" },
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
