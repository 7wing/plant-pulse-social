import { ArrowLeft, Heart, Share2, Bookmark, Droplets, Sun, Thermometer, Wind, MessageCircle, HelpCircle, Camera } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import monsteraImg from "@/assets/plant-monstera.jpg";

const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";

const careGuide = [
  { icon: Droplets, label: "Water", value: "Every 1-2 weeks", detail: "Allow soil to dry between waterings", color: "text-primary" },
  { icon: Sun, label: "Light", value: "Bright indirect", detail: "Tolerates medium light", color: "text-plant-warning" },
  { icon: Thermometer, label: "Temperature", value: "65-85°F", detail: "Keep above 60°F", color: "text-plant-live" },
  { icon: Wind, label: "Humidity", value: "60-80%", detail: "Loves high humidity", color: "text-plant-sponsored" },
];

const comments = [
  { user: "PlantMom_Lisa", avatar: AVATAR3, text: "Mine started getting yellow leaves, any tips?", time: "2h ago", likes: 12 },
  { user: "UrbanJungle_Mike", avatar: AVATAR2, text: "Looking healthy! What's your soil mix?", time: "4h ago", likes: 8 },
];

export default function PlantDetailPage() {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero image */}
      <div className="relative h-72">
        <img src={monsteraImg} alt="Monstera deliciosa" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/20" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Back">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <div className="flex gap-2">
            <button onClick={() => setLiked(!liked)} className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Like">
              <Heart size={18} className={liked ? "fill-plant-live text-plant-live" : "text-primary-foreground"} />
            </button>
            <button onClick={() => setSaved(!saved)} className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Save">
              <Bookmark size={18} className={saved ? "fill-primary text-primary" : "text-primary-foreground"} />
            </button>
            <button className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center" aria-label="Share">
              <Share2 size={18} className="text-primary-foreground" />
            </button>
          </div>
        </div>
        {/* AI scan badge */}
        <div className="absolute bottom-4 right-4">
          <button className="flex items-center gap-1.5 bg-primary rounded-full px-3 py-2 shadow-fab">
            <Camera size={14} className="text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground">AI Scan</span>
          </button>
        </div>
      </div>

      {/* Plant info */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl shadow-elevated p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">Monstera Deliciosa</h1>
              <p className="text-sm text-muted-foreground italic">Monstera deliciosa</p>
              <p className="text-xs text-primary font-medium mt-1">Swiss Cheese Plant • Araceae</p>
            </div>
            <div className="bg-plant-success/10 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-plant-success">92%</p>
              <p className="text-[10px] text-plant-success font-medium">Healthy</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            Known for its iconic split leaves, the Monstera deliciosa is a tropical beauty native to Central America. Easy to care for and a stunning statement piece in any space.
          </p>
        </div>
      </div>

      {/* Care Guide */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold mb-3">Care Guide</h2>
        <div className="grid grid-cols-2 gap-2">
          {careGuide.map(({ icon: Icon, label, value, detail, color }) => (
            <div key={label} className="bg-card rounded-xl shadow-card p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={16} className={color} />
                <span className="text-xs font-bold">{label}</span>
              </div>
              <p className="text-sm font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold mb-3">Growth Timeline</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {["Week 1", "Week 4", "Week 8", "Now"].map((label, i) => (
            <div key={label} className="min-w-[100px] text-center">
              <div className={`aspect-square rounded-xl overflow-hidden ${i === 3 ? "ring-2 ring-primary" : ""}`}>
                <img src={monsteraImg} alt={`${label} growth`} className="w-full h-full object-cover" style={{ filter: i < 2 ? `brightness(${0.7 + i * 0.1}) saturate(${0.5 + i * 0.2})` : "none" }} />
              </div>
              <p className="text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ask Community */}
      <div className="px-4 mt-4">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-2xl text-primary font-semibold text-sm">
          <HelpCircle size={16} />
          Ask Community About This Plant
        </button>
      </div>

      {/* Comments */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Discussion</h2>
          <span className="text-xs text-muted-foreground">24 comments</span>
        </div>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.user} className="flex gap-2.5">
              <img src={c.avatar} alt={c.user} className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 bg-card rounded-xl rounded-tl-md p-3 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{c.user}</span>
                  <span className="text-[10px] text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.text}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart size={12} /> {c.likes}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageCircle size={12} /> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
