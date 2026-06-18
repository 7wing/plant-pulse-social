import {
  Sprout, Heart, MessageCircle, User, Trophy, XCircle,
  Calendar, Award, Bell,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const iconMap: Record<string, React.FC<LucideProps>> = {
  care_reminder: Sprout,
  like: Heart,
  comment: MessageCircle,
  follow: User,
  proposal_approved: Trophy,
  proposal_rejected: XCircle,
  challenge_reminder: Calendar,
  event_reminder: Calendar,
  badge: Award,
};

export default function NotificationIcon({ type, ...props }: { type: string } & LucideProps) {
  const Icon = iconMap[type?.toLowerCase()] || Bell;
  return <Icon {...props} />;
}