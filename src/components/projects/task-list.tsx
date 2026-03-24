"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Plus, Trash2 } from "lucide-react";
import type { Task, Stage } from "@/lib/types";
import { StageBadge } from "@/components/shared/stage-badge";

interface TaskListProps {
  projectId: number;
  tasks: Task[];
  stages: Stage[];
  onRefresh: () => void;
}

export function TaskList({ projectId, tasks, stages, onRefresh }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskStageId, setNewTaskStageId] = useState<string>(
    stages[0]?.id?.toString() ?? ""
  );
  const [adding, setAdding] = useState(false);

  const groupedTasks = stages.map((stage) => ({
    stage,
    tasks: tasks.filter((t) => t.stage_id === stage.id),
  }));

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAdding(true);
    try {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle,
          stage_id: Number(newTaskStageId),
        }),
      });
      setNewTaskTitle("");
      onRefresh();
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onRefresh();
  };

  const deleteTask = async (taskId: number) => {
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddTask} className="flex gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1"
        />
        <Select value={newTaskStageId} onValueChange={(v) => v && setNewTaskStageId(v)}>
          <SelectTrigger className="w-40">
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
        <Button type="submit" size="sm" disabled={adding} className="gap-1">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>

      {groupedTasks.map(
        ({ stage, tasks: stageTasks }) =>
          stageTasks.length > 0 && (
            <div key={stage.id}>
              <div className="flex items-center gap-2 mb-2">
                <StageBadge name={stage.name} color={stage.color} />
                <span className="text-xs text-muted-foreground">
                  {stageTasks.length} task{stageTasks.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1">
                {stageTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 group"
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => toggleTask(task)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span
                      className={`flex-1 text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">
                        {task.due_date}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
      )}

      {tasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks yet. Add one above to get started.
        </p>
      )}
    </div>
  );
}
