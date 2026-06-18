import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { Grid3X3 } from "lucide-react";
import CareDashboard from "@/components/CareDashboard";
import CollectionPreview from "@/components/CollectionPreview";
import NotificationBell from "@/components/NotificationBell";

export default function HomePage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className={`pb-20 md:pb-4 min-h-screen md:max-w-6xl md:mx-auto ${isMobile ? "" : "flex gap-6"}`}>
      {/* Main column - Care Tasks */}
      <div className={isMobile ? "" : "flex-1"}>
        {/* Mobile top bar — My Plants + Collection + Notification */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h1 className="text-xl font-bold">My Plants</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/my-plants")}
                className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center"
                aria-label="My collection"
              >
                <Grid3X3 size={18} />
              </button>
              <NotificationBell />
            </div>
          </div>
        )}
        <CareDashboard />
      </div>

      {/* Desktop only - Collection preview sidebar */}
      {!isMobile && <CollectionPreview />}
    </div>
  );
}