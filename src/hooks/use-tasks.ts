import useSWR from "swr";
import type { Task } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTasks(projectId: number | string) {
  const { data, error, isLoading, mutate } = useSWR<Task[]>(
    `/api/projects/${projectId}/tasks`,
    fetcher
  );
  return { tasks: data ?? [], error, isLoading, mutate };
}
