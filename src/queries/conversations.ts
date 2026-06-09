import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];

interface ConversationWithDetails extends Conversation {
  otherParticipant: {
    id: string;
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
  lastMessage: {
    text: string | null;
    sender_id: string | null;
    created_at: string | null;
    is_read: boolean | null;
    profiles: {
      username: string;
      avatar_url: string | null;
      display_name: string | null;
    } | null;
  } | null;
  unreadCount: number;
}

export function useConversations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .contains("participant_ids", [user!.id])
        .order("last_message_at", { ascending: false });

      if (convError) throw convError;
      if (!conversations || conversations.length === 0) return [];

      const convIds = conversations.map((c) => c.id);

      // Fetch latest message per conversation
      const { data: messages, error: msgError } = await supabase
        .from("messages")
        .select("*, profiles:sender_id(username, avatar_url, display_name)")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      if (msgError) throw msgError;

      // Pick first (latest) message per conversation
      const latestMap = new Map<string, typeof messages[number]>();
      for (const msg of messages ?? []) {
        if (!latestMap.has(msg.conversation_id!)) {
          latestMap.set(msg.conversation_id!, msg);
        }
      }

      // Fetch other participant profiles
      const otherIds = conversations.flatMap((c) =>
        c.participant_ids.filter((id) => id !== user!.id)
      );

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, display_name")
        .in("id", [...new Set(otherIds)]);

      if (profileError) throw profileError;

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      // Count unread messages per conversation
      const { data: unreadData, error: unreadError } = await supabase
        .from("messages")
        .select("conversation_id, id", { count: "exact" })
        .in("conversation_id", convIds)
        .eq("is_read", false)
        .neq("sender_id", user!.id);

      if (unreadError) throw unreadError;

      const unreadMap = new Map<string, number>();
      for (const row of unreadData ?? []) {
        const cid = row.conversation_id;
        unreadMap.set(cid, (unreadMap.get(cid) ?? 0) + 1);
      }

      return conversations.map((conv) => {
        const otherId = conv.participant_ids.find((id) => id !== user!.id);
        return {
          ...conv,
          otherParticipant: otherId ? profileMap.get(otherId) ?? null : null,
          lastMessage: latestMap.get(conv.id) ?? null,
          unreadCount: unreadMap.get(conv.id) ?? 0,
        };
      }) as ConversationWithDetails[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (otherUserId: string) => {
      // Check if a conversation already exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .contains("participant_ids", [user!.id, otherUserId])
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          participant_ids: [user!.id, otherUserId],
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
