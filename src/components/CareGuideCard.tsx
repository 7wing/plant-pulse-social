import { useNavigate } from "react-router-dom";
import { Bookmark, Sun, Droplets, Thermometer, AlertTriangle, Shield } from "lucide-react";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";
import { useSavedGuides, useSaveGuide, useUnsaveGuide } from "@/queries/plantLibrary";
import { toast } from "sonner";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop";

interface CareGuideCardProps {
  entry: PlantLibraryEntry;
  onClick?: () => void;
}

export default function CareGuideCard({ entry, onClick }: CareGuideCardProps) {
  const navigate = useNavigate();
  const { data: savedGuides = [] } = useSavedGuides();
  const saveGuide = useSaveGuide();
  const unsaveGuide = useUnsaveGuide();

  const isSaved = savedGuides.some((sg) => sg.plant_library_id === entry.id);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await unsaveGuide.mutateAsync(entry.id);
        toast.success("Removed from saved guides");
      } else {
        await saveGuide.mutateAsync(entry.id);
        toast.success("Saved to your guides");
      }
    } catch {
      toast.error("Failed to update saved guide");
    }
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer group"
      onClick={() => {
        if (onClick) {
          onClick();
        } else {
          navigate(`/care-guide/${entry.id}`);
        }
      }}
    >
      <div className="flex gap-3 p-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={entry.image_url || DEFAULT_IMAGE}
            alt={entry.common_name || entry.species_name || "Plant"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">
                {entry.species_name || "Unknown species"}
              </h3>
              {entry.common_name && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.common_name}
                </p>
              )}
            </div>
            <button
              onClick={handleToggleSave}
              className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={isSaved ? "Unsave guide" : "Save guide"}
            >
              <Bookmark
                size={16}
                className={isSaved ? "fill-primary text-primary" : "text-muted-foreground"}
              />
            </button>
          </div>

          {entry.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {entry.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {entry.light && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sun size={12} />
                <span className="capitalize">{entry.light}</span>
              </div>
            )}
            {entry.water && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Droplets size={12} />
                <span className="capitalize">{entry.water}</span>
              </div>
            )}
            {entry.temperature && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Thermometer size={12} />
                <span>{entry.temperature}</span>
              </div>
            )}
            {entry.toxicity_to_pets && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  entry.toxicity_to_pets === "high"
                    ? "bg-red-100 text-red-700"
                    : entry.toxicity_to_pets === "moderate"
                    ? "bg-orange-100 text-orange-700"
                    : entry.toxicity_to_pets === "low"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {entry.toxicity_to_pets === "high" ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : entry.toxicity_to_pets === "none" ? (
                  <Shield className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {entry.toxicity_to_pets === "high"
                  ? "High toxicity to pets"
                  : entry.toxicity_to_pets === "moderate"
                  ? "Moderate toxicity to pets"
                  : entry.toxicity_to_pets === "low"
                  ? "Low toxicity to pets"
                  : "Safe for pets"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
