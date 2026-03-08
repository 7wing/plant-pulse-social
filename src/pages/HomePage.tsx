import { Search, Bell, Droplets, Camera } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import LiveCard from "@/components/LiveCard";
import PostCard from "@/components/PostCard";
import ChallengeCard from "@/components/ChallengeCard";
import PlantMiniCard from "@/components/PlantMiniCard";

import monsteraImg from "@/assets/plant-monstera.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import liveProImg from "@/assets/live-propagation.jpg";
import liveTourImg from "@/assets/live-tour.jpg";
import calatImg from "@/assets/plant-calathea.jpg";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";

export default function HomePage() {
  return (
    <div className="pb-24 gradient-hero min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <img src={AVATAR} alt="Profile" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />
            <div>
              <p className="text-xs text-muted-foreground">Good morning 🌿</p>
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

      {/* Care Reminders */}
      <SectionHeader title="Today's Care 💧" action="View all" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { name: "Monstera", task: "Water today", img: monsteraImg, urgent: true },
          { name: "Pothos", task: "Fertilize", img: pothosImg, urgent: false },
          { name: "Snake Plant", task: "Check soil", img: snakeImg, urgent: false },
        ].map((r) => (
          <div key={r.name} className="flex items-center gap-3 min-w-[200px] bg-card rounded-xl p-2.5 shadow-card">
            <img src={r.img} alt={r.name} className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{r.name}</p>
              <div className="flex items-center gap-1">
                <Droplets size={12} className={r.urgent ? "text-primary" : "text-muted-foreground"} />
                <p className={`text-xs ${r.urgent ? "text-primary font-medium" : "text-muted-foreground"}`}>{r.task}</p>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Droplets size={14} className="text-primary" />
            </button>
          </div>
        ))}
      </div>

      {/* Live Now */}
      <SectionHeader title="🔴 Live Now" action="Browse" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        <LiveCard
          image={liveProImg}
          title="Propagation Demo: Monstera"
          host="PlantMom_Lisa"
          hostAvatar={AVATAR3}
          viewers={342}
        />
        <LiveCard
          image={liveTourImg}
          title="My Jungle Room Tour 🌴"
          host="UrbanJungle_Mike"
          hostAvatar={AVATAR2}
          viewers={128}
        />
      </div>

      {/* Trending Plants */}
      <SectionHeader title="Trending Plants 🌱" />
      <div className="grid grid-cols-3 gap-2 px-4 pb-2">
        <PlantMiniCard image={monsteraImg} name="Monstera" species="M. deliciosa" waterDays={3} healthPercent={92} />
        <PlantMiniCard image={calatImg} name="Calathea" species="C. ornata" waterDays={2} healthPercent={78} />
        <PlantMiniCard image={succulentImg} name="Echeveria" species="E. elegans" waterDays={7} healthPercent={95} />
      </div>

      {/* Challenges */}
      <SectionHeader title="Active Challenges 🏆" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
        <ChallengeCard
          title="30-Day Propagation Challenge"
          description="Propagate any plant and document your journey daily!"
          participants={1243}
          daysLeft={18}
          progress={40}
          image={liveProImg}
        />
        <ChallengeCard
          title="Rare Plant Show & Tell"
          description="Share your rarest plants and vote for the best collection."
          participants={567}
          daysLeft={5}
          progress={83}
          image={calatImg}
        />
      </div>

      {/* Feed Posts */}
      <SectionHeader title="Your Feed" />
      <div className="px-4 space-y-4 pb-4">
        <PostCard
          avatar={AVATAR2}
          username="UrbanJungle_Mike"
          time="2 hours ago"
          image={fiddleImg}
          caption="My bird of paradise is thriving after repotting! New leaves already unfurling 🌿✨"
          likes={234}
          comments={45}
          tags={["BirdOfParadise", "Repotting", "PlantProgress"]}
        />
        <PostCard
          avatar={AVATAR3}
          username="PlantMom_Lisa"
          time="5 hours ago"
          image={pothosImg}
          caption="Golden pothos propagation update — week 4 roots are looking amazing!"
          likes={567}
          comments={89}
          tags={["Pothos", "Propagation", "WaterRoots"]}
        />

        {/* Sponsored */}
        <PostCard
          avatar="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop"
          username="GreenGrow Co."
          time="Promoted"
          image={succulentImg}
          caption="Give your plants the nutrients they deserve. Our organic plant food is now 20% off! 🌱🌸"
          likes={1200}
          comments={156}
          tags={["OrganicPlantCare", "PlantFood"]}
          isSponsored
        />
      </div>
    </div>
  );
}
