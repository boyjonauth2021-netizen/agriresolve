import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Conversation,
  ConversationDetail,
  GrowthData,
  Plant,
  PlantSummary,
} from "../../shared/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function useListPlants() {
  return useQuery({
    queryKey: ["plants"],
    queryFn: () => fetchJson<PlantSummary[]>("/api/plants"),
  });
}

export function useGetPlant(id: string) {
  return useQuery({
    queryKey: ["plants", id],
    queryFn: () => fetchJson<Plant>(`/api/plants/${id}`),
    enabled: !!id,
  });
}

export function useGetPlantGrowthData(id: string) {
  return useQuery({
    queryKey: ["plants", id, "growth"],
    queryFn: () => fetchJson<GrowthData>(`/api/plants/${id}/growth-data`),
    enabled: !!id,
  });
}

export function useListOpenaiConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchJson<Conversation[]>("/api/openai/conversations"),
  });
}

export function useCreateOpenaiConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: { title: string } }) =>
      fetchJson<Conversation>("/api/openai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useGetOpenaiConversation(id: number) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: () => fetchJson<ConversationDetail>(`/api/openai/conversations/${id}`),
    enabled: id > 0,
  });
}
