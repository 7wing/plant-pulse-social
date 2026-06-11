import { Search, SlidersHorizontal, MapPin, Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import PlantMiniCard from "@/components/PlantMiniCard";
import LiveCard from "@/components/LiveCard";

import PlantScanSheet from "@/components/PlantScanSheet";
import { identifyPlant } from "@/lib/plantnet";
import type { PlantSuggestion } from "@/lib/plantnet";
import { useLiveStreams } from "@/queries/liveStreams";
import { usePlants } from "@/queries/plants";

const categories = ["All", "Indoor", "Succulents", "Rare", "Propagation", "Gardening", "Tropical", "Cacti"];

export default function ExplorePage() {
  const [active, setActive] = useState("All");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<PlantSuggestion[] | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  // Query hooks for real data
  const { data: liveStreams = [] } = useLiveStreams();
  const { data: plants = [] } = usePlants();

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
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Explore</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Plants, communities, challenges..."
              className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center" aria-label="Filters">
            <SlidersHorizontal size={18} className="text-foreground" />
          </button>
          <button className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center" aria-label="Map view">
            <MapPin size={18} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={active === cat ? "chip-active" : "chip"}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Plant ID banner */}
      <div className="mx-4 mb-4 gradient-leaf rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Camera size={24} className="text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-primary-foreground">Identify Any Plant</p>
          <p className="text-xs text-primary-foreground/80">Point your camera and get instant AI identification</p>
        </div>
        <button
          onClick={() => scanInputRef.current?.click()}
          className="px-4 py-2 bg-primary-foreground/20 backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground"
        >
          Scan
        </button>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={scanInputRef}
          onChange={handleScan}
          className="hidden"
        />
      </div>

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
      />

      {/* Live Streams */}
      <SectionHeader title="🔴 Live Now" actionPath="/live" />
      {liveStreams.length === 0 ? (
        <div className="flex gap-3 px-4 pb-2">
          <p className="text-sm text-muted-foreground">No live streams yet. Check back soon!</p>
        </div>
      ) : (
        <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
          {liveStreams.slice(0, 6).map((stream) => (
            <LiveCard
              key={stream.id}
              image={stream.thumbnail_url ?? "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=300&fit=crop"}
              title={stream.title}
              host={stream.profiles?.username ?? stream.profiles?.display_name ?? "Host"}
              hostAvatar={stream.profiles?.avatar_url ?? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"}
              viewers={stream.viewer_count ?? 0}
            />
          ))}
        </div>
      )}

      {/* Plant Directory */}
      <SectionHeader title="Popular Plants 🌿" actionPath="/my-plants" />
      {plants.length === 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
          <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No plants yet. Add your first plant!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
          {plants.slice(0, 10).map((plant) => (
            <PlantMiniCard
              key={plant.id}
              image={plant.image_url ?? "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop"}
              name={plant.nickname ?? plant.name}
              species={plant.species ?? ""}
              waterDays={plant.water_frequency_days ?? 7}
              healthPercent={plant.health_score ?? 80}
            />
          ))}
        </div>
      )}

      {/* Challenges */}
      <SectionHeader title="Challenges 🏆" />
      <div className="flex gap-3 px-4 pb-4">
        <p className="text-sm text-muted-foreground">Challenges coming soon! Join the community to participate.</p>
      </div>
    </div>
  );
}
