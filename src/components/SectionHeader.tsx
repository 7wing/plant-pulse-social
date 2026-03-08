import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  action?: string;
  actionPath?: string;
}

export default function SectionHeader({ title, action = "See all", actionPath }: SectionHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <h2 className="text-base font-bold">{title}</h2>
      {actionPath ? (
        <button
          onClick={() => navigate(actionPath)}
          className="flex items-center gap-0.5 text-xs text-primary font-semibold"
        >
          {action}
          <ChevronRight size={14} />
        </button>
      ) : (
        <button className="flex items-center gap-0.5 text-xs text-primary font-semibold">
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}