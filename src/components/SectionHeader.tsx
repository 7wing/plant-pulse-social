import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode | string | undefined;
  actionPath?: string;
  subtitle?: string;
}

export default function SectionHeader({ title, action, actionPath, subtitle }: SectionHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action !== undefined && (
        actionPath ? (
          <button
            onClick={() => navigate(actionPath)}
            className="flex items-center gap-0.5 text-xs text-primary font-semibold"
          >
            {action}
            <ChevronRight size={14} />
          </button>
        ) : (
          <span className="flex items-center gap-0.5 text-xs text-primary font-semibold">
            {action}
            <ChevronRight size={14} />
          </span>
        )
      )}
    </div>
  );
}