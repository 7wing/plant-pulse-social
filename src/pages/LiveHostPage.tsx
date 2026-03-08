import { ArrowLeft, Video, Settings, Users, Clock, Shield, MessageSquare, Wifi, Mic, Camera as CameraIcon, SwitchCamera } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import liveTourImg from "@/assets/live-tour.jpg";

export default function LiveHostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Propagation");

  const categories = ["Propagation", "Plant Tour", "Repotting", "Q&A", "Unboxing", "Care Tips"];

  return (
    <div className="relative h-screen bg-foreground overflow-hidden">
      {/* Camera preview */}
      <img src={liveTourImg} alt="Camera preview" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/40" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Back">
          <ArrowLeft size={18} className="text-primary-foreground" />
        </button>
        <div className="flex gap-2">
          <button className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Settings">
            <Settings size={18} className="text-primary-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Switch camera">
            <SwitchCamera size={18} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        <div className="w-full max-w-[320px] space-y-4">
          {/* Title input */}
          <div>
            <label className="text-xs font-semibold text-primary-foreground/80 mb-1 block">Stream Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monstera Propagation Demo"
              className="w-full bg-foreground/20 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-primary-foreground/80 mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? "gradient-leaf text-primary-foreground"
                      : "bg-foreground/20 text-primary-foreground/70 backdrop-blur-sm"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {[
              { icon: Users, label: "Invite Co-hosts", value: "None" },
              { icon: Shield, label: "Moderation", value: "Auto" },
              { icon: MessageSquare, label: "Chat", value: "Everyone" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between bg-foreground/20 backdrop-blur-sm rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-primary-foreground/70" />
                  <span className="text-sm text-primary-foreground">{label}</span>
                </div>
                <span className="text-xs text-primary-foreground/60">{value} ›</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-8 safe-bottom">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Microphone">
            <Mic size={20} className="text-primary-foreground" />
          </button>
          <button className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Camera toggle">
            <CameraIcon size={20} className="text-primary-foreground" />
          </button>
          <button className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Connection">
            <Wifi size={20} className="text-primary-foreground" />
          </button>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-plant-live rounded-2xl text-primary-foreground font-bold text-sm shadow-elevated">
            <Video size={18} />
            Go Live
          </button>
          <button className="flex items-center justify-center gap-2 px-5 py-3.5 bg-foreground/30 backdrop-blur-sm rounded-2xl text-primary-foreground font-medium text-sm">
            <Clock size={16} />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
