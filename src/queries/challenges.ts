import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Challenge = Database["public"]["Tables"]["challenges"]["Row"];
export type ChallengeInsert = Database["public"]["Tables"]["challenges"]["Insert"];
export type ChallengeEntry = Database["public"]["Tables"]["challenge_entries"]["Row"];

interface ChallengeWithProposer extends Challenge {
  proposer: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const CHALLENGE_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop";

export { AVATAR_FALLBACK, CHALLENGE_FALLBACK_IMAGE };

// Get active challenges/events (status = 'active')
export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, proposer:proposer_id(username, avatar_url, display_name)")
        .eq("status", "active")
        .order("starts_at", { ascending: true });

      if (error) throw error;
      return (data ?? []) as ChallengeWithProposer[];
    },
  });
}

// Get single challenge by ID
export function useChallenge(id?: string) {
  return useQuery({
    queryKey: ["challenge", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*, proposer:proposer_id(username, avatar_url, display_name)")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data as ChallengeWithProposer;
    },
    enabled: !!id,
  });
}

// Check if user has joined a challenge
export function useChallengeEntry(challengeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["challengeEntry", challengeId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_entries")
        .select("*")
        .eq("challenge_id", challengeId!)
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as ChallengeEntry | null;
    },
    enabled: !!challengeId && !!user?.id,
  });
}

// Join a challenge - creates entry + care task
export function useJoinChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ challengeId, challengeTitle, dueDate }: { 
      challengeId: string;
      challengeTitle: string;
      dueDate: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // 1. Create challenge entry
      const { error: entryError } = await supabase
        .from("challenge_entries")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
        });

      if (entryError) throw entryError;

      // 2. Update participants count
      const { error: countError } = await supabase.rpc("increment_participants", {
        p_challenge_id: challengeId,
      });
      if (countError) console.error("Failed to increment participants:", countError);

      // 3. Create care task reminder
      const { error: taskError } = await supabase
        .from("care_tasks")
        .insert({
          user_id: user.id,
          task_name: `Join ${challengeTitle}`,
          task_type: "challenge",
          due_date: dueDate,
          is_recurring: false,
        });

      if (taskError) console.error("Failed to create care task:", taskError);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challengeEntry"] });
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

// RSVP to an event - creates reminder care task
export function useRSVPChallenge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ challengeId, eventTitle, eventDate, location }: { 
      challengeId: string;
      eventTitle: string;
      eventDate: string;
      location?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // 1. Create challenge entry
      const { error: entryError } = await supabase
        .from("challenge_entries")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
        });

      if (entryError) throw entryError;

      // 2. Update participants count
      const { error: countError } = await supabase.rpc("increment_participants", {
        p_challenge_id: challengeId,
      });
      if (countError) console.error("Failed to increment participants:", countError);

      // 3. Create reminder care task
      const { error: taskError } = await supabase
        .from("care_tasks")
        .insert({
          user_id: user.id,
          task_name: `RSVP: ${eventTitle}`,
          task_type: "reminder",
          due_date: eventDate,
          is_recurring: false,
          notes: location ? `Location: ${location}` : "Virtual event",
        });

      if (taskError) console.error("Failed to create reminder task:", taskError);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challengeEntry"] });
      queryClient.invalidateQueries({ queryKey: ["careTasks"] });
    },
  });
}

// Calculate time remaining for a challenge/event
export function getTimeRemaining(endsAt: string | null): string {
  if (!endsAt) return "";
  
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Ended";
  
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  
  if (diffDays > 1) return `${diffDays}d left`;
  if (diffDays === 1) return "1d left";
  if (diffHours > 1) return `${diffHours}h left`;
  return `${diffMinutes}m left`;
}

// Format date for display
export function formatChallengeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Generate hashtag from title
export function getChallengeTag(title: string): string {
  return "#" + title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "");
}