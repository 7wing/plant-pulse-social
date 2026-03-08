import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import FAB from "@/components/FAB";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import MyPlantsPage from "./pages/MyPlantsPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import LiveViewerPage from "./pages/LiveViewerPage";
import LiveHostPage from "./pages/LiveHostPage";
import PlantDetailPage from "./pages/PlantDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const hideNav = ["/chat", "/live", "/live-host"].includes(location.pathname);

  return (
    <div className="max-w-lg mx-auto relative min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/my-plants" element={<MyPlantsPage />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/live" element={<LiveViewerPage />} />
        <Route path="/live-host" element={<LiveHostPage />} />
        <Route path="/plant/:id" element={<PlantDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideNav && (
        <>
          <FAB />
          <BottomNav />
        </>
      )}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
