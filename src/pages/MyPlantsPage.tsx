import { toast } from "sonner";
import { Plus, Camera, Search, Grid3X3, List, Droplets, Sun, Scissors, Calendar, BookOpen, Loader2, Leaf, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePlants, useAddPlant } from "@/queries/plants";
import { useAllCareLogs } from "@/queries/careLogs";
import type { Plant, PlantInsert } from "@/queries/plants";
import { useUpload } from "@/hooks/useUpload";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNextWater, healthColor, healthBg } from "@/lib/plantUtils";

const plantSchema = z.object({
  nickname: z.string().min(1, "Nickname is required").max(50),
  species: z.string().optional(),
  scientific_name: z.string().optional(),
  water_frequency_days: z.coerce.number().min(1).max(90).optional(),
  light_requirement: z.string().optional(),
  notes: z.string().optional(),
});

type PlantForm = z.infer<typeof plantSchema>;

const PLANT_FALLBACK = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

const isWaterToday = (plant: Plant) => formatNextWater(plant.next_water_at) === "Today";

const tabs = [
  { id: "collection", label: "Collection", icon: Grid3X3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "journal", label: "Journal", icon: BookOpen },
];

export default function MyPlantsPage() {
  const { data: plants = [], isLoading } = usePlants();
  const addPlantMutation = useAddPlant();
  const { uploadFile, uploading } = useUpload();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("collection");
  const [addOpen, setAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter plants by search query (nickname or species)
  const filteredPlants = searchQuery.trim()
    ? plants.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
          p.nickname.toLowerCase().includes(query) ||
          (p.species && p.species.toLowerCase().includes(query)) ||
          (p.scientific_name && p.scientific_name.toLowerCase().includes(query))
        );
      })
    : plants;

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PlantForm>({
    resolver: zodResolver(plantSchema),
  });

  const onSubmit = async (data: PlantForm) => {
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        const result = await uploadFile(selectedImage, { bucket: "plant-images" });
        imageUrl = result.url;
      }
      const payload: Omit<PlantInsert, "owner_id"> = {
        nickname: data.nickname,
        species: data.species,
        scientific_name: data.scientific_name,
        water_frequency_days: data.water_frequency_days,
        light_requirement: data.light_requirement,
        notes: data.notes,
        image_url: imageUrl,
      };
      await addPlantMutation.mutateAsync(payload);
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      setAddOpen(false);
    } catch {
      // error is handled by addPlantMutation state
    }
  };



  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">My Plants</h1>
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

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 px-4 py-3">
        {[
          { label: "Plants", value: filteredPlants.length, icon: "🌿" },
          { label: "Healthy", value: filteredPlants.filter((p) => (p.health_percent ?? 100) > 70).length, icon: "💚" },
          { label: "Need Care", value: filteredPlants.filter((p) => isWaterToday(p)).length, icon: "💧" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-card rounded-xl p-3 shadow-card text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {activeTab === "collection" && (
        <>
          {/* Add plant */}
          <div className="px-4 mb-3">
            <button
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl shadow-card border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl gradient-leaf flex items-center justify-center">
                <Plus size={24} className="text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">Add New Plant</p>
                <p className="text-xs text-muted-foreground">Scan with camera or add manually</p>
              </div>
              <Camera size={20} className="text-primary" />
            </button>
          </div>

          {/* Plant grid/list */}
          {isLoading ? (
            <div className={view === "grid" ? "grid grid-cols-2 gap-3 px-4 pb-4" : "px-4 space-y-2 pb-4"}>
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
              <p className="text-sm text-muted-foreground mt-1">{searchQuery ? "No plants match your search." : "Tap + to add your first plant!"}</p>
            </div>
          ) : searchQuery && filteredPlants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <p className="text-base font-semibold">No results found</p>
              <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-4">
              {filteredPlants.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow">
                  <div className="relative aspect-square">
                    <img src={p.image_url || PLANT_FALLBACK} alt={p.nickname} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${healthBg(p.health_percent ?? 100)}`} />
                      <span className={`text-xs font-bold ${healthColor(p.health_percent ?? 100)}`}>{p.health_percent ?? 100}%</span>
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
                <div key={p.id} className="bg-card rounded-2xl shadow-card p-3 flex items-center gap-3 animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow">
                  <img src={p.image_url || PLANT_FALLBACK} alt={p.nickname} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.nickname}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Droplets size={11} className="text-primary" />
                        <span className="text-xs text-muted-foreground">{formatNextWater(p.next_water_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sun size={11} className="text-plant-warning" />
                        <span className="text-xs text-muted-foreground">{p.light_requirement || "Not set"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="16" fill="none"
                          className={(p.health_percent ?? 100) > 70 ? "stroke-plant-success" : (p.health_percent ?? 100) > 40 ? "stroke-plant-warning" : "stroke-plant-live"}
                          strokeWidth="3"
                          strokeDasharray={`${((p.health_percent ?? 100) / 100) * 100.5} 100.5`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${healthColor(p.health_percent ?? 100)}`}>{p.health_percent ?? 100}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "calendar" && (
        <CalendarTab />
      )}

      {activeTab === "journal" && (
        <div className="px-4 py-6 space-y-3">
          {[
            { date: "Mar 6", plant: "Monty", note: "New leaf unfurling! 🌿 Moved to brighter spot." },
            { date: "Mar 3", plant: "Rosa", note: "Leaves curling — adjusted humidity. Misting daily now." },
            { date: "Feb 28", plant: "Goldie", note: "Started water propagation with 3 cuttings." },
          ].map((entry) => (
            <div key={entry.date} className="bg-card rounded-2xl shadow-card p-3 flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                <Leaf size={24} className="text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{entry.plant}</p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Plant Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Add Plant</SheetTitle>
            <SheetDescription>Add a new plant to your collection</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {addPlantMutation.isError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                Failed to add plant. Please try again.
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Plant Photo</Label>
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:bg-muted transition-colors">
                  <Camera size={24} className="text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Tap to add a photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) {
                        toast.error("Please select a valid image file (JPEG, PNG, etc.)");
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("Image must be smaller than 5 MB");
                        return;
                      }
                      setSelectedImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }}
                  />
                </label>
              )}
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname <span className="text-destructive">*</span></Label>
              <Input
                id="nickname"
                placeholder="e.g. Monty the Monstera"
                {...register("nickname")}
              />
              {errors.nickname && (
                <p className="text-xs text-destructive">{errors.nickname.message}</p>
              )}
            </div>

            {/* Species */}
            <div className="space-y-2">
              <Label htmlFor="species">Species</Label>
              <Input id="species" placeholder="e.g. Monstera deliciosa" {...register("species")} />
              {errors.species && (
                <p className="text-xs text-destructive">{errors.species.message}</p>
              )}
            </div>

            {/* Scientific Name */}
            <div className="space-y-2">
              <Label htmlFor="scientific_name">Scientific Name</Label>
              <Input
                id="scientific_name"
                placeholder="e.g. Monstera deliciosa"
                {...register("scientific_name")}
              />
              {errors.scientific_name && (
                <p className="text-xs text-destructive">{errors.scientific_name.message}</p>
              )}
            </div>

            {/* Water Frequency */}
            <div className="space-y-2">
              <Label htmlFor="water_frequency_days">Water Every (days)</Label>
              <Input
                id="water_frequency_days"
                type="number"
                min={1}
                max={90}
                placeholder="e.g. 7"
                {...register("water_frequency_days")}
              />
              {errors.water_frequency_days && (
                <p className="text-xs text-destructive">{errors.water_frequency_days.message}</p>
              )}
            </div>

            {/* Light Requirement */}
            <div className="space-y-2">
              <Label htmlFor="light_requirement">Light Requirement</Label>
              <Input
                id="light_requirement"
                placeholder="e.g. Bright indirect"
                {...register("light_requirement")}
              />
              {errors.light_requirement && (
                <p className="text-xs text-destructive">{errors.light_requirement.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                placeholder="Any care notes..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  reset();
                  setAddOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-leaf text-primary-foreground hover:opacity-90"
                disabled={isSubmitting || addPlantMutation.isPending || uploading}
              >
                {(isSubmitting || addPlantMutation.isPending || uploading) ? (
                  <><Loader2 size={16} className="animate-spin" /> Adding...</>
                ) : (
                  "Add Plant"
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// CalendarTab component - fetches and displays real care logs
function CalendarTab() {
  const { data: careLogs = [], isLoading } = useAllCareLogs();

  // Group care logs by day of week (0 = Sunday, 1 = Monday, etc.)
  const getDayIndex = (dateStr: string | null) => {
    if (!dateStr) return 0;
    return new Date(dateStr).getDay();
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group logs by day of week
  const logsByDay = dayNames.map((_, dayIndex) =>
    careLogs.filter((log) => getDayIndex(log.logged_at) === dayIndex)
  );

  // Get icon and color based on care type
  const getCareBadge = (careType: string) => {
    const type = careType.toLowerCase();
    if (type === "water" || type === "watered") {
      return { icon: Droplets, bgClass: "bg-primary/10", textClass: "text-primary", label: "Water" };
    }
    if (type === "fertilize" || type === "fertilized") {
      return { icon: Sun, bgClass: "bg-plant-warning/10", textClass: "text-plant-warning", label: "Fertilize" };
    }
    if (type === "prune" || type === "pruned" || type === "trim") {
      return { icon: Scissors, bgClass: "bg-plant-lime/10", textClass: "text-plant-lime", label: "Prune" };
    }
    if (type === "repot" || type === "repotted") {
      return { icon: Leaf, bgClass: "bg-plant-success/10", textClass: "text-plant-success", label: "Repot" };
    }
    // Default case
    return { icon: Leaf, bgClass: "bg-muted", textClass: "text-muted-foreground", label: careType };
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          {dayNames.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="flex-1 h-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
        <h3 className="text-base font-bold">Care Calendar</h3>
        {dayNames.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No care logs yet</p>
          </div>
        ) : (
          dayNames.map((day, dayIndex) => {
            const dayLogs = logsByDay[dayIndex];
            return (
              <div key={day} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  dayLogs.length > 0 ? "gradient-leaf text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {day}
                </div>
                <div className="flex-1 flex gap-2 flex-wrap">
                  {dayLogs.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">No activities</span>
                  ) : (
                    dayLogs.slice(0, 3).map((log) => {
                      const badge = getCareBadge(log.care_type);
                      const Icon = badge.icon;
                      return (
                        <div
                          key={log.id}
                          className={`flex items-center gap-1 rounded-full px-2 py-1 ${badge.bgClass}`}
                        >
                          <Icon size={10} className={badge.textClass} />
                          <span className={`text-xs font-medium ${badge.textClass}`}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                  {dayLogs.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayLogs.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        {careLogs.length === 0 && (
          <div className="text-center py-4 border-t border-border">
            <Leaf size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Log care activities on your plants to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
