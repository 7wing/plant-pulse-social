import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Plant = Database["public"]["Tables"]["plants"]["Row"];
export type PlantInsert = Database["public"]["Tables"]["plants"]["Insert"];
export type PlantUpdate = Database["public"]["Tables"]["plants"]["Update"];

export function usePlants() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["plants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfilePlants(profileId?: string) {
  return useQuery({
    queryKey: ["profilePlants", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("owner_id", profileId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profileId,
  });
}

export function usePlant(id?: string) {
  return useQuery({
    queryKey: ["plant", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plants")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useAddPlant() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plant: Omit<PlantInsert, "owner_id">) => {
      const { data, error } = await supabase
        .from("plants")
        .insert({ ...plant, owner_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

export function useUpdatePlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: PlantUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("plants")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", variables.id] });
    },
  });
}

export function useDeletePlant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plants"] });
    },
  });
}
