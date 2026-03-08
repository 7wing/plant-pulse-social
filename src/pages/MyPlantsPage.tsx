import { Plus, Camera, Search, Grid3X3, List, Droplets, Sun, Scissors, Calendar, BookOpen } from "lucide-react";
import { useState } from "react";

import monsteraImg from "@/assets/plant-monstera.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import calatImg from "@/assets/plant-calathea.jpg";

interface UserPlant {
  id: number;
  name: string;
  species: string;
  image: string;
  health: number;
  nextWater: string;
  light: string;
  lastUpdate: string;
}

const plants: UserPlant[] = [
  { id: 1, name: "Monty", species: "Monstera deliciosa", image: monsteraImg, health: 92, nextWater: "Today", light: "Bright indirect", lastUpdate: "2 days ago" },
  { id: 2, name: "Goldie", species: "Epipremnum aureum", image: pothosImg, health: 88, nextWater: "Tomorrow", light: "Low-Medium", lastUpdate: "1 day ago" },
  { id: 3, name: "Sandy", species: "Sansevieria trifasciata", image: snakeImg, health: 96, nextWater: "In 5 days", light: "Any", lastUpdate: "5 days ago" },
  { id: 4, name: "Rosa", species: "Calathea ornata", image: calatImg, health: 74, nextWater: "Today", light: "Medium indirect", lastUpdate: "3 days ago" },
  { id: 5, name: "Succy", species: "Echeveria elegans", image: succulentImg, health: 95, nextWater: "In 3 days", light: "Bright direct", lastUpdate: "1 week ago" },
  { id: 6, name: "Fig", species: "Strelitzia reginae", image: fiddleImg, health: 85, nextWater: "In 2 days", light: "Bright indirect", lastUpdate: "4 days ago" },
];

const tabs = [
  { id: "collection", label: "Collection", icon: Grid3X3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "journal", label: "Journal", icon: BookOpen },
];

export default function MyPlantsPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("collection");

  const healthColor = (h: number) =>
    h > 70 ? "text-plant-success" : h > 40 ? "text-plant-warning" : "text-plant-live";

  const healthBg = (h: number) =>
    h > 70 ? "bg-plant-success" : h > 40 ? "bg-plant-warning" : "bg-plant-live";

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">My Plants</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView(view === "grid" ? "list" : "grid")}
              className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center"
              aria-label="Toggle view"
            >
              {view === "grid" ? <List size={18} /> : <Grid3X3 size={18} />}
            </button>
          </div>
        </div>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your plants..."
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === id ? "bg-card shadow-card text-foreground" : "text-muted-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 px-4 py-3">
        {[
          { label: "Plants", value: plants.length, icon: "🌿" },
          { label: "Healthy", value: plants.filter((p) => p.health > 70).length, icon: "💚" },
          { label: "Need Care", value: plants.filter((p) => p.nextWater === "Today").length, icon: "💧" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-card rounded-xl p-3 shadow-card text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {activeTab === "collection" && (
        <>
          {/* Add plant */}
          <div className="px-4 mb-3">
            <button className="w-full flex items-center gap-3 p-3 bg-card rounded-2xl shadow-card border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors">
              <div className="w-12 h-12 rounded-xl gradient-leaf flex items-center justify-center">
                <Plus size={24} className="text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold">Add New Plant</p>
                <p className="text-xs text-muted-foreground">Scan with camera or add manually</p>
              </div>
              <Camera size={20} className="text-primary" />
            </button>
          </div>

          {/* Plant grid/list */}
          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              {plants.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow">
                  <div className="relative aspect-square">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${healthBg(p.health)}`} />
                      <span className={`text-xs font-bold ${healthColor(p.health)}`}>{p.health}%</span>
                    </div>
                    {p.nextWater === "Today" && (
                      <div className="absolute top-2 left-2 bg-primary rounded-full p-1.5 animate-pulse-soft">
                        <Droplets size={12} className="text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Droplets size={11} className="text-primary" />
                      <span className="text-xs text-muted-foreground">{p.nextWater}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 space-y-2 pb-4">
              {plants.map((p) => (
                <div key={p.id} className="bg-card rounded-2xl shadow-card p-3 flex items-center gap-3 animate-fade-in cursor-pointer hover:shadow-elevated transition-shadow">
                  <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <Droplets size={11} className="text-primary" />
                        <span className="text-xs text-muted-foreground">{p.nextWater}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sun size={11} className="text-plant-warning" />
                        <span className="text-xs text-muted-foreground">{p.light}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                        <circle
                          cx="20" cy="20" r="16" fill="none"
                          className={p.health > 70 ? "stroke-plant-success" : p.health > 40 ? "stroke-plant-warning" : "stroke-plant-live"}
                          strokeWidth="3"
                          strokeDasharray={`${(p.health / 100) * 100.5} 100.5`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${healthColor(p.health)}`}>{p.health}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "calendar" && (
        <div className="px-4 py-6">
          <div className="bg-card rounded-2xl shadow-card p-4 space-y-4">
            <h3 className="text-base font-bold">Care Calendar</h3>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                  i === 1 ? "gradient-leaf text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {day}
                </div>
                <div className="flex-1 flex gap-2">
                  {i % 2 === 0 && (
                    <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
                      <Droplets size={10} className="text-primary" />
                      <span className="text-xs text-primary font-medium">Water</span>
                    </div>
                  )}
                  {i === 3 && (
                    <div className="flex items-center gap-1 bg-plant-lime/10 rounded-full px-2 py-1">
                      <Scissors size={10} className="text-plant-lime" />
                      <span className="text-xs text-plant-lime font-medium">Prune</span>
                    </div>
                  )}
                  {i === 5 && (
                    <div className="flex items-center gap-1 bg-plant-warning/10 rounded-full px-2 py-1">
                      <Sun size={10} className="text-plant-warning" />
                      <span className="text-xs text-plant-warning font-medium">Rotate</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "journal" && (
        <div className="px-4 py-6 space-y-3">
          {[
            { date: "Mar 6", plant: "Monty", note: "New leaf unfurling! 🌿 Moved to brighter spot.", img: monsteraImg },
            { date: "Mar 3", plant: "Rosa", note: "Leaves curling — adjusted humidity. Misting daily now.", img: calatImg },
            { date: "Feb 28", plant: "Goldie", note: "Started water propagation with 3 cuttings.", img: pothosImg },
          ].map((entry) => (
            <div key={entry.date} className="bg-card rounded-2xl shadow-card p-3 flex gap-3">
              <img src={entry.img} alt={entry.plant} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{entry.plant}</p>
                  <span className="text-xs text-muted-foreground">{entry.date}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
