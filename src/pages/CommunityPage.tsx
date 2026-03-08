import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import PostCard from "@/components/PostCard";
import SectionHeader from "@/components/SectionHeader";

import monsteraImg from "@/assets/plant-monstera.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import calatImg from "@/assets/plant-calathea.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import liveProImg from "@/assets/live-propagation.jpg";

const AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";
const AVATAR4 = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

const feedTabs = ["For You", "Following", "Groups", "Challenges"];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("For You");

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Community</h1>
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts, users, tags..."
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "chip-active" : "chip"}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Tags */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Trending</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["#Monstera", "#PropagationTips", "#RarePlants", "#PlantShelfie", "#UrbanJungle", "#SpringGrowth"].map((tag) => (
            <span key={tag} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-primary/20 transition-colors">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Active group banners */}
      {activeTab === "Groups" && (
        <>
          <SectionHeader title="Your Groups" />
          <div className="flex gap-3 px-4 overflow-x-auto pb-3 scrollbar-hide">
            {[
              { name: "Monstera Lovers", members: "5.2k", img: monsteraImg, posts: 12 },
              { name: "Prop Station", members: "3.8k", img: liveProImg, posts: 8 },
              { name: "Rare Finds", members: "2.1k", img: calatImg, posts: 5 },
            ].map((g) => (
              <div key={g.name} className="min-w-[200px] bg-card rounded-2xl shadow-card overflow-hidden">
                <div className="relative h-20">
                  <img src={g.img} alt={g.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                  <p className="absolute bottom-2 left-2 text-xs font-bold text-primary-foreground">{g.name}</p>
                </div>
                <div className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{g.members} members</span>
                  <span className="text-xs text-primary font-medium">{g.posts} new</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Feed */}
      <div className="px-4 space-y-4 pb-4">
        <PostCard
          avatar={AVATAR4}
          username="PlantDad_Carlos"
          time="15 min ago"
          image={monsteraImg}
          caption="Look at this fenestration on my Thai Constellation! 3 years of patience finally paying off 🌟"
          likes={892}
          comments={134}
          tags={["Monstera", "ThaiConstellation", "RarePlants"]}
        />
        <PostCard
          avatar={AVATAR3}
          username="PlantMom_Lisa"
          time="1 hour ago"
          image={pothosImg}
          caption="Quick tip: rotate your pothos quarterly for even growth. Here's my 6-month before/after! 📸"
          likes={445}
          comments={67}
          tags={["Pothos", "PlantTips", "BeforeAfter"]}
        />
        <PostCard
          avatar={AVATAR}
          username="SarahGreen"
          time="3 hours ago"
          image={succulentImg}
          caption="My succulent arrangement for the spring challenge! What do you think? 🌵✨"
          likes={678}
          comments={98}
          tags={["Succulents", "SpringChallenge", "PlantArrangement"]}
        />

        {/* Sponsored */}
        <PostCard
          avatar="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop"
          username="AeroGrow Systems"
          time="Promoted"
          image={fiddleImg}
          caption="The all-in-one smart planter that monitors soil, light, and humidity. Pre-order now and get 25% off! 🌱"
          likes={2300}
          comments={312}
          tags={["SmartGarden", "PlantTech"]}
          isSponsored
        />

        <PostCard
          avatar={AVATAR2}
          username="UrbanJungle_Mike"
          time="5 hours ago"
          image={snakeImg}
          caption="PSA: Snake plants are virtually indestructible. Here's mine thriving in a dark corner for 2 years 💪"
          likes={1234}
          comments={201}
          tags={["SnakePlant", "LowLight", "BeginnerFriendly"]}
        />
      </div>
    </div>
  );
}
