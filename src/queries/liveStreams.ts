import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Stream = Database["public"]["Tables"]["live_streams"]["Row"];

export interface StreamWithHost extends Stream {
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

export function useLiveStreams() {
  return useQuery({
    queryKey: ["liveStreams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*, profiles:host_id(username, avatar_url, display_name)")
        .eq("status", "live")
        .order("started_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as StreamWithHost[];
    },
  });
}

export function useStream(streamId: string | undefined) {
  return useQuery({
    queryKey: ["stream", streamId],
    queryFn: async () => {
      if (!streamId) throw new Error("streamId is required");

      const { data, error } = await supabase
        .from("live_streams")
        .select("*, profiles:host_id(username, avatar_url, display_name)")
        .eq("id", streamId)
        .single();

      if (error) throw error;
      return data as StreamWithHost;
    },
    enabled: !!streamId,
  });
}

export function useCreateStream() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (stream: {
      id: string;
      title: string;
      category?: string | null;
      stream_key?: string | null;
      thumbnail_url?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("live_streams")
        .insert({
          id: stream.id,
          host_id: user.id,
          title: stream.title,
          category: stream.category ?? null,
          stream_key: stream.stream_key ?? null,
          thumbnail_url: stream.thumbnail_url ?? null,
          status: "live",
          started_at: new Date().toISOString(),
          viewer_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Stream;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
    },
  });
}

export function useEndStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (streamId: string) => {
      const { data, error } = await supabase
        .from("live_streams")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
          viewer_count: 0,
        })
        .eq("id", streamId)
        .select()
        .single();

      if (error) throw error;
      return data as Stream;
    },
    onSuccess: (_data, streamId) => {
      queryClient.invalidateQueries({ queryKey: ["liveStreams"] });
      queryClient.invalidateQueries({ queryKey: ["stream", streamId] });
    },
  });
}

export function useUpdateViewerCount() {
  return useMutation({
    mutationFn: async ({ id, viewer_count }: { id: string; viewer_count: number }) => {
      const { error } = await supabase
        .from("live_streams")
        .update({ viewer_count })
        .eq("id", id);

      if (error) throw error;
    },
  });
}