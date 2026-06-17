import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthRoute from "@/components/AuthRoute";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import FAB from "@/components/FAB";
import FloatingNav from "@/components/FloatingNav";
import NotificationBell from "@/components/NotificationBell";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ModeratorRoute from "@/components/ModeratorRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import MyPlantsPage from "./pages/MyPlantsPage";
import CommunityPage from "./pages/CommunityPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import NotificationsPage from "./pages/NotificationsPage";
import ConversationsPage from "./pages/ConversationsPage";
import LiveViewerPage from "./pages/LiveViewerPage";
import LiveHostPage from "./pages/LiveHostPage";
import DiscoverLivePage from "./pages/DiscoverLivePage";
import PlantDetailPage from "./pages/PlantDetailPage";
import CareGuideDetailPage from "./pages/CareGuideDetailPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import NotFound from "./pages/NotFound";
import OfflinePage from "./pages/OfflinePage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProposalsPage from "./pages/admin/AdminProposalsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLibraryPage from "./pages/admin/AdminLibraryPage";

const queryClient = new QueryClient();

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const hideNavPaths = ["/chat", "/live-host", "/login", "/signup", "/auth/callback"];
  const hideNav =
    hideNavPaths.includes(location.pathname) ||
    location.pathname.startsWith("/live/");

  return (
    <div className="max-w-lg md:max-w-7xl mx-auto relative min-h-screen bg-background md:pt-20">
      {!hideNav && <FloatingNav />}

      {/* Desktop top-right: Notification bell + Profile */}
      {!hideNav && !isMobile && (
        <div className="fixed top-5 right-6 z-50 flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-card/75 backdrop-blur-xl border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
            aria-label="Profile"
          >
            <User size={18} />
            <span>Profile</span>
          </button>
        </div>
      )}

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
        <Route path="/profile/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} />
        <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/live" element={<ProtectedRoute><DiscoverLivePage /></ProtectedRoute>} />
        <Route path="/live/:streamId" element={<ProtectedRoute><LiveViewerPage /></ProtectedRoute>} />
        <Route path="/live-host" element={<ProtectedRoute><LiveHostPage /></ProtectedRoute>} />
        <Route path="/plant/:id" element={<ProtectedRoute><PlantDetailPage /></ProtectedRoute>} />
        <Route path="/care-guide/:id" element={<ProtectedRoute><CareGuideDetailPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/offline" element={<OfflinePage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        <Route path="/admin/proposals" element={<ModeratorRoute><AdminProposalsPage /></ModeratorRoute>} />
        <Route path="/admin/reports" element={<ModeratorRoute><AdminReportsPage /></ModeratorRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/library" element={<AdminRoute><AdminLibraryPage /></AdminRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
      {!hideNav && isMobile && <FAB />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppLayout />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;