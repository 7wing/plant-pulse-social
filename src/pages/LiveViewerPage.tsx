import { ArrowLeft, Heart, Share2, Flag, UserPlus, Eye, Gift, X, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import liveProImg from "@/assets/live-propagation.jpg";

const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";
const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR4 = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

const chatMessages = [
  { user: "PlantDad", text: "Amazing technique! 🌱", avatar: AVATAR4 },
  { user: "GreenThumb", text: "What soil mix do you use?", avatar: AVATAR2 },
  { user: "PlantNewbie", text: "How long until roots show?", avatar: AVATAR3 },
  { user: "MonsteraFan", text: "I tried this last week, it worked!", avatar: AVATAR4 },
  { user: "UrbanJungle", text: "Can you show the node closer?", avatar: AVATAR2 },
];

const reactions = ["❤️", "🌿", "🔥", "😍", "👏", "🌱"];

export default function LiveViewerPage() {
  const navigate = useNavigate();
  const [chatMsg, setChatMsg] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

  const addReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)), 2000);
  };

  return (
    <div className="relative h-screen bg-foreground overflow-hidden">
      {/* Video background */}
      <img src={liveProImg} alt="Live stream" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/30" />

      {/* Floating reactions */}
      <div className="absolute right-4 bottom-40 flex flex-col items-center">
        {floatingReactions.map((r) => (
          <span
            key={r.id}
            className="text-2xl animate-float pointer-events-none"
            style={{ animationDuration: "1.5s" }}
          >
            {r.emoji}
          </span>
        ))}
      </div>

      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Back">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <div className="flex items-center gap-2 bg-foreground/30 backdrop-blur-sm rounded-full pl-1 pr-3 py-1">
            <img src={AVATAR3} alt="Host" className="w-7 h-7 rounded-full object-cover ring-2 ring-plant-live" />
            <div>
              <p className="text-xs font-bold text-primary-foreground">PlantMom_Lisa</p>
              <span className="live-badge text-[10px]">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-foreground/30 backdrop-blur-sm rounded-full px-2.5 py-1.5">
            <Eye size={14} className="text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground">342</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Close">
            <X size={18} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-44 flex flex-col gap-3 z-10">
        <button
          onClick={() => addReaction("❤️")}
          className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="Like"
        >
          <Heart size={20} className="text-primary-foreground" />
        </button>
        <button className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Follow">
          <UserPlus size={20} className="text-primary-foreground" />
        </button>
        <button className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Gift">
          <Gift size={20} className="text-primary-foreground" />
        </button>
        <button className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Share">
          <Share2 size={20} className="text-primary-foreground" />
        </button>
        <button className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Report">
          <Flag size={16} className="text-primary-foreground" />
        </button>
      </div>

      {/* Chat overlay */}
      <div className="absolute bottom-0 left-0 right-16 z-10 px-4 pb-4">
        {/* Chat messages */}
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
          {chatMessages.map((m, i) => (
            <div key={i} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <img src={m.avatar} alt={m.user} className="w-6 h-6 rounded-full object-cover" />
              <div className="bg-foreground/20 backdrop-blur-sm rounded-xl rounded-bl-md px-2.5 py-1.5 max-w-[80%]">
                <span className="text-[10px] font-bold text-primary">{m.user}</span>
                <p className="text-xs text-primary-foreground">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reaction bar */}
        {showReactions && (
          <div className="flex gap-2 mb-2 animate-scale-in">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { addReaction(emoji); setShowReactions(false); }}
                className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-lg hover:scale-110 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Chat input */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-lg"
          >
            🌿
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              placeholder="Say something..."
              className="w-full bg-foreground/20 backdrop-blur-sm rounded-full pl-4 pr-10 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Send">
              <Send size={16} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
