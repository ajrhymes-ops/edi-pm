"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StageBadge } from "@/components/shared/stage-badge";
import { TaskList } from "@/components/projects/task-list";
import { CommentList } from "@/components/projects/comment-list";
import { ActivityFeed } from "@/components/projects/activity-feed";
import { SubProjectList } from "@/components/projects/sub-project-list";
import { useTasks } from "@/hooks/use-tasks";
import { PROJECT_TYPE_CONFIG } from "@/lib/constants";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { Project, Stage, HealthStatus, Priority, ProjectType } from "@/lib/types";

export function ProjectDetailClient({
  project,
  stages,
}: {
  project: Project;
  stages: Stage[];
}) {
  const router = useRouter();
  const { tasks, mutate: mutateTasks } = useTasks(project.id);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/projects");
    router.refresh();
  };

  const taskCount = Number(project.task_count ?? 0);
  const completedCount = Number(project.completed_task_count ?? 0);
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const typeConfig = PROJECT_TYPE_CONFIG[project.project_type as ProjectType];

  return (
    <div className="p-8">
      {project.parent_id && project.parent_name && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
          <Link href={`/projects/${project.parent_id}`} className="hover:underline">
            {project.parent_name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{project.name}</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{project.name}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {project.client_name && (
              <span className="text-muted-foreground">{project.client_name}</span>
            )}
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: typeConfig?.bgColor, color: typeConfig?.color }}
            >
              {typeConfig?.label}
            </span>
            {project.stage_name && project.stage_color && (
              <StageBadge name={project.stage_name} color={project.stage_color} />
            )}
            <PriorityBadge priority={project.priority as Priority} />
            <StatusBadge status={project.health_status as HealthStatus} />
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger className="inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background h-8 px-3 text-destructive hover:bg-accent hover:text-accent-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete project?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{project.name}&quot; and all its tasks,
                  comments, and activity. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {project.description && (
        <p className="text-muted-foreground mb-4">{project.description}</p>
      )}

      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
        {project.start_date && <span>Start: {project.start_date}</span>}
        {project.target_date && <span>Target: {project.target_date}</span>}
        {taskCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>
              {completedCount}/{taskCount} tasks
            </span>
          </div>
        )}
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="subprojects">
            Sub-Projects
            {Number(project.sub_project_count ?? 0) > 0 && (
              <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                {project.sub_project_count}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-4">
          <TaskList
            projectId={project.id}
            tasks={tasks}
            stages={stages}
            onRefresh={() => mutateTasks()}
          />
        </TabsContent>
        <TabsContent value="subprojects" className="mt-4">
          <SubProjectList parentId={project.id} stages={stages} />
        </TabsContent>
        <TabsContent value="comments" className="mt-4">
          <CommentList projectId={project.id} />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <ActivityFeed projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
