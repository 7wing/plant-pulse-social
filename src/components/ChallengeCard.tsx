import { Trophy, Users } from "lucide-react";

interface ChallengeCardProps {
  title: string;
  description: string;
  participants: number;
  daysLeft: number;
  progress: number;
  image: string;
}

export default function ChallengeCard({ title, description, participants, daysLeft, progress, image }: ChallengeCardProps) {
  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden min-w-[280px]">
      <div className="relative h-28">
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 gradient-leaf opacity-60" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-sm font-bold text-primary-foreground">{title}</p>
        </div>
        <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5">
          <span className="text-xs font-bold text-plant-warning">{daysLeft}d left</span>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div className="gradient-leaf h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users size={12} />
            {participants} joined
          </div>
          <button className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity">
            <Trophy size={12} />
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
