import { Search, Globe, Grid3X3, List } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import PlantLibraryCard from "@/components/PlantLibraryCard";
import CareGuideCard from "@/components/CareGuideCard";
import { CareGuideSheet } from "@/components/CareGuideSheet";
import { usePlantLibrarySearch, usePlantLibraryAll } from "@/queries/plantLibrary";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

const categories = ["All", "Indoor", "Succulents", "Rare", "Propagation", "Gardening", "Tropical", "Cacti"];

const onlineSearchMessages = [
  "Searching plant databases...",
  "Looking up Wikipedia...",
  "Finding care requirements...",
  "Fetching plant images...",
  "Building plant profile...",
  "Almost there...",
];

// Map categories to search terms for filtering
const categorySearchTerms: Record<string, string> = {
  All: "",
  Indoor: "indoor",
  Succulents: "succulent",
  Rare: "rare",
  Propagation: "propagation",
  Gardening: "garden",
  Tropical: "tropical",
  Cacti: "cactus",
};

function formatBinomial(name: string | null): string {
  if (!name) return "";
  const parts = name.split(/\s+/);
  if (parts.length === 0) return name;
  parts[0] = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  for (let i = 1; i < parts.length; i++) {
    parts[i] = parts[i].toLowerCase();
  }
  return parts.join(" ");
}

function formatCommonName(name: string | null): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatEntry(entry: PlantLibraryEntry): PlantLibraryEntry {
  return {
    ...entry,
    species_name: formatBinomial(entry.species_name),
    common_name: formatCommonName(entry.common_name),
  };
}

