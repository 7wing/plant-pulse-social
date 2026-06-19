import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Plus,
  Loader2,
  Sun,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import { usePlantLibraryEntry, useSavedGuides, useSaveGuide, useUnsaveGuide } from "@/queries/plantLibrary";
import { getToxicityDisplay } from "@/lib/plantLibraryUtils";
import { useAddPlant } from "@/queries/plants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop";

export default function CareGuideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [waterEnabled, setWaterEnabled] = useState(true);
  const [waterDays, setWaterDays] = useState("7");
  const [fertilizeEnabled, setFertilizeEnabled] = useState(false);
  const [fertilizeDays, setFertilizeDays] = useState("30");

  // Fetch plant library entry
  const { data: entry, isLoading, error } = usePlantLibraryEntry(id);

  // Fetch saved guides to check if this one is saved
  const { data: savedGuides = [] } = useSavedGuides();
  const isSaved = savedGuides.some((sg) => sg.plant_library_id === id);

  // Mutations
  const saveGuide = useSaveGuide();
  const unsaveGuide = useUnsaveGuide();
  const addPlant = useAddPlant();

  // Set initial values when entry loads
  useState(() => {
    if (entry) {
      setNickname(entry.common_name || entry.species_name || "");
    }
  });

  // Handle save/unsave toggle
  const handleToggleSave = async () => {
    if (!id) return;

    try {
      if (isSaved) {
        await unsaveGuide.mutateAsync(id);
        toast.success("Guide unsaved");
      } else {
        await saveGuide.mutateAsync(id);
        toast.success("Guide saved");
      }
    } catch (err) {
      toast.error("Failed to update saved guide");
    }
  };

  // Handle add to collection
  const handleAddToCollection = () => {
    if (entry) {
      setNickname(entry.common_name || entry.species_name || "");
      setShowAddSheet(true);
    }
  };

  // Handle submit new plant
  const handleSubmitPlant = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    try {
      await addPlant.mutateAsync({
        nickname: nickname.trim(),
        species: entry?.species_name || null,
        scientific_name: entry?.species_name || null,
        image_url: entry?.image_url || null,
        water_frequency_days: waterEnabled ? parseInt(waterDays, 10) : null,
        light_requirement: entry?.light || null,
      });

      toast.success("Plant added to your collection!");
      setShowAddSheet(false);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      navigate("/my-plants");
    } catch (err) {
      toast.error("Failed to add plant");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <div className="h-72 bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-card rounded-2xl shadow-elevated p-5 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
            <div className="pt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <p className="text-muted-foreground">Failed to load care guide</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  const CareInfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: typeof Sun;
    label: string;
    value: string | null;
  }) => (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <Icon size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">
          {value && value.trim() ? value : "Care info not available yet"}
        </p>
      </div>
    </div>
  );



  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Hero image */}
        <div className="relative h-72">
          <img
            src={entry.image_url || DEFAULT_IMAGE}
            alt={entry.common_name || entry.species_name || "Plant"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_IMAGE;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/20" />

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-primary-foreground" />
            </button>
            <button
              onClick={handleToggleSave}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <BookmarkCheck size={20} className="text-plant-lime" />
              ) : (
                <Bookmark size={20} className="text-primary-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Plant info */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-card rounded-2xl shadow-elevated p-5 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">
                {entry.species_name || "Unknown species"}
              </h1>
              {entry.common_name && (
                <p className="text-sm text-muted-foreground mt-1">
                  Common name: {entry.common_name}
                </p>
              )}
            </div>

            {/* Care info */}
            <div className="space-y-3 pt-2">
              <CareInfoRow
                icon={Sun}
                label="Light"
                value={entry.light}
              />
              <CareInfoRow
                icon={Droplets}
                label="Water"
                value={entry.water}
              />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    ⭐
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-medium capitalize">
                    {entry.difficulty && entry.difficulty.trim() ? entry.difficulty : "Care info not available yet"}
                  </p>
                </div>
              </div>
              <CareInfoRow
                icon={AlertTriangle}
                label="Toxicity"
                value={getToxicityDisplay(entry)}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        {entry.description && (
          <div className="px-4 mt-4">
            <div className="bg-card rounded-2xl p-5">
              <h2 className="text-base font-bold mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
            </div>
          </div>
        )}

        {/* Add to collection button */}
        <div className="px-4 mt-6">
          <Button
            onClick={handleAddToCollection}
            className="w-full gradient-leaf text-primary-foreground shadow-card"
            size="lg"
          >
            <Plus size={18} className="mr-2" />
            Add to my collection
          </Button>
        </div>
      </div>

      {/* Desktop Layout (md+) */}
      <div className="hidden md:block">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <Button
              onClick={handleToggleSave}
              variant="outline"
              className={isSaved ? "border-plant-lime text-plant-lime" : ""}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck size={16} className="mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark size={16} className="mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>

          {/* Main content - two columns */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left: Photo */}
            <div className="rounded-2xl overflow-hidden bg-muted aspect-square">
              <img
                src={entry.image_url || DEFAULT_IMAGE}
                alt={entry.common_name || entry.species_name || "Plant"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold mb-1">
                {entry.species_name || "Unknown species"}
              </h1>
              {entry.common_name && (
                <p className="text-lg text-muted-foreground mb-6">
                  Common name: {entry.common_name}
                </p>
              )}

              {/* Care info */}
              <div className="space-y-4">
                <CareInfoRow icon={Sun} label="Light" value={entry.light} />
                <CareInfoRow icon={Droplets} label="Water" value={entry.water} />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xs font-bold text-muted-foreground">
                      ⭐
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <p className="text-sm font-medium capitalize">
                      {entry.difficulty && entry.difficulty.trim() ? entry.difficulty : "Care info not available yet"}
                    </p>
                  </div>
                </div>
                <CareInfoRow
                  icon={AlertTriangle}
                  label="Toxicity"
                  value={getToxicityDisplay(entry)}
                />
              </div>
            </div>
          </div>

          {/* Description - full width */}
          {entry.description && (
            <div className="bg-card rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold mb-3">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {entry.description}
              </p>
            </div>
          )}

          {/* Add to collection button */}
          <Button
            onClick={handleAddToCollection}
            className="w-full md:w-auto gradient-leaf text-primary-foreground shadow-card"
            size="lg"
          >
            <Plus size={18} className="mr-2" />
            Add to my collection
          </Button>
        </div>
      </div>

      {/* Add Plant Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile ? "rounded-t-3xl" : "w-full sm:max-w-md"}
        >
          <SheetHeader>
            <SheetTitle>Add to your collection</SheetTitle>
            <SheetDescription>
              Create a new plant in your collection based on this care guide
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Plant preview */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
              <img
                src={entry.image_url || DEFAULT_IMAGE}
                alt={entry.species_name || "Plant"}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {entry.species_name}
                </p>
                {entry.common_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.common_name}
                  </p>
                )}
              </div>
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="e.g. My Monstera"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g. Living room"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Care schedule */}
            <div className="space-y-3 pt-2">
              <Label>Care schedule</Label>

              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={waterEnabled}
                    onCheckedChange={(checked) =>
                      setWaterEnabled(!!checked)
                    }
                  />
                  <span className="text-sm">Water</span>
                </label>
                {waterEnabled && (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-sm text-muted-foreground">
                      Every
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={waterDays}
                      onChange={(e) => setWaterDays(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <Checkbox
                    checked={fertilizeEnabled}
                    onCheckedChange={(checked) =>
                      setFertilizeEnabled(!!checked)
                    }
                  />
                  <span className="text-sm">Fertilize</span>
                </label>
                {fertilizeEnabled && (
                  <div className="flex items-center gap-2 pl-7">
                    <span className="text-sm text-muted-foreground">
                      Every
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={fertilizeDays}
                      onChange={(e) => setFertilizeDays(e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAddSheet(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 gradient-leaf text-primary-foreground"
                onClick={handleSubmitPlant}
                disabled={addPlant.isPending}
              >
                {addPlant.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}