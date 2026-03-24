import Link from "next/link";
import { listProjects } from "@/lib/queries/projects";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StageBadge } from "@/components/shared/stage-badge";
import type { HealthStatus, Priority } from "@/lib/types";
import {
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await listProjects();

  const active = projects.filter((p) => !p.completed_at);
  const onTrack = active.filter((p) => p.health_status === "on_track").length;
  const atRisk = active.filter((p) => p.health_status === "at_risk").length;
  const blocked = active.filter((p) => p.health_status === "blocked").length;

  const stats = [
    {
      label: "Active Projects",
      value: active.length,
      icon: FolderOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "On Track",
      value: onTrack,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "At Risk",
      value: atRisk,
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Blocked",
      value: blocked,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/projects/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active projects</p>
              <Link href="/projects/new">
                <Button>Create your first project</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((project) => {
                const taskCount = Number(project.task_count ?? 0);
                const completedCount = Number(
                  project.completed_task_count ?? 0
                );
                const progress =
                  taskCount > 0
                    ? Math.round((completedCount / taskCount) * 100)
                    : 0;
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.client_name || "No client"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {project.stage_name && project.stage_color && (
                        <StageBadge
                          name={project.stage_name}
                          color={project.stage_color}
                        />
                      )}
                      <PriorityBadge
                        priority={project.priority as Priority}
                      />
                      <StatusBadge
                        status={project.health_status as HealthStatus}
                      />
                      {taskCount > 0 && (
                        <div className="flex items-center gap-2 w-24">
                          <div className="h-2 flex-1 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {progress}%
                          </span>
                        </div>
                      )}
                      {project.target_date && (
                        <span className="text-xs text-muted-foreground w-20">
                          {project.target_date}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
