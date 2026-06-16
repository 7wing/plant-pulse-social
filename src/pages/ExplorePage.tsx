import { Search, Globe } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import PlantLibraryCard from "@/components/PlantLibraryCard";
import PlantScanSheet from "@/components/PlantScanSheet";
import { identifyPlant } from "@/lib/plantnet";
import type { PlantSuggestion } from "@/lib/plantnet";
import { usePlantLibrarySearch } from "@/queries/plantLibrary";
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

export default function ExplorePage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<PlantSuggestion[] | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<PlantLibraryEntry[]>([]);
  const scanInputRef = useRef<HTMLInputElement>(null);
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

  // Show loading skeletons when searching
  const isLoading = isLibraryLoading || isSearchingOnline;

  // Determine if we should show "no results" with online search option
  const showOnlineSearch =
    effectiveQuery.length >= 2 &&
    !isLoading &&
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

        // Invalidate the library query to refetch
        // The queryClient will be invalidated via react-query
        // For now, the results are shown directly
      } else {
        toast.error("No results found online either");
      }
    } catch (err) {
      toast.error("Failed to search online. Please try again.");
      console.error(err);
    } finally {
      setIsSearchingOnline(false);
    }
  };

  // Handle scan
  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanError(null);
    setScanOpen(true);
    try {
      const results = await identifyPlant(file);
      setScanResults(results);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Identification failed");
      toast.error("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
    e.target.value = "";
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
    <div className="pb-20 md:pb-4 min-h-screen">
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
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
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
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
              {displayResults.map((entry) => (
                <PlantLibraryCard key={entry.id} entry={entry} />
              ))}
            </div>
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
            title="Popular Plants 🌿"
            subtitle="Curated care guides"
          />

          {isLibraryLoading ? (
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
          ) : libraryResults.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
              {libraryResults.slice(0, 12).map((entry) => (
                <PlantLibraryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-sm text-muted-foreground text-center">
                No plants in library yet. Search for a species to get started!
              </p>
            </div>
          )}

          {/* Quick start: scan to identify */}
          <div className="mx-4 mt-4 p-4 bg-muted/50 rounded-2xl">
            <p className="text-sm text-muted-foreground text-center">
              Have a plant you want to learn about?{" "}
              <button
                onClick={() => scanInputRef.current?.click()}
                className="text-primary font-semibold hover:underline"
              >
                Scan to identify
              </button>
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={scanInputRef}
              onChange={handleScan}
              className="hidden"
            />
          </div>
        </>
      ) : null}

      {/* Plant Scan Sheet */}
      <PlantScanSheet
        open={scanOpen}
        onOpenChange={(open) => {
          setScanOpen(open);
          if (!open) {
            setScanResults(null);
            setScanError(null);
          }
        }}
        results={scanResults}
        loading={scanning}
        onViewGuide={(speciesName) => {
          setScanOpen(false);
          setSearchQuery(speciesName);
        }}
      />
    </div>
  );
}