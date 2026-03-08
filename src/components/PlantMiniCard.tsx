import { Droplets, Sun } from "lucide-react";

interface PlantMiniCardProps {
  image: string;
  name: string;
  species: string;
  waterDays: number;
  healthPercent: number;
}

export default function PlantMiniCard({ image, name, species, waterDays, healthPercent }: PlantMiniCardProps) {
  const healthColor = healthPercent > 70 ? "text-plant-success" : healthPercent > 40 ? "text-plant-warning" : "text-plant-live";

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-shadow duration-300 cursor-pointer">
      <div className="relative aspect-square">
        <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute bottom-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className={`text-xs font-bold ${healthColor}`}>{healthPercent}%</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-sm font-bold truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{species}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <Droplets size={12} className="text-primary" />
            <span className="text-xs text-muted-foreground">{waterDays}d</span>
          </div>
          <div className="flex items-center gap-1">
            <Sun size={12} className="text-plant-warning" />
            <span className="text-xs text-muted-foreground">Med</span>
          </div>
        </div>
      </div>
    </div>
  );
}
