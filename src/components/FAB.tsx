import { Plus, Camera, PenSquare, Leaf, ScanLine } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddCareTaskSheet from "@/components/AddCareTaskSheet";
import AddPlantFlow from "@/components/AddPlantFlow";

export default function FAB() {
  const [open, setOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [plantFlowMode, setPlantFlowMode] = useState<"method" | "scan">("method");
  const navigate = useNavigate();

  const actions = [
    { icon: Leaf, label: "Add care task", color: "bg-primary", action: () => { setOpen(false); setAddTaskOpen(true); } },
    { icon: ScanLine, label: "Identify plant", color: "bg-plant-lime", action: () => { setOpen(false); setPlantFlowMode("scan"); setAddPlantOpen(true); } },
    { icon: PenSquare, label: "New post", color: "bg-plant-live", action: () => { setOpen(false); navigate("/community?newPost=1"); } },
    { icon: Camera, label: "Add new plant", color: "bg-plant-warning", action: () => { setOpen(false); setPlantFlowMode("method"); setAddPlantOpen(true); } },
  ];

  return (
    <>
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 animate-fade-in">
            {actions.map(({ icon: Icon, label, color, action }) => (
              <button
                key={label}
                className={`flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full ${color} text-primary-foreground shadow-elevated text-sm font-medium transition-transform hover:scale-105`}
                onClick={action}
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
          data-testid="fab"
        >
          <Plus size={28} className="text-primary-foreground" />
        </button>
      </div>

      {/* Add Plant Flow */}
      <AddPlantFlow
        open={addPlantOpen}
        onOpenChange={setAddPlantOpen}
        initialStep={plantFlowMode}
      />

      {/* Add Care Task Sheet */}
      <AddCareTaskSheet open={addTaskOpen} onOpenChange={setAddTaskOpen} />
    </>
  );
}