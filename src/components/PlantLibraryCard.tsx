import { useNavigate } from "react-router-dom";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

interface PlantLibraryCardProps {
  entry: PlantLibraryEntry;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop";

export default function PlantLibraryCard({ entry }: PlantLibraryCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/care-guide/${entry.id}`);
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
      </div>
    </div>
  );
}