import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export type RoleType = "user" | "moderator" | "admin";

export interface UseRoleResult {
  role: RoleType | null;
  isAdmin: boolean;
  isModerator: boolean;
  isUser: boolean;
  loading: boolean;
}

export function useRole(): UseRoleResult {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["profileRole", user?.id],
    queryFn: async (): Promise<RoleType> => {
      if (!user?.id) return "user";

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile role:", error);
        return "user";
      }

      if (!data || !data.role) {
        return "user";
      }

      return data.role as RoleType;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    role: role ?? null,
    isAdmin: role === "admin",
    isModerator: role === "moderator" || role === "admin",
    isUser: role === "user",
    loading: isLoading,
  };
}