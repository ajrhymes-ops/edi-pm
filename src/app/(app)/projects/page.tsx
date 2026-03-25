import Link from "next/link";
import { listProjects } from "@/lib/queries/projects";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StageBadge } from "@/components/shared/stage-badge";
import { PROJECT_TYPE_CONFIG } from "@/lib/constants";
import type { HealthStatus, Priority, ProjectType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <Link href="/projects/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Link href="/projects/new">
            <Button>Create your first project</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Target Date</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const typeConfig =
                  PROJECT_TYPE_CONFIG[project.project_type as ProjectType];
                const taskCount = Number(project.task_count ?? 0);
                const completedCount = Number(project.completed_task_count ?? 0);
                const progress =
                  taskCount > 0
                    ? Math.round((completedCount / taskCount) * 100)
                    : 0;
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.client_name || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: typeConfig?.bgColor,
                          color: typeConfig?.color,
                        }}
                      >
                        {typeConfig?.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {project.stage_name && project.stage_color && (
                        <StageBadge
                          name={project.stage_name}
                          color={project.stage_color}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <PriorityBadge
                        priority={project.priority as Priority}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={project.health_status as HealthStatus}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.target_date || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-2 rounded-full gradient-progress"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {completedCount}/{taskCount}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
