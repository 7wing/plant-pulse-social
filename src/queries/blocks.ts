import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type BlockedUser = Database["public"]["Tables"]["blocked_users"]["Row"];

interface BlockedUserWithProfile extends BlockedUser {
  blocked_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useBlockedUsers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["blockedUsers", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*, blocked_profile:blocked_id(username, display_name, avatar_url)")
        .eq("blocker_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as BlockedUserWithProfile[];
    },
    enabled: !!user?.id,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from("blocked_users")
        .insert({ blocker_id: user!.id, blocked_id: blockedId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (blockedId: string) => {
      const { error } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", user!.id)
        .eq("blocked_id", blockedId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
    },
  });
}