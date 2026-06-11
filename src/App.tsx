import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthRoute from "@/components/AuthRoute";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import FAB from "@/components/FAB";
import SidebarNav from "@/components/SidebarNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import MyPlantsPage from "./pages/MyPlantsPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import ConversationsPage from "./pages/ConversationsPage";
import LiveViewerPage from "./pages/LiveViewerPage";
import LiveHostPage from "./pages/LiveHostPage";
import DiscoverLivePage from "./pages/DiscoverLivePage";
import PlantDetailPage from "./pages/PlantDetailPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";
import OfflinePage from "./pages/OfflinePage";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const hideNavPaths = ["/chat", "/live-host", "/login", "/signup", "/auth/callback"];
  const hideNav =
    hideNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/live/");

  return (
    <div className={`max-w-lg md:max-w-7xl mx-auto relative min-h-screen bg-background ${!isMobile ? "md:pl-60" : ""}`}>
      {!hideNav && <SidebarNav />}
      <ErrorBoundary>
      <Routes>
        {/* Public auth routes — redirect authenticated users to home */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
        <Route path="/my-plants" element={<ProtectedRoute><MyPlantsPage /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><DiscoverLivePage /></ProtectedRoute>} />
        <Route path="/live/:streamId" element={<ProtectedRoute><LiveViewerPage /></ProtectedRoute>} />
        <Route path="/live-host" element={<ProtectedRoute><LiveHostPage /></ProtectedRoute>} />
        <Route path="/plant/:id" element={<ProtectedRoute><PlantDetailPage /></ProtectedRoute>} />
        <Route path="/offline" element={<OfflinePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
      {!hideNav && isMobile && (
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
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;