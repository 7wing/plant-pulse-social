import { ArrowLeft, Phone, MoreVertical, Send, Smile, Paperclip, Image, Camera, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import monsteraImg from "@/assets/plant-monstera.jpg";

const AVATAR2 = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face";

interface Message {
  id: number;
  text: string;
  sender: "me" | "other";
  time: string;
  read?: boolean;
  plantCard?: { name: string; image: string };
}

const messages: Message[] = [
  { id: 1, text: "Hey! Did you see that Monstera Thai Constellation at the plant swap?", sender: "other", time: "10:30 AM" },
  { id: 2, text: "YES! It was gorgeous 😍 I almost traded my variegated Adansonii for it", sender: "me", time: "10:32 AM", read: true },
  { id: 3, text: "No way! Keep your Adansonii, those are getting rare", sender: "other", time: "10:33 AM" },
  { id: 4, text: "Check out this cutting I got instead:", sender: "me", time: "10:35 AM", read: true },
  { id: 5, text: "", sender: "me", time: "10:35 AM", read: true, plantCard: { name: "Monstera Albo Cutting", image: monsteraImg } },
  { id: 6, text: "WOW that's amazing!! How much did you trade for it?", sender: "other", time: "10:36 AM" },
  { id: 7, text: "Just two pothos cuttings 🌱 Best trade ever", sender: "me", time: "10:37 AM", read: false },
];

export default function ChatPage() {
  const navigate = useNavigate();
  const [msg, setMsg] = useState("");

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 bg-card/95 backdrop-blur-lg border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        <img src={AVATAR2} alt="UrbanJungle_Mike" className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">UrbanJungle_Mike</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-plant-success" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Call">
          <Phone size={16} />
        </button>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${m.sender === "me" ? "order-1" : ""}`}>
              {m.plantCard ? (
                <div className={`rounded-2xl overflow-hidden shadow-card ${m.sender === "me" ? "bg-primary/10" : "bg-card"}`}>
                  <img src={m.plantCard.image} alt={m.plantCard.name} className="w-full h-32 object-cover" />
                  <div className="p-2.5">
                    <p className="text-sm font-bold">{m.plantCard.name}</p>
                    <p className="text-xs text-primary font-medium">🌱 Plant Card</p>
                  </div>
                </div>
              ) : (
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                  m.sender === "me"
                    ? "gradient-leaf text-primary-foreground rounded-br-md"
                    : "bg-card shadow-card rounded-bl-md"
                }`}>
                  {m.text}
                </div>
              )}
              <div className={`flex items-center gap-1 mt-0.5 ${m.sender === "me" ? "justify-end" : ""}`}>
                <span className="text-[10px] text-muted-foreground">{m.time}</span>
                {m.sender === "me" && (
                  m.read
                    ? <CheckCheck size={12} className="text-primary" />
                    : <Check size={12} className="text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <div className="flex justify-start">
          <div className="bg-card shadow-card rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "200ms" }} />
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse-soft" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        </div>

        {/* Sponsored tip */}
        <div className="bg-card rounded-xl p-3 border border-border">
          <span className="sponsored-badge text-[10px] mb-1">Sponsored tip</span>
          <p className="text-xs text-muted-foreground mt-1">💡 Try rooting hormone for faster propagation results. <span className="text-primary font-medium cursor-pointer">Shop now →</span></p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-card/95 backdrop-blur-lg border-t border-border px-3 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Camera">
              <Camera size={16} className="text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Photo">
              <Image size={16} className="text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Attach">
              <Paperclip size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Message..."
              className="w-full bg-muted rounded-full pl-4 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Emoji">
              <Smile size={18} className="text-muted-foreground" />
            </button>
          </div>
          <button className="w-10 h-10 gradient-leaf rounded-full flex items-center justify-center shadow-fab" aria-label="Send">
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