export default function ExplorePage() {
  const [active, setActive] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<PlantLibraryEntry[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);
  const [guideSheetOpen, setGuideSheetOpen] = useState(false);
  const [onlineSearchStatus, setOnlineSearchStatus] = useState("Searching plant databases...");
  const [onlineSearchFailed, setOnlineSearchFailed] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const autoSearchedQueryRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  // Rotate through status messages while online search is in-flight
  useEffect(() => {
    if (!isSearchingOnline) return;
    let index = 0;
    setOnlineSearchStatus(onlineSearchMessages[0]);
    const interval = setInterval(() => {
      index = (index + 1) % onlineSearchMessages.length;
      setOnlineSearchStatus(onlineSearchMessages[index]);
    }, 1500);
    return () => clearInterval(interval);
  }, [isSearchingOnline]);

  // Determine what query to use (search or category)
  const effectiveQuery = searchQuery.trim() || categorySearchTerms[active] || "";

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Query the plant library
  const { data: libraryResults = [], isLoading: isLibraryLoading } = usePlantLibrarySearch(
    effectiveQuery.length > 1 ? effectiveQuery : ""
  );

  // Query all plants for the popular section
  const { data: allEntries = [], isLoading: isAllLoading } = usePlantLibraryAll();

  // Show loading skeletons when searching
  const isLoading = isLibraryLoading || isSearchingOnline;

  // Determine if we should show "no results" with online search option
  const showOnlineSearch =
    effectiveQuery.length >= 2 &&
    !isLoading &&
    !isLibraryLoading &&
    libraryResults.length === 0 &&
    onlineResults.length === 0;

  const showRetryButton = showOnlineSearch && onlineSearchFailed;

  // Handle search online
  const handleSearchOnline = useCallback(async () => {
    if (!effectiveQuery.trim()) return;

    setIsSearchingOnline(true);
    setOnlineSearchFailed(false);
    try {
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
          body: JSON.stringify({ query: effectiveQuery }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data?.found && data.data) {
        setOnlineResults([data.data]);
        // Invalidate so the new entry is cached for future searches
        queryClient.invalidateQueries({ queryKey: ["plantLibrarySearch"] });
        queryClient.invalidateQueries({ queryKey: ["plantLibraryAll"] });
      } else {
        toast.error("No results found online either");
      }
    } catch (err) {
      setOnlineSearchFailed(true);
      toast.error(
        err instanceof Error ? err.message : "Online search failed. Tap below to retry."
      );
    } finally {
      setIsSearchingOnline(false);
    }
  }, [effectiveQuery, queryClient]);

  // Auto-trigger online search when no local results found
  useEffect(() => {
    if (showOnlineSearch && effectiveQuery !== autoSearchedQueryRef.current) {
      autoSearchedQueryRef.current = effectiveQuery;
      handleSearchOnline();
    }
  }, [showOnlineSearch, effectiveQuery, handleSearchOnline]);

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setOnlineResults([]);
    setOnlineSearchFailed(false);
    autoSearchedQueryRef.current = null;
  };

  // All results to display (library + online)
  const displayResults =
    onlineResults.length > 0 ? onlineResults : libraryResults;

  // Show popular plants when no search/filter active
  const showPopular = effectiveQuery.length < 2 && active === "All";

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Header — search bar + filters sticky */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold mb-3">Explore</h1>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search species or care guides..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setOnlineResults([]);
                setOnlineSearchFailed(false);
                autoSearchedQueryRef.current = null;
              }}
              className="w-full bg-muted rounded-xl pl-10 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0 md:hidden"
            aria-label="Toggle view"
          >
            {view === "grid" ? <List size={18} /> : <Grid3X3 size={18} />}
          </button>
        </div>

        {/* Category chips + Grid/List Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActive(cat);
                  if (cat !== "All") {
                    setSearchQuery("");
                    setOnlineResults([]);
                    setOnlineSearchFailed(false);
                    autoSearchedQueryRef.current = null;
                  }
                }}
                className={active === cat ? "chip-active" : "chip"}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="hidden md:block p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0"
            aria-label="Toggle view"
          >
            {view === "grid" ? <List size={18} /> : <Grid3X3 size={18} />}
          </button>
        </div>
      </div>

      {/* Results section */}
      {effectiveQuery.length >= 2 || active !== "All" ? (
        <>
          <SectionHeader
            title={
              isLoading
                ? "Searching..."
                : displayResults.length > 0
                ? `Results (${displayResults.length})`
                : "Results"
            }
          />

          {isSearchingOnline ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative mb-6">
                <Globe size={56} className="text-primary animate-pulse" />
                <div className="absolute -inset-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-1">
                Searching online...
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-2">
                Looking up &ldquo;{effectiveQuery}&rdquo;
              </p>
              <p className="text-sm text-primary/80 text-center font-medium animate-pulse min-h-[1.25rem]">
                {onlineSearchStatus}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-4">
                This may take a few seconds
              </p>
            </div>
          ) : isLibraryLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-muted" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayResults.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
                {displayResults.map((entry) => (
                  <PlantLibraryCard
                    key={entry.id}
                    entry={formatEntry(entry)}
                    onClick={() => {
                      setSelectedGuideId(entry.id);
                      setGuideSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {displayResults.map((entry) => (
                  <CareGuideCard
                    key={entry.id}
                    entry={formatEntry(entry)}
                    onClick={() => {
                      setSelectedGuideId(entry.id);
                      setGuideSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            )
          ) : showRetryButton ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Globe size={48} className="text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                No results found in our library for &ldquo;{effectiveQuery}&rdquo;. Online search didn&apos;t work.
              </p>
              <button
                onClick={handleSearchOnline}
                className="px-6 py-3 rounded-xl gradient-leaf text-primary-foreground font-semibold shadow-card hover:shadow-elevated transition-shadow"
              >
                Search online again
              </button>
            </div>
          ) : showOnlineSearch ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Globe size={48} className="text-muted-foreground mb-4 animate-pulse" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                No results found in our library for &ldquo;{effectiveQuery}&rdquo;. Searching online automatically...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-sm text-muted-foreground text-center">
                No results found. Try a different search term.
              </p>
            </div>
          )}
        </>
      ) : showPopular ? (
        <>
          {/* Popular Plants - from plant library */}
          <SectionHeader
            title="Popular Plants"
            subtitle="Curated care guides"
          />

          {isAllLoading ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-muted" />
                  <div className="p-2.5 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : allEntries.length > 0 ? (
            view === "grid" ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
                {allEntries.map((entry) => (
                  <PlantLibraryCard
                    key={entry.id}
                    entry={formatEntry(entry)}
                    onClick={() => {
                      setSelectedGuideId(entry.id);
                      setGuideSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {allEntries.map((entry) => (
                  <CareGuideCard
                    key={entry.id}
                    entry={formatEntry(entry)}
                    onClick={() => {
                      setSelectedGuideId(entry.id);
                      setGuideSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-sm text-muted-foreground text-center">
                No plants in library yet. Search for a species to get started!
              </p>
            </div>
          )}


        </>
      ) : null}

      <CareGuideSheet
        entryId={selectedGuideId}
        open={guideSheetOpen}
        onOpenChange={setGuideSheetOpen}
      />
    </div>
  );
}
