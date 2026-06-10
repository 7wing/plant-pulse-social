import { Home, Compass, Leaf, Users, Video, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function SidebarNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (isMobile) return null;

  const tabs = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/explore", icon: Compass, label: "Explore" },
    { path: "/my-plants", icon: Leaf, label: "Plants" },
    { path: "/community", icon: Users, label: "Community" },
    { path: "/live", icon: Video, label: "Live" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-card border-r border-border z-50 flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold text-primary">PlantPal</h2>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon size={20} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}