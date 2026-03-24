"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
import type { Stage } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: stages, mutate } = useSWR<Stage[]>("/api/stages", fetcher);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setError("");
    try {
      const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const maxOrder = Math.max(...(stages ?? []).map((s) => s.sort_order), 0);
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          slug,
          sort_order: maxOrder + 1,
          color: newColor,
        }),
      });
      if (res.ok) {
        setNewName("");
        mutate();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create stage");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    const res = await fetch("/api/stages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      mutate();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete stage");
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Stages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
              {error}
            </div>
          )}

          <div className="space-y-2">
            {stages?.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 rounded-md border px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div
                  className="h-4 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="flex-1 text-sm font-medium">
                  {stage.name}
                </span>
                {stage.is_default ? (
                  <span className="text-xs text-muted-foreground">Default</span>
                ) : (
                  <button
                    onClick={() => handleDelete(stage.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAdd} className="flex gap-2 pt-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New stage name..."
              className="flex-1"
            />
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-12 p-1 h-9"
            />
            <Button type="submit" size="sm" disabled={adding} className="gap-1">
              <Plus className="h-4 w-4" />
              Add Stage
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Database</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Initialize the database tables and seed default stages. Only needed on first setup.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              const res = await fetch("/api/seed", { method: "POST" });
              const data = await res.json();
              if (data.success) {
                mutate();
                alert("Database seeded successfully!");
              } else {
                alert("Error: " + (data.error || "Unknown error"));
              }
            }}
          >
            Seed Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
