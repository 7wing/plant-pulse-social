import { Bell, Droplets, Sun, Scissors, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

import monsteraImg from "@/assets/plant-monstera.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import calatImg from "@/assets/plant-calathea.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

const careItems = [
  { name: "Monstera", task: "Water today", img: monsteraImg, urgent: true, icon: Droplets },
  { name: "Pothos", task: "Fertilize", img: pothosImg, urgent: false, icon: Leaf },
  { name: "Snake Plant", task: "Check soil", img: snakeImg, urgent: false, icon: Droplets },
  { name: "Fiddle Leaf", task: "Rotate", img: fiddleImg, urgent: false, icon: Sun },
  { name: "Calathea", task: "Mist leaves", img: calatImg, urgent: true, icon: Droplets },
  { name: "Echeveria", task: "Prune", img: succulentImg, urgent: false, icon: Scissors },
];

export default function HomePage() {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const completedCount = 2;
  const totalCount = careItems.length;

  return (
    <div className="pb-24 gradient-hero min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
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

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plants, users, tips..."
              className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Search"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary rounded-lg p-1.5" aria-label="Scan plant">
              <Camera size={14} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Daily Progress Summary */}
      <div className="mx-4 mt-2 mb-4 bg-card rounded-2xl shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold">Today's Care 💧</p>
            <p className="text-xs text-muted-foreground">{completedCount} of {totalCount} tasks done</p>
          </div>
          <div className="w-12 h-12 rounded-full border-[3px] border-primary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{Math.round((completedCount / totalCount) * 100)}%</span>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-1">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Care Reminders List */}
      <div className="px-4 space-y-2.5 pb-4">
        {careItems.map((r, i) => {
          const done = i < completedCount;
          const Icon = r.icon;
          return (
            <div
              key={r.name}
              className={`flex items-center gap-3 bg-card rounded-xl p-3 shadow-card transition-opacity ${done ? "opacity-50" : ""}`}
            >
              <img src={r.img} alt={r.name} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${done ? "line-through" : ""}`}>{r.name}</p>
                <div className="flex items-center gap-1">
                  <Icon size={12} className={r.urgent && !done ? "text-primary" : "text-muted-foreground"} />
                  <p className={`text-xs ${r.urgent && !done ? "text-primary font-medium" : "text-muted-foreground"}`}>
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
