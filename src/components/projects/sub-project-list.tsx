"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StageBadge } from "@/components/shared/stage-badge";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { FolderOpen, Plus } from "lucide-react";
import type { Project, Stage, HealthStatus, Priority } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SubProjectListProps {
  parentId: number;
  stages: Stage[];
}

export function SubProjectList({ parentId, stages }: SubProjectListProps) {
  const { data: subProjects, mutate } = useSWR<Project[]>(
    `/api/projects/${parentId}/subprojects`,
    fetcher
  );
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [priority, setPriority] = useState("medium");
  const [stageId, setStageId] = useState(String(stages[0]?.id ?? 1));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parent_id: parentId,
          project_type: "custom",
          current_stage_id: Number(stageId),
          priority,
        }),
      });
      if (res.ok) {
        setName("");
        setAdding(false);
        mutate();
      }
    } finally {
      setLoading(false);
    }
  };

  const items = subProjects ?? [];

  return (
    <div className="space-y-4">
      {items.length === 0 && !adding && (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No sub-projects yet.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((sub) => {
            const taskCount = Number(sub.task_count ?? 0);
            const completedCount = Number(sub.completed_task_count ?? 0);
            const progress =
              taskCount > 0
                ? Math.round((completedCount / taskCount) * 100)
                : 0;

            return (
              <Link
                key={sub.id}
                href={`/projects/${sub.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{sub.name}</span>
                  {sub.stage_name && sub.stage_color && (
                    <StageBadge name={sub.stage_name} color={sub.stage_color} />
                  )}
                  <PriorityBadge priority={sub.priority as Priority} />
                  <StatusBadge status={sub.health_status as HealthStatus} />
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                  {taskCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span>
                        {completedCount}/{taskCount}
                      </span>
                    </div>
                  )}
                  {sub.target_date && <span>{sub.target_date}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sub-project name..."
            autoFocus
            className="flex-1"
          />
          <Select value={stageId} onValueChange={(v) => v && setStageId(v)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={String(stage.id)}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(false)}
          >
            Cancel
          </Button>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Sub-Project
        </Button>
      )}
    </div>
  );
}
