import { Bell, Droplets, Sun, Scissors, Leaf, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlants } from "@/queries/plants";
import { Skeleton } from "@/components/ui/skeleton";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const FALLBACK_PLANT_IMAGE = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400&h=400&fit=crop";

function getTaskInfo(nextWaterAt: string | null) {
  if (!nextWaterAt) return { text: "Not scheduled", urgent: false };
  const next = new Date(nextWaterAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextDay = new Date(next);
  nextDay.setHours(0, 0, 0, 0);
  const diffMs = nextDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { text: "Water today", urgent: true };
  if (diffDays === 1) return { text: "Water tomorrow", urgent: false };
  return { text: `Water in ${diffDays} days`, urgent: false };
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: plants = [], isLoading } = usePlants();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const careTasks = plants.map((plant) => {
    const taskInfo = getTaskInfo(plant.next_water_at);
    return {
      id: plant.id,
      name: plant.nickname,
      task: taskInfo.text,
      img: plant.image_url || FALLBACK_PLANT_IMAGE,
      urgent: taskInfo.urgent,
      icon: Droplets,
    };
  });

  const totalCount = careTasks.length;
  const urgentCount = careTasks.filter((t) => t.urgent).length;
  // Consider non-urgent tasks as "completed" for the progress ring
  const completedCount = totalCount - urgentCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="pb-24 gradient-hero min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/profile")}>
            <img src={AVATAR} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />
            <div>
              <p className="text-xs text-muted-foreground">{greeting} 🌿</p>
              <p className="text-sm font-bold">Sarah Green</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative" aria-label="Notifications">
              <Bell size={20} className="text-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-plant-live rounded-full border-2 border-background" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Progress Summary */}
      <div className="mx-4 mt-2 mb-4 bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold">Today's Care 💧</p>
            <p className="text-xs text-muted-foreground">{urgentCount} of {totalCount} plants need water</p>
          </div>
          <div className="w-12 h-12 rounded-full border-[3px] border-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{progressPercent}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-1">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Care Reminders List */}
      {isLoading ? (
        <div className="px-4 space-y-2.5 pb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-9 h-9 rounded-full" />
            </div>
          ))}
        </div>
      ) : totalCount === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No plants yet. Add your first plant to see care reminders!</p>
          <button
            onClick={() => navigate("/my-plants")}
            className="mt-3 text-primary font-medium text-sm hover:underline"
          >
            Go to My Plants →
          </button>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
          {careTasks.map((r, i) => {
            const done = !r.urgent;
            const Icon = r.icon;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 bg-card rounded-xl p-3 shadow-card transition-opacity ${done ? "opacity-50" : ""}`}
              >
                <img src={r.img} alt={r.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${done ? "line-through" : ""}`}>{r.name}</p>
                  <div className="flex items-center gap-1">
                    <Icon size={12} className={r.urgent ? "text-primary" : "text-muted-foreground"} />
                    <p className={`text-xs ${r.urgent ? "text-primary font-medium" : "text-muted-foreground"}`}>
                      {r.task}
                    </p>
                  </div>
                </div>
                <button
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    done ? "bg-primary/20" : "bg-primary/10 hover:bg-primary/20"
                  }`}
                  aria-label={done ? `${r.task} completed` : `Mark ${r.task} as done`}
                >
                  {done ? (
                    <span className="text-primary text-sm">✓</span>
                  ) : (
                    <Icon size={16} className="text-primary" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      <div className="mx-4 mb-4 gradient-leaf rounded-2xl p-4">
        <p className="text-sm font-bold text-primary-foreground mb-1">🌱 Daily Tip</p>
        <p className="text-xs text-primary-foreground/90">
          Overwatering is the #1 killer of houseplants. Always check the top inch of soil before watering — if it's still moist, wait another day!
        </p>
      </div>
    </div>
  );
}
