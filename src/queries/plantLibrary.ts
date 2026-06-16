import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type PlantLibraryEntry = Database["public"]["Tables"]["plant_library"]["Row"];
export type SavedGuide = Database["public"]["Tables"]["saved_guides"]["Row"];

interface SavedGuideWithEntry extends SavedGuide {
  plant_library: PlantLibraryEntry | null;
}

export function usePlantLibrarySearch(query: string) {
  return useQuery({
    queryKey: ["plantLibrarySearch", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .or(`species_name.ilike.%${query}%,common_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length > 1,
  });
}

export function usePlantLibraryEntry(id?: string) {
  return useQuery({
    queryKey: ["plantLibraryEntry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSavedGuides() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savedGuides", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_guides")
        .select("*, plant_library(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SavedGuideWithEntry[];
    },
    enabled: !!user?.id,
  });
}

export function useSaveGuide() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantLibraryId: string) => {
      const { error } = await supabase
        .from("saved_guides")
        .insert({ plant_library_id: plantLibraryId, user_id: user!.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGuides"] });
    },
  });
}

export function useUnsaveGuide() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantLibraryId: string) => {
      const { error } = await supabase
        .from("saved_guides")
        .delete()
        .eq("plant_library_id", plantLibraryId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGuides"] });
    },
  });
}