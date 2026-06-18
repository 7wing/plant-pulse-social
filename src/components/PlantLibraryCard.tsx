import { useNavigate } from "react-router-dom";
import { AlertTriangle, Shield } from "lucide-react";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

interface PlantLibraryCardProps {
  entry: PlantLibraryEntry;
  onClick?: () => void;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop";

export default function PlantLibraryCard({ entry, onClick }: PlantLibraryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/care-guide/${entry.id}`);
    }
  };

  return (
    <div
      className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer hover:scale-[1.02]"
      onClick={handleClick}
      data-testid="plant-library-card"
    >
      <div className="relative aspect-square">
        <img
          src={entry.image_url || DEFAULT_IMAGE}
          alt={entry.common_name || entry.species_name || "Plant"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold truncate">
          {entry.species_name || "Unknown species"}
        </p>
        {entry.common_name && (
          <p className="text-xs text-muted-foreground truncate">
            {entry.common_name}
          </p>
        )}
        {entry.difficulty && (
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            {entry.difficulty}
          </p>
        )}
        {entry.toxicity_to_pets && (
          <div
            className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
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
              ? "High"
              : entry.toxicity_to_pets === "moderate"
              ? "Moderate"
              : entry.toxicity_to_pets === "low"
              ? "Low"
              : "Safe"}
          </div>
        )}
      </div>
    </div>
  );
}