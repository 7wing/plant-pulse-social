import { Search, Globe, Grid3X3, List } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import PlantLibraryCard from "@/components/PlantLibraryCard";
import CareGuideCard from "@/components/CareGuideCard";
import { CareGuideSheet } from "@/components/CareGuideSheet";
import { usePlantLibrarySearch, usePlantLibraryAll } from "@/queries/plantLibrary";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

const categories = ["All", "Indoor", "Succulents", "Rare", "Propagation", "Gardening", "Tropical", "Cacti"];

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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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

  // Handle search online
  const handleSearchOnline = async () => {
    if (!effectiveQuery.trim()) return;

    setIsSearchingOnline(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plant-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: effectiveQuery }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search online");
      }

      const data = await response.json();

      if (data && data.result) {
        const result = data.result;
        setOnlineResults([result]);
      } else {
        toast.error("No results found online either");
      }
    } catch (err) {
      // silent failure
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setOnlineResults([]);
  };

  // All results to display (library + online)
  const displayResults =
    onlineResults.length > 0 ? onlineResults : libraryResults;

  // Show popular plants when no search/filter active
  const showPopular = effectiveQuery.length < 2 && active === "All";

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Explore</h1>
        <div className="flex gap-2">
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
      </div>

      {/* Category chips + Grid/List Toggle */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActive(cat);
                if (cat !== "All") {
                  setSearchQuery("");
                  setOnlineResults([]);
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

          {isLoading ? (
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
          ) : showOnlineSearch ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Globe size={48} className="text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center mb-4">
                No results found in our library for "{effectiveQuery}"
              </p>
              <button
                onClick={handleSearchOnline}
                className="px-6 py-3 rounded-xl gradient-leaf text-primary-foreground font-semibold shadow-card hover:shadow-elevated transition-shadow"
              >
                Search online
              </button>
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
