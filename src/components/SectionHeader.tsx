import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  action?: string;
}

export default function SectionHeader({ title, action = "See all" }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <h2 className="text-base font-bold">{title}</h2>
      <button className="flex items-center gap-0.5 text-xs text-primary font-semibold">
        {action}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
