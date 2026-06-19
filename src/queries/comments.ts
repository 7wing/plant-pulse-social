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

  type FeedData = { pages: { id: string; comments_count: number | null }[][] } | undefined;

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
    onMutate: async (comment) => {
      await queryClient.cancelQueries({ queryKey: ["comments", comment.post_id] });
      await queryClient.cancelQueries({ queryKey: ["feed", "posts"] });

      const previousFeeds = queryClient.getQueriesData<FeedData>({ queryKey: ["feed", "posts"] });

      queryClient.setQueriesData<FeedData>({ queryKey: ["feed", "posts"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) =>
            page.map((post) =>
              post.id === comment.post_id
                ? { ...post, comments_count: (post.comments_count ?? 0) + 1 }
                : post
            )
          ),
        };
      });

      return { previousFeeds };
    },
    onError: (_err, comment, context) => {
      if (context?.previousFeeds) {
        context.previousFeeds.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}
