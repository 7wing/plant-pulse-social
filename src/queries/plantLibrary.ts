import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface PlantLibraryEntry {
  id: string;
  species_name: string;
  common_name: string | null;
  image_url: string | null;
  light: string | null;
  water: string | null;
  difficulty: string | null;
  description: string | null;
  toxicity_to_pets: string | null;
  toxicity_to_humans: boolean | null;
  symptoms: string | null;
  safe_placement: string | null;
  source: string | null;
  created_at: string;
}
export type SavedGuide = Database["public"]["Tables"]["saved_guides"]["Row"];

interface SavedGuideWithEntry extends SavedGuide {
  plant_library: PlantLibraryEntry | null;
}

export function usePlantLibrarySearch(query: string) {
  return useQuery({
    queryKey: ["plantLibrarySearch", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .or(`species_name.ilike.%${query}%,common_name.ilike.%${query}%,description.ilike.%${query}%,light.ilike.%${query}%,water.ilike.%${query}%,difficulty.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length > 1,
  });
}

export function usePlantLibraryAll(limit = 50) {
  return useQuery({
    queryKey: ["plantLibraryAll", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePlantLibraryEntry(id?: string) {
  return useQuery({
    queryKey: ["plantLibraryEntry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .eq("id", id!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSavedGuides() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savedGuides", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_guides")
        .select("*, plant_library(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as SavedGuideWithEntry[];
    },
    enabled: !!user?.id,
  });
}

export function useSaveGuide() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantLibraryId: string) => {
      const { error } = await supabase
        .from("saved_guides")
        .insert({ plant_library_id: plantLibraryId, user_id: user!.id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGuides"] });
    },
  });
}

export function useUnsaveGuide() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (plantLibraryId: string) => {
      const { error } = await supabase
        .from("saved_guides")
        .delete()
        .eq("plant_library_id", plantLibraryId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedGuides"] });
    },
  });
}

// Trigger edge function to lookup a plant and auto-insert into plant_library
async function fetchPlantLookup(query: string): Promise<boolean> {
  const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-lookup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Plant lookup error:", errorData);
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data && data.found === true && data.data != null;
}

export function useLoadPopularPlants() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const popularTerms = [
        "monstera deliciosa", "pothos", "sansevieria trifasciata", "aloe vera",
        "echeveria", "nephrolepis exaltata", "spider plant", "peace lily",
        "ficus elastica", "fiddle leaf fig", "zz plant", "philodendron",
        "jade plant", "calathea", "croton", "dracaena marginata",
        "english ivy", "parlor palm", "chinese evergreen", "yucca filamentosa",
        "begonia", "phalaenopsis", "boston fern", "pachira aquatica",
        "alocasia", "anthurium", "strelitzia reginae", "euphorbia trigona",
        "eucalyptus", "lavandula angustifolia"
      ];
      // Batch requests to avoid API rate limits (3 at a time, 1s delay between batches)
      const batchSize = 3;
      const delay = 1000;
      let successCount = 0;
      let failCount = 0;
      for (let i = 0; i < popularTerms.length; i += batchSize) {
        const batch = popularTerms.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((term) => fetchPlantLookup(term)));
        for (const r of results) {
          if (r.status === "fulfilled" && r.value) successCount++;
          else failCount++;
        }
        if (i + batchSize < popularTerms.length) {
          await new Promise((res) => setTimeout(res, delay));
        }
      }
      if (successCount === 0) {
        throw new Error("All lookups failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantLibraryAll"] });
      queryClient.invalidateQueries({ queryKey: ["plantLibrarySearch"] });
      toast.success("Popular plants loaded!");
    },
    onError: () => {
      toast.error("Failed to load some plants. Please try again.");
    },
  });
}

export function usePlantLookup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchPlantLookup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantLibraryAll"] });
      queryClient.invalidateQueries({ queryKey: ["plantLibrarySearch"] });
    },
  });
}