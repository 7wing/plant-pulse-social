import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
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

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

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
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;