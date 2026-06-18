import { useNavigate } from "react-router-dom";
import { usePlants } from "@/queries/plants";
import { formatNextWater, healthColor } from "@/lib/plantUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets } from "lucide-react";

const PLANT_FALLBACK = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

interface MiniPlantCardProps {
  id: string;
  nickname: string;
  species: string | null;
  imageUrl: string | null;
  nextWaterAt: string | null;
  onClick: () => void;
}

function MiniPlantCard({ nickname, species, imageUrl, nextWaterAt, onClick }: Omit<MiniPlantCardProps, "id" | "onClick">) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full p-2 bg-card rounded-xl shadow-card hover:shadow-elevated transition-shadow text-left"
    >
      <img
        src={imageUrl || PLANT_FALLBACK}
        alt={nickname}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{nickname}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Droplets size={11} className="text-primary" />
          <span className="text-xs text-muted-foreground">{formatNextWater(nextWaterAt)}</span>
        </div>
      </div>
    </button>
  );
}

export default function CollectionPreview() {
  const navigate = useNavigate();
  const { data: plants = [], isLoading } = usePlants();

  const previewPlants = plants.slice(0, 6); // Show max 6 plants

  if (isLoading) {
    return (
      <div className="w-80 bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-card rounded-2xl shadow-card p-4 self-start">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold">My Plants</h3>
        {plants.length > 6 && (
          <button
            onClick={() => navigate("/my-plants")}
            className="text-sm text-primary hover:underline"
          >
            View all →
          </button>
        )}
      </div>

      {previewPlants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">No plants yet</p>
          <button
            onClick={() => navigate("/my-plants")}
            className="text-sm text-primary mt-1 hover:underline"
          >
            Add your first plant
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {previewPlants.map((plant) => (
            <MiniPlantCard
              key={plant.id}
              id={plant.id}
              nickname={plant.nickname}
              species={plant.species}
              imageUrl={plant.image_url}
              nextWaterAt={plant.next_water_at}
              onClick={() => navigate(`/plant/${plant.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}