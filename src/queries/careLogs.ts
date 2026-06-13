import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type CareLog = Database["public"]["Tables"]["care_logs"]["Row"];
export type CareLogInsert = Database["public"]["Tables"]["care_logs"]["Insert"];

export function useCareLogs(plantId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careLogs", plantId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_logs")
        .select("*")
        .eq("plant_id", plantId!)
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!plantId && !!user?.id,
  });
}

export function useAllCareLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careLogs", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });
}

export function useAddCareLog() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (log: Omit<CareLogInsert, "user_id" | "logged_at">) => {
      const { data, error } = await supabase
        .from("care_logs")
        .insert({
          ...log,
          user_id: user!.id,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["careLogs", variables.plant_id] });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", variables.plant_id] });
    },
  });
}

export function useLogCareTask() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      plantId,
      careType,
      notes,
      waterFrequencyDays,
    }: {
      plantId: string;
      careType: string;
      notes?: string;
      waterFrequencyDays?: number | null;
    }) => {
      const { data: log, error: logError } = await supabase
        .from("care_logs")
        .insert({
          plant_id: plantId,
          care_type: careType,
          notes,
          user_id: user!.id,
          logged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (logError) throw logError;

      if (careType === "water") {
        const now = new Date().toISOString();
        let nextWater: string | null = null;
        if (waterFrequencyDays && waterFrequencyDays > 0) {
          const next = new Date();
          next.setDate(next.getDate() + waterFrequencyDays);
          nextWater = next.toISOString();
        }

        const { error: plantError } = await supabase
          .from("plants")
          .update({
            last_watered_at: now,
            next_water_at: nextWater,
          })
          .eq("id", plantId);

        if (plantError) throw plantError;
      }

      return log;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["careLogs"] });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      queryClient.invalidateQueries({ queryKey: ["plant", variables.plantId] });
    },
  });
}
