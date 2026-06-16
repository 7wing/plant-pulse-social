import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type ProfileSummary = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function useFollows() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["follows", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);

      if (error) throw error;
      return new Set(data?.map((f) => f.following_id) ?? []);
    },
    enabled: !!user?.id,
  });
}

export function useIsFollowing(followingId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isFollowing", user?.id, followingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id)
        .eq("following_id", followingId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!followingId && followingId !== user?.id,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: user!.id, following_id: followingId });
      if (error) throw error;
    },
    onSuccess: (_data, followingId) => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["profile", followingId] });
    },
  });
}

export function useUnfollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (followingId: string) => {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user!.id)
        .eq("following_id", followingId);
      if (error) throw error;
    },
    onSuccess: (_data, followingId) => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: ["isFollowing"] });
      queryClient.invalidateQueries({ queryKey: ["profile", followingId] });
      queryClient.invalidateQueries({ queryKey: ["followerCount"] });
      queryClient.invalidateQueries({ queryKey: ["followingCount"] });
    },
  });
}

export function useFollowerCount(profileId?: string) {
  return useQuery({
    queryKey: ["followerCount", profileId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profileId,
  });
}

export function useFollowingCount(profileId?: string) {
  return useQuery({
    queryKey: ["followingCount", profileId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!profileId,
  });
}

export function useFollowerList(profileId?: string) {
  return useQuery({
    queryKey: ["followerList", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("follower_id, profiles:follower_id(id, username, display_name, avatar_url)")
        .eq("following_id", profileId!);

      if (error) throw error;
      return (data ?? [])
        .map((row) => row.profiles as ProfileSummary)
        .filter(Boolean) as ProfileSummary[];
    },
    enabled: !!profileId,
  });
}

export function useFollowingList(profileId?: string) {
  return useQuery({
    queryKey: ["followingList", profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("following_id, profiles:following_id(id, username, display_name, avatar_url)")
        .eq("follower_id", profileId!);

      if (error) throw error;
      return (data ?? [])
        .map((row) => row.profiles as ProfileSummary)
        .filter(Boolean) as ProfileSummary[];
    },
    enabled: !!profileId,
  });
}
