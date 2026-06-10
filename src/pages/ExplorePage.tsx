import { Search, SlidersHorizontal, MapPin, Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import SectionHeader from "@/components/SectionHeader";
import PlantMiniCard from "@/components/PlantMiniCard";
import ChallengeCard from "@/components/ChallengeCard";
import LiveCard from "@/components/LiveCard";

import PlantScanSheet from "@/components/PlantScanSheet";
import { identifyPlant } from "@/lib/plantnet";
import type { PlantSuggestion } from "@/lib/plantnet";
import monsteraImg from "@/assets/plant-monstera.jpg";
import succulentImg from "@/assets/plant-succulent.jpg";
import fiddleImg from "@/assets/plant-fiddle.jpg";
import pothosImg from "@/assets/plant-pothos.jpg";
import snakeImg from "@/assets/plant-snake.jpg";
import calatImg from "@/assets/plant-calathea.jpg";
import liveProImg from "@/assets/live-propagation.jpg";
import liveTourImg from "@/assets/live-tour.jpg";

const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";
const AVATAR3 = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face";

const categories = ["All", "Indoor", "Succulents", "Rare", "Propagation", "Gardening", "Tropical", "Cacti"];

export default function ExplorePage() {
  const [active, setActive] = useState("All");
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanResults, setScanResults] = useState<PlantSuggestion[] | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanError(null);
    setScanOpen(true);
    try {
      const results = await identifyPlant(file);
      setScanResults(results);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Identification failed");
      toast.error("Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Explore</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Plants, communities, challenges..."
              className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center" aria-label="Filters">
            <SlidersHorizontal size={18} className="text-foreground" />
          </button>
          <button className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center" aria-label="Map view">
            <MapPin size={18} className="text-foreground" />
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={active === cat ? "chip-active" : "chip"}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* AI Plant ID banner */}
      <div className="mx-4 mb-4 gradient-leaf rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Camera size={24} className="text-primary-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-primary-foreground">Identify Any Plant</p>
          <p className="text-xs text-primary-foreground/80">Point your camera and get instant AI identification</p>
        </div>
        <button
          onClick={() => scanInputRef.current?.click()}
          className="px-4 py-2 bg-primary-foreground/20 backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground"
        >
          Scan
        </button>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={scanInputRef}
          onChange={handleScan}
          className="hidden"
        />
      </div>

      <PlantScanSheet
        open={scanOpen}
        onOpenChange={(open) => {
          setScanOpen(open);
          if (!open) {
            setScanResults(null);
            setScanError(null);
          }
        }}
        results={scanResults}
        loading={scanning}
      />

      {/* Live Streams */}
      <SectionHeader title="🔴 Live Now" actionPath="/live" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        <LiveCard image={liveProImg} title="Rare Aroid Unboxing!" host="RarePlant_Jay" hostAvatar={AVATAR2} viewers={891} />
        <LiveCard image={liveTourImg} title="Greenhouse Tour 🌿" host="GreenThumb_Amy" hostAvatar={AVATAR3} viewers={456} />
      </div>

      {/* Plant Directory */}
      <SectionHeader title="Popular Plants 🌿" actionPath="/my-plants" />
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 px-4 pb-2">
        <PlantMiniCard image={monsteraImg} name="Monstera" species="M. deliciosa" waterDays={3} healthPercent={92} />
        <PlantMiniCard image={pothosImg} name="Pothos" species="E. aureum" waterDays={5} healthPercent={88} />
        <PlantMiniCard image={snakeImg} name="Snake Plant" species="S. trifasciata" waterDays={10} healthPercent={96} />
        <PlantMiniCard image={calatImg} name="Calathea" species="C. ornata" waterDays={2} healthPercent={74} />
        <PlantMiniCard image={succulentImg} name="Echeveria" species="E. elegans" waterDays={7} healthPercent={95} />
        <PlantMiniCard image={fiddleImg} name="Bird of Paradise" species="S. reginae" waterDays={4} healthPercent={85} />
      </div>

      {/* Communities */}
      <SectionHeader title="Top Communities" actionPath="/community" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        {[{"name": "Indoor Jungle", members: "12.4k", img: liveTourImg },
          { name: "Rare Plant Collectors", members: "8.7k", img: calatImg },
          { name: "Succulent Love", members: "15.2k", img: succulentImg },
        ].map((g) => (
          <div key={g.name} className="min-w-[160px] md:min-w-0 bg-card rounded-2xl shadow-card overflow-hidden">
            <img src={g.img} alt={g.name} className="w-full h-20 object-cover" />
            <div className="p-2.5">
              <p className="text-sm font-bold truncate">{g.name}</p>
              <p className="text-xs text-muted-foreground">{g.members} members</p>
              <button className="mt-2 w-full py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                Join
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Challenges */}
      <SectionHeader title="Challenges 🏆" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        <ChallengeCard
          title="Spring Growth Spurt"
          description="Document your plants' spring growth over 30 days!"
          participants={2100}
          daysLeft={22}
          progress={27}
          image={fiddleImg}
        />
        <ChallengeCard
          title="Propagation Station"
          description="Share your best propagation setups and results"
          participants={890}
          daysLeft={12}
          progress={60}
          image={liveProImg}
        />
      </div>

      {/* Sponsored Brands */}
      <SectionHeader title="Featured Brands" />
      <div className="flex gap-3 px-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-3 md:overflow-visible lg:grid-cols-4">
        {[
          { name: "PlantVitality", desc: "Premium organic fertilizers", discount: "20% OFF" },
          { name: "TerraCotta Co.", desc: "Handmade ceramic pots", discount: "Free shipping" },
          { name: "GrowLight Pro", desc: "Full spectrum LED lights", discount: "15% OFF" },
        ].map((brand) => (
          <div key={brand.name} className="min-w-[200px] md:min-w-0 bg-card rounded-2xl shadow-card p-3 border border-border">
            <span className="sponsored-badge mb-2">Sponsored</span>
            <p className="text-sm font-bold mt-2">{brand.name}</p>
            <p className="text-xs text-muted-foreground">{brand.desc}</p>
            <div className="mt-2 px-2 py-1 rounded-md bg-plant-lime/10 inline-block">
              <span className="text-xs font-bold text-plant-lime">{brand.discount}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
