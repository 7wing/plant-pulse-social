import { Settings, Edit2, Video, Plus, MapPin, Award, Leaf, MessageCircle, Grid3X3, Users, Play, Moon, Sun as SunIcon, Monitor } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";

import monsteraImg from "@/assets/plant-monstera.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import calatImg from "@/assets/plant-calathea.jpg";
import liveTourImg from "@/assets/live-tour.jpg";
import liveProImg from "@/assets/live-propagation.jpg";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";
const AVATAR4 = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

const profileTabs = [
  { id: "plants", label: "Plants", icon: Grid3X3 },
  { id: "posts", label: "Posts", icon: MessageCircle },
  { id: "connections", label: "Friends", icon: Users },
  { id: "lives", label: "Lives", icon: Play },
];

const badges = [
  { name: "Master Propagator", emoji: "🌱" },
  { name: "Plant Parent 100", emoji: "🏆" },
  { name: "Live Streamer", emoji: "📹" },
  { name: "Rare Collector", emoji: "💎" },
  { name: "Helpful Hand", emoji: "🤝" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("plants");
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="relative gradient-hero">
        <div className="flex items-center justify-between px-4 pt-4">
          <h1 className="text-lg font-bold">Profile</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-9 h-9 bg-card/80 backdrop-blur-sm rounded-full flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="absolute top-14 right-4 z-40 bg-card rounded-2xl shadow-elevated p-4 w-56 animate-scale-in border border-border">
            <p className="text-xs font-bold text-muted-foreground mb-2">Appearance</p>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {([
                { value: "light" as const, icon: SunIcon, label: "Light" },
                { value: "dark" as const, icon: Moon, label: "Dark" },
                { value: "system" as const, icon: Monitor, label: "Auto" },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === value ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Profile info */}
        <div className="flex flex-col items-center pt-4 pb-6 px-4">
          <div className="relative">
            <img src={AVATAR} alt="Sarah Green" className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/30" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 gradient-leaf rounded-full flex items-center justify-center border-2 border-background">
              <Leaf size={14} className="text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-lg font-bold mt-3">Sarah Green</h2>
          <p className="text-sm text-muted-foreground">@sarahgreen</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={12} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Portland, OR</span>
          </div>
          <p className="text-sm text-center mt-2 text-muted-foreground max-w-[250px]">
            🌿 Plant enthusiast | Monstera addict | Propagation lover | Indoor jungle goals
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            {[
              { value: "127", label: "Plants" },
              { value: "2.4k", label: "Followers" },
              { value: "892", label: "Following" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 w-full max-w-[300px]">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
              <Edit2 size={14} />
              Edit Profile
            </button>
            <button className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold">
              <Video size={14} />
              Go Live
            </button>
            <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" aria-label="Add plant">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Award size={14} className="text-primary" />
          <span className="text-xs font-bold">Badges Earned</span>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {badges.map((b) => (
            <div key={b.name} className="flex items-center gap-1.5 bg-card rounded-full px-3 py-1.5 shadow-card min-w-fit border border-border">
              <span className="text-sm">{b.emoji}</span>
              <span className="text-xs font-medium whitespace-nowrap">{b.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile tabs */}
      <div className="px-4">
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
          {profileTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "plants" && (
        <div className="grid grid-cols-3 gap-1 px-4">
          {[monsteraImg, pothosImg, snakeImg, calatImg, succulentImg, fiddleImg, liveTourImg, liveProImg, monsteraImg].map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden">
              <img src={img} alt={`Plant ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ))}
        </div>
      )}

      {activeTab === "posts" && (
        <div className="grid grid-cols-3 gap-1 px-4">
          {[fiddleImg, pothosImg, monsteraImg, succulentImg, calatImg, snakeImg].map((img, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden relative">
              <img src={img} alt={`Post ${i + 1}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-foreground/40 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                <MessageCircle size={10} className="text-primary-foreground" />
                <span className="text-[10px] text-primary-foreground font-medium">{Math.floor(Math.random() * 100) + 10}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "connections" && (
        <div className="grid grid-cols-4 gap-3 px-4">
          {[
            { name: "Mike", avatar: AVATAR2 },
            { name: "Lisa", avatar: AVATAR3 },
            { name: "Carlos", avatar: AVATAR4 },
            { name: "Emma", avatar: AVATAR },
            { name: "Jay", avatar: AVATAR2 },
            { name: "Amy", avatar: AVATAR3 },
            { name: "Tom", avatar: AVATAR4 },
            { name: "Nina", avatar: AVATAR },
          ].map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-1.5">
              <img src={c.avatar} alt={c.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20" />
              <span className="text-xs font-medium">{c.name}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "lives" && (
        <div className="px-4 space-y-3">
          {[
            { title: "Monstera Propagation Demo", views: "1.2k", date: "Mar 5", img: liveProImg },
            { title: "My Indoor Jungle Tour", views: "856", date: "Feb 28", img: liveTourImg },
            { title: "Repotting Session", views: "445", date: "Feb 20", img: fiddleImg },
          ].map((l) => (
            <div key={l.title} className="bg-card rounded-2xl shadow-card overflow-hidden flex">
              <div className="relative w-28 h-20">
                <img src={l.img} alt={l.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Play size={20} className="text-primary-foreground" fill="white" />
                </div>
              </div>
              <div className="flex-1 p-2.5">
                <p className="text-sm font-bold truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.date} • {l.views} views</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
