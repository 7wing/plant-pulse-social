import { Eye } from "lucide-react";

interface LiveCardProps {
  image: string;
  title: string;
  host: string;
  hostAvatar: string;
  viewers: number;
}

export default function LiveCard({ image, title, host, hostAvatar, viewers }: LiveCardProps) {
  return (
    <div className="relative min-w-[240px] rounded-2xl overflow-hidden shadow-card group cursor-pointer">
      <img src={image} alt={title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
      <div className="absolute top-2 left-2">
        <span className="live-badge">LIVE</span>
      </div>
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-foreground/40 backdrop-blur-sm rounded-full px-2 py-0.5">
        <Eye size={12} className="text-primary-foreground" />
        <span className="text-xs text-primary-foreground font-medium">{viewers}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-bold text-primary-foreground truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <img src={hostAvatar} alt={host} className="w-5 h-5 rounded-full object-cover" />
          <span className="text-xs text-primary-foreground/80">{host}</span>
        </div>
      </div>
    </div>
  );
}
