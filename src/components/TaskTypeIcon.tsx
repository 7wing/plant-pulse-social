import { Droplets, TestTube, Flower, Scissors, FileText, Check } from "lucide-react";
import type { LucideProps } from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  water: Droplets,
  fertilize: TestTube,
  fertilise: TestTube,
  repot: Flower,
  prune: Scissors,
  other: FileText,
  complete: Check,
};

export default function TaskTypeIcon({ type, ...props }: { type: string } & LucideProps) {
  const Icon = iconMap[type?.toLowerCase()] || FileText;
  return <Icon {...props} />;
}