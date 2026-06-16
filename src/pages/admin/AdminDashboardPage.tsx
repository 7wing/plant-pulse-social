import { useNavigate } from "react-router-dom";
import { ClipboardList, Flag, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminStats } from "@/queries/admin";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  value: number;
  label: string;
  onClick: () => void;
}

function StatCard({ icon: Icon, value, label, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center transition-colors hover:bg-muted cursor-pointer w-full"
    >
      <Icon size={32} className="text-muted-foreground" />
      <span className="text-3xl font-bold">{value.toLocaleString()}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </button>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-6 text-center">
      <div className="h-8 w-8 rounded bg-muted animate-pulse" />
      <div className="h-9 w-16 rounded bg-muted animate-pulse" />
      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
    </div>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();

  return (
    <AdminLayout title="Dashboard">
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={ClipboardList}
                value={stats?.proposals ?? 0}
                label="Pending Proposals"
                onClick={() => navigate("/admin/proposals")}
              />
              <StatCard
                icon={Flag}
                value={stats?.reports ?? 0}
                label="Open Reports"
                onClick={() => navigate("/admin/reports")}
              />
              <StatCard
                icon={Users}
                value={stats?.users ?? 0}
                label="Total Users"
                onClick={() => navigate("/admin/users")}
              />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}