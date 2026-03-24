import useSWR from "swr";
import type { Project } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    "/api/projects",
    fetcher
  );
  return { projects: data ?? [], error, isLoading, mutate };
}

export function useProject(id: number | string) {
  const { data, error, isLoading, mutate } = useSWR<Project>(
    `/api/projects/${id}`,
    fetcher
  );
  return { project: data, error, isLoading, mutate };
}
