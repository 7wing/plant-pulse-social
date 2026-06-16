import { LayoutDashboard, ClipboardList, Flag, Users, BookOpen, Menu, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { path: "/admin/proposals", label: "Proposals", icon: ClipboardList, adminOnly: false },
  { path: "/admin/reports", label: "Reports", icon: Flag, adminOnly: false },
  { path: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { path: "/admin/library", label: "Library", icon: BookOpen, adminOnly: true },
];

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { isAdmin } = useRole();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const NavContent = () => (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map(({ path, label, icon: Icon, adminOnly }) => {
        if (adminOnly && !isAdmin) return null;

        return (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">Plant Pulse</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <NavContent />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-3">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex items-center gap-2 border-b px-4 py-4">
                  <span className="font-semibold text-foreground">Plant Pulse</span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
                <NavContent />
              </SheetContent>
            </Sheet>

            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>

          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}