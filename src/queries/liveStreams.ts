import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
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
      co_host_setting?: string | null;
      moderation_setting?: string | null;
      chat_setting?: string | null;
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
          co_host_setting: stream.co_host_setting ?? null,
          moderation_setting: stream.moderation_setting ?? null,
          chat_setting: stream.chat_setting ?? null,
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

// Stream chat message type (uses Supabase Realtime, not database persistence yet)
export interface StreamChatMessage {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  display_name: string | null;
  text: string;
  created_at: string;
}

export function useStreamChat(streamId: string | undefined, enabled: boolean = true) {
  const [messages, setMessages] = useState<StreamChatMessage[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!streamId || !enabled) return;

    const channel = supabase.channel(`stream-chat:${streamId}`);

    channel
      .on("broadcast", { event: "chat_message" }, (payload) => {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === payload.payload.id)) return prev;
          // Keep last 50 messages
          const newMessages = [...prev, payload.payload as StreamChatMessage];
          return newMessages.slice(-50);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, enabled]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!streamId || !user || !text.trim()) return;

      const channel = supabase.channel(`stream-chat:${streamId}`);

      const message: StreamChatMessage = {
        id: crypto.randomUUID(),
        user_id: user.id,
        username: (user as unknown as Record<string, string>).username || user.email || user.id.slice(0, 8),
        avatar_url: (user as unknown as Record<string, string | null>).avatar_url || null,
        display_name: (user as unknown as Record<string, string | null>).display_name || null,
        text: text.trim(),
        created_at: new Date().toISOString(),
      };

      await channel.send({
        type: "broadcast",
        event: "chat_message",
        payload: message,
      });
    },
    [streamId, user]
  );

  return { messages, sendMessage };
}