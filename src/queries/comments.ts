import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type CommentInsert = Database["public"]["Tables"]["comments"]["Insert"];

interface CommentWithAuthor extends Comment {
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

export function useComments(postId?: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "*, profiles:author_id(username, avatar_url, display_name)"
        )
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CommentWithAuthor[];
    },
    enabled: !!postId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (comment: Omit<CommentInsert, "author_id">) => {
      const { data, error } = await supabase
        .from("comments")
        .insert({ ...comment, author_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed", "posts"] });
    },
  });
}
