"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, Stage } from "@/lib/types";

interface ProjectFormProps {
  project?: Project;
  stages: Stage[];
}

export function ProjectForm({ project, stages }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    client_name: string;
    project_type: string;
    current_stage_id: number;
    start_date: string;
    target_date: string;
    priority: string;
    health_status: string;
  }>({
    name: project?.name ?? "",
    description: project?.description ?? "",
    client_name: project?.client_name ?? "",
    project_type: project?.project_type ?? "onboarding",
    current_stage_id: project?.current_stage_id ?? stages[0]?.id ?? 1,
    start_date: project?.start_date ?? "",
    target_date: project?.target_date ?? "",
    priority: project?.priority ?? "medium",
    health_status: project?.health_status ?? "on_track",
  });

  useEffect(() => {
    if (!project && stages.length > 0 && !form.current_stage_id) {
      setForm((f) => ({ ...f, current_stage_id: stages[0].id }));
    }
  }, [stages, project, form.current_stage_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const method = project ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          current_stage_id: Number(form.current_stage_id),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${data.id}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <label className="text-sm font-medium">Project Name *</label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., Walmart EDI Onboarding"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Client / Trading Partner</label>
        <Input
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          placeholder="e.g., Walmart"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of the project..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Project Type</label>
          <Select
            value={form.project_type}
            onValueChange={(v) => v && setForm({ ...form, project_type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="onboarding">Onboarding</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Current Stage</label>
          <Select
            value={String(form.current_stage_id)}
            onValueChange={(v) =>
              v && setForm({ ...form, current_stage_id: Number(v) })
            }
          >
            <SelectTrigger>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={form.priority}
            onValueChange={(v) => v && setForm({ ...form, priority: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Health Status</label>
          <Select
            value={form.health_status}
            onValueChange={(v) => v && setForm({ ...form, health_status: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="on_track">On Track</SelectItem>
              <SelectItem value="at_risk">At Risk</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Date</label>
          <Input
            type="date"
            value={form.target_date}
            onChange={(e) => setForm({ ...form, target_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : project
              ? "Update Project"
              : "Create Project"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
