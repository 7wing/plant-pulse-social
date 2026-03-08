import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  avatar: string;
  username: string;
  time: string;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  tags?: string[];
  isSponsored?: boolean;
}

export default function PostCard({
  avatar,
  username,
  time,
  image,
  caption,
  likes,
  comments,
  tags,
  isSponsored,
}: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 p-3">
        <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{username}</p>
          <p className="text-xs text-muted-foreground">{time}</p>
        </div>
        {isSponsored && <span className="sponsored-badge">Sponsored</span>}
      </div>

      <div className="relative aspect-[4/3]">
        <img src={image} alt={caption} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(!liked)} className="transition-transform active:scale-125" aria-label="Like">
              <Heart size={22} className={liked ? "fill-plant-live text-plant-live" : "text-muted-foreground"} />
            </button>
            <button aria-label="Comment">
              <MessageCircle size={22} className="text-muted-foreground" />
            </button>
            <button aria-label="Share">
              <Share2 size={20} className="text-muted-foreground" />
            </button>
          </div>
          <button onClick={() => setSaved(!saved)} aria-label="Save">
            <Bookmark size={22} className={saved ? "fill-primary text-primary" : "text-muted-foreground"} />
          </button>
        </div>
        <p className="text-sm font-semibold">{(liked ? likes + 1 : likes).toLocaleString()} likes</p>
        <p className="text-sm">
          <span className="font-semibold">{username}</span>{" "}
          {caption}
        </p>
        {tags && (
          <p className="text-xs text-primary font-medium">
            {tags.map((t) => `#${t}`).join(" ")}
          </p>
        )}
        <button className="text-xs text-muted-foreground">
          View all {comments} comments
        </button>
      </div>
    </div>
  );
}
