import { Home, Compass, Users, Video, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/explore", icon: Compass, label: "Explore" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/live", icon: Video, label: "Live" },
  { path: "/profile", icon: User, label: "Profile" },
];

export default function FloatingNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        "fixed z-50 left-1/2 -translate-x-1/2",
        "bottom-4 md:bottom-auto md:top-5",
        "flex items-center gap-0.5 sm:gap-1 md:gap-2",
        "px-2 py-2 md:px-4 md:py-2.5",
        "bg-card/85 md:bg-card/75 backdrop-blur-xl",
        "border border-border/60",
        "rounded-full",
        "shadow-elevated",
        "max-w-[95vw]",
        "safe-bottom"
      )}
    >
      {tabs.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn(
              "relative flex items-center justify-center gap-1 md:gap-2",
              "px-2.5 sm:px-3 py-2 md:px-4 md:py-2",
              "rounded-full text-[10px] md:text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
            aria-label={label}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
