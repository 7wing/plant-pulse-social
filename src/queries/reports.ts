import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

interface ReportWithReporter extends Report {
  reporter: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

export function useReports(status?: string) {
  return useQuery({
    queryKey: ["reports", status],
    queryFn: async () => {
      let query = supabase
        .from("reports")
        .select("*, reporter:reporter_id(username, avatar_url, display_name)")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ReportWithReporter[];
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (report: Omit<ReportInsert, "reporter_id" | "status">) => {
      const { data, error } = await supabase
        .from("reports")
        .insert({
          ...report,
          reporter_id: user!.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      moderatorNote,
    }: {
      id: string;
      status: string;
      moderatorNote?: string;
    }) => {
      const { data, error } = await supabase
        .from("reports")
        .update({
          status,
          resolved_by: user!.id,
          resolved_at: new Date().toISOString(),
          moderator_note: moderatorNote,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}