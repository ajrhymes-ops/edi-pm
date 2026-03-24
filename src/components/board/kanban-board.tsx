"use client";

import { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import type { Project, Stage, HealthStatus, Priority } from "@/lib/types";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function KanbanBoard({ stages }: { stages: Stage[] }) {
  const { data: projects, mutate } = useSWR<Project[]>(
    "/api/projects",
    fetcher
  );
  const [optimisticProjects, setOptimisticProjects] = useState<Project[] | null>(null);

  const displayProjects = optimisticProjects ?? projects ?? [];

  const columns = stages.map((stage) => ({
    stage,
    projects: displayProjects.filter(
      (p) => p.current_stage_id === stage.id && !p.completed_at
    ),
  }));

  // Also show completed projects in the Complete column
  const completeStage = stages.find((s) => s.slug === "complete");
  if (completeStage) {
    const completeCol = columns.find((c) => c.stage.id === completeStage.id);
    if (completeCol) {
      const completedProjects = displayProjects.filter(
        (p) => p.completed_at && p.current_stage_id === completeStage.id
      );
      // Merge completed projects that aren't already included
      const existingIds = new Set(completeCol.projects.map((p) => p.id));
      for (const p of completedProjects) {
        if (!existingIds.has(p.id)) {
          completeCol.projects.push(p);
        }
      }
    }
  }

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination || !projects) return;

      const sourceStageId = Number(result.source.droppableId);
      const destStageId = Number(result.destination.droppableId);

      if (sourceStageId === destStageId) return;

      const projectId = Number(result.draggableId);

      // Optimistic update
      const updated = projects.map((p) =>
        p.id === projectId ? { ...p, current_stage_id: destStageId } : p
      );
      setOptimisticProjects(updated);

      try {
        await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current_stage_id: destStageId }),
        });
        mutate();
      } catch {
        setOptimisticProjects(null);
      } finally {
        setOptimisticProjects(null);
      }
    },
    [projects, mutate]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(({ stage, projects: colProjects }) => (
          <div key={stage.id} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="font-medium text-sm">{stage.name}</span>
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                {colProjects.length}
              </span>
            </div>
            <Droppable droppableId={String(stage.id)}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                    snapshot.isDraggingOver ? "bg-muted/50" : "bg-muted/20"
                  }`}
                >
                  {colProjects.map((project, index) => (
                    <Draggable
                      key={project.id}
                      draggableId={String(project.id)}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Link href={`/projects/${project.id}`}>
                            <Card
                              className={`cursor-pointer hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? "shadow-lg rotate-2" : ""
                              }`}
                            >
                              <CardContent className="p-3">
                                <p className="font-medium text-sm mb-1">
                                  {project.name}
                                </p>
                                {project.client_name && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {project.client_name}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <PriorityBadge
                                    priority={project.priority as Priority}
                                  />
                                  <StatusBadge
                                    status={
                                      project.health_status as HealthStatus
                                    }
                                  />
                                </div>
                                {project.target_date && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Due: {project.target_date}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
