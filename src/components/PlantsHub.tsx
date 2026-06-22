import type { ReactNode } from "react";
import { Search, Grid3X3, List, Droplets, Leaf, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/queries/plants";
import type { Plant } from "@/queries/plants";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNextWater } from "@/lib/plantUtils";

const PLANT_FALLBACK = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

const isWaterToday = (plant: Plant) => formatNextWater(plant.next_water_at) === "Today";

export default function PlantsHub() {
  const { data: plants = [], isLoading } = usePlants();
  const navigate = useNavigate();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlants = (searchQuery.trim()
    ? plants.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.nickname.toLowerCase().includes(query) ||
          (p.species && p.species.toLowerCase().includes(query)) ||
          (p.scientific_name && p.scientific_name.toLowerCase().includes(query))
        );
      })
    : plants
  ).sort((a, b) => a.nickname.localeCompare(b.nickname));

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center md:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold">My Collection</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "grid" ? "list" : "grid")}
              className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center"
              aria-label="Toggle view"
            >
              {view === "grid" ? <List size={18} /> : <Grid3X3 size={18} />}
            </button>
          </div>
        </div>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your plants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Plant grid/list */}
      {isLoading ? (
        <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 pb-4" : "px-4 max-w-3xl mx-auto space-y-2 pb-4"}>
          {[1, 2, 3, 4].map((i) =>
            view === "grid" ? (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-2.5 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ) : (
              <div key={i} className="bg-card rounded-2xl shadow-card p-3 flex items-center gap-3">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="w-10 h-10 rounded-full" />
              </div>
            )
          )}
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Leaf size={32} className="text-muted-foreground" />
          </div>
          <p className="text-base font-semibold">No plants yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? "No plants match your search." : "Tap + to add your first plant!"}
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 px-4 pb-4">
          {filteredPlants.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow"
              onClick={() => navigate(`/plant/${p.id}`)}
            >
              <div className="relative aspect-square">
                <img src={p.image_url || PLANT_FALLBACK} alt={p.nickname} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                  <span className="text-xs font-bold">{p.health_percent ?? 100}%</span>
                </div>
                {isWaterToday(p) && (
                  <div className="absolute top-2 left-2 bg-primary rounded-full p-1.5 animate-pulse-soft">
                    <Droplets size={12} className="text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-sm font-bold truncate">{p.nickname}</p>
                <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Droplets size={11} className="text-primary" />
                  <span className="text-xs text-muted-foreground">{formatNextWater(p.next_water_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 max-w-3xl mx-auto space-y-2 pb-4">
          {filteredPlants.map((p) => (
            <div
              key={p.id}
              className="bg-card rounded-2xl shadow-card p-3 flex items-center gap-3 animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow"
              onClick={() => navigate(`/plant/${p.id}`)}
            >
              <img src={p.image_url || PLANT_FALLBACK} alt={p.nickname} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{p.nickname}</p>
                <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <Droplets size={11} className="text-primary" />
                    <span className="text-xs text-muted-foreground">{formatNextWater(p.next_water_at)}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm font-bold">{p.health_percent ?? 100}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
