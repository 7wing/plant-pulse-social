import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AdminStats {
  proposals: number;
  reports: number;
  users: number;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [{ count: proposals }, { count: reports }, { count: users }] = await Promise.all([
        supabase.from("proposals").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      return { proposals: proposals ?? 0, reports: reports ?? 0, users: users ?? 0 };
    },
  });
}