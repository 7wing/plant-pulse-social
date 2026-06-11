import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];

interface PostWithAuthor extends Post {
  profiles: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

const PAGE_SIZE = 20;

export function useFeedPosts(followingOnly = false) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ["feed", "posts", followingOnly ? "following" : "all"],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("posts")
        .select(
          "*, profiles:author_id(username, avatar_url, display_name)"
        )
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (followingOnly && user) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);
        const followingIds = follows?.map((f) => f.following_id) ?? [];
        if (followingIds.length > 0) {
          query = query.in("author_id", followingIds);
        } else {
          // No follows yet → return empty
          return [];
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []) as PostWithAuthor[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !followingOnly || !!user,
  });
}

export function usePostLikeStatus(postId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["postLike", postId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("likes")
        .select("post_id")
        .eq("post_id", postId!)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!postId && !!user?.id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (post: Omit<PostInsert, "author_id" | "likes_count" | "comments_count">) => {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          ...post,
          author_id: user!.id,
          likes_count: 0,
          comments_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed", "posts"] });
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: postId, user_id: user!.id });
      if (error) throw error;
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["feed", "posts"] });
      await queryClient.cancelQueries({ queryKey: ["postLike", postId] });

      const previousFeed = queryClient.getQueryData(["feed", "posts"]);

      queryClient.setQueryData(["postLike", postId, user?.id], true);

      queryClient.setQueriesData({ queryKey: ["feed", "posts"] }, (old: { pages: PostWithAuthor[][] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PostWithAuthor[]) =>
            page.map((post) =>
              post.id === postId
                ? { ...post, likes_count: (post.likes_count ?? 0) + 1 }
                : post
            )
          ),
        };
      });

      return { previousFeed };
    },
    onError: (_err, postId, context) => {
      queryClient.setQueryData(["postLike", postId, user?.id], false);
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed", "posts"], context.previousFeed);
      }
    },
    onSettled: (_data, _error, postId) => {
      queryClient.invalidateQueries({ queryKey: ["feed", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["postLike", postId] });
    },
  });
}

export function useUnlikePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ["feed", "posts"] });
      await queryClient.cancelQueries({ queryKey: ["postLike", postId] });

      const previousFeed = queryClient.getQueryData(["feed", "posts"]);

      queryClient.setQueryData(["postLike", postId, user?.id], false);

      queryClient.setQueriesData({ queryKey: ["feed", "posts"] }, (old: { pages: PostWithAuthor[][] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: PostWithAuthor[]) =>
            page.map((post) =>
              post.id === postId
                ? { ...post, likes_count: Math.max(0, (post.likes_count ?? 0) - 1) }
                : post
            )
          ),
        };
      });

      return { previousFeed };
    },
    onError: (_err, postId, context) => {
      queryClient.setQueryData(["postLike", postId, user?.id], true);
      if (context?.previousFeed) {
        queryClient.setQueryData(["feed", "posts"], context.previousFeed);
      }
    },
    onSettled: (_data, _error, postId) => {
      queryClient.invalidateQueries({ queryKey: ["feed", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["postLike", postId] });
    },
  });
}
