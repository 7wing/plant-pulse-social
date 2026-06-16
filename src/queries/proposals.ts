import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/lib/database.types";

export type Proposal = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];
export type ProposalUpdate = Database["public"]["Tables"]["proposals"]["Update"];

interface ProposalWithSubmitter extends Proposal {
  submitter: {
    username: string;
    avatar_url: string | null;
    display_name: string | null;
  } | null;
}

export function useProposals(status?: string) {
  return useQuery({
    queryKey: ["proposals", status],
    queryFn: async () => {
      let query = supabase
        .from("proposals")
        .select("*, submitter:submitter_id(username, avatar_url, display_name)")
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProposalWithSubmitter[];
    },
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (proposal: Omit<ProposalInsert, "submitter_id" | "status">) => {
      const { data, error } = await supabase
        .from("proposals")
        .insert({
          ...proposal,
          submitter_id: user!.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProposalUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("proposals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
    },
  });
}