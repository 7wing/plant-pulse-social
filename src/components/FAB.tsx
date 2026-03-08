import { Plus } from "lucide-react";
import { useState } from "react";
import { Camera, Video, PenSquare } from "lucide-react";

export default function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-2 animate-fade-in">
          {[
            { icon: PenSquare, label: "New Post", color: "bg-primary" },
            { icon: Video, label: "Go Live", color: "bg-plant-live" },
            { icon: Camera, label: "Scan Plant", color: "bg-plant-lime" },
          ].map(({ icon: Icon, label, color }) => (
            <button
              key={label}
              className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full ${color} text-primary-foreground shadow-elevated text-sm font-medium transition-transform hover:scale-105`}
              onClick={() => setOpen(false)}
              aria-label={label}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full gradient-leaf flex items-center justify-center shadow-fab transition-all duration-300 ${
          open ? "rotate-45 scale-95" : "hover:scale-110"
        }`}
        aria-label="Quick actions"
      >
        <Plus size={28} className="text-primary-foreground" />
      </button>
    </div>
  );
}
