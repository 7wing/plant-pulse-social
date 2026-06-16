import { Trophy, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJoinChallenge, useRSVPChallenge, useChallengeEntry, getTimeRemaining, formatChallengeDate, type Challenge } from "@/queries/challenges";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ChallengeEventCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export default function ChallengeEventCard({ challenge, onClick }: ChallengeEventCardProps) {
  const { user } = useAuth();
  const { data: entry } = useChallengeEntry(user?.id ? challenge.id : undefined);
  const joinChallenge = useJoinChallenge();
  const rsvpChallenge = useRSVPChallenge();

  const isEvent = challenge.type === "event";
  const isJoined = !!entry;
  const timeDisplay = isEvent
    ? formatChallengeDate(challenge.starts_at)
    : getTimeRemaining(challenge.ends_at);

  const isLoading = joinChallenge.isPending || rsvpChallenge.isPending;

  const handleJoinOrRSVP = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isJoined) return;
    
    if (isEvent) {
      rsvpChallenge.mutate({
        challengeId: challenge.id,
        eventTitle: challenge.title,
        eventDate: challenge.starts_at || new Date().toISOString(),
        location: challenge.location,
      });
    } else {
      // For challenges, set due date to ends_at or 3 days from now
      const dueDate = challenge.ends_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      joinChallenge.mutate({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        dueDate,
      });
    }
  };

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[280px] bg-card rounded-xl shadow-card overflow-hidden text-left hover:shadow-md transition-shadow cursor-pointer border border-border/50"
    >
      <div className="p-3 flex items-center gap-3">
        {/* Type badge */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
          isEvent 
            ? "bg-primary/10 text-primary" 
            : "bg-plant-warning/10 text-plant-warning"
        }`}>
          {isEvent ? "📅" : "🏆"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{challenge.title}</p>
          <p className="text-xs text-muted-foreground">
            {isEvent ? timeDisplay : `⏱️ ${timeDisplay}`}
          </p>
        </div>

        {/* Action button */}
        <div className="flex-shrink-0">
          {isJoined ? (
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {isEvent ? "RSVP'd" : "Joined"}
            </span>
          ) : (
            <Button
              size="sm"
              variant={isEvent ? "outline" : "default"}
              onClick={handleJoinOrRSVP}
              disabled={isLoading}
              className="h-7 text-xs px-2"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isEvent ? (
                "RSVP"
              ) : (
                "Join"
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Participants count */}
      {(challenge.participants_count ?? 0) > 0 && (
        <div className="px-3 pb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Users size={12} />
          {challenge.participants_count} going
        </div>
      )}
    </button>
  );
}