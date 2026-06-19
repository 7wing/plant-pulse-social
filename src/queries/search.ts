import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: ["userSearch", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length > 1,
  });
}

export function useTagSearch(query: string) {
  return useQuery({
    queryKey: ["tagSearch", query],
    queryFn: async () => {
      // Search for posts that have tags containing the query
      const { data, error } = await supabase
        .from("posts")
        .select("tags")
        .not("tags", "is", null)
        .limit(50);

      if (error) throw error;

      if (!data) return [];

      // Extract unique tags that match the query
      const tagSet = new Set<string>();
      data.forEach((post) => {
        if (post.tags) {
          post.tags
            .filter((tag: string) =>
              tag.toLowerCase().includes(query.toLowerCase())
            )
            .forEach((tag: string) => tagSet.add(tag));
        }
      });

      return Array.from(tagSet).slice(0, 20);
    },
    enabled: query.length > 1,
  });
}

export function useTrendingTags(limit = 8) {
  return useQuery({
    queryKey: ["trendingTags"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 7);

      const { data, error } = await supabase
        .from("posts")
        .select("tags")
        .not("tags", "is", null)
        .gte("created_at", since.toISOString())
        .limit(200);

      if (error) throw error;

      const counts = new Map<string, number>();
      (data ?? []).forEach((post) => {
        if (post.tags) {
          post.tags.forEach((tag: string) => {
            counts.set(tag, (counts.get(tag) ?? 0) + 1);
          });
        }
      });

      return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);
    },
  });
}