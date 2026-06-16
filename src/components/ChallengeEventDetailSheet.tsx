import { useState } from "react";
import { Trophy, Calendar, MapPin, Users, X, Hash } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJoinChallenge, useRSVPChallenge, useChallengeEntry, useChallenge, getTimeRemaining, formatChallengeDate, getChallengeTag, CHALLENGE_FALLBACK_IMAGE } from "@/queries/challenges";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/PostCard";
import { useChallengePosts } from "@/queries/posts";
import { Loader2 } from "lucide-react";

interface ChallengeEventDetailSheetProps {
  challengeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChallengeEventDetailSheet({ challengeId, open, onOpenChange }: ChallengeEventDetailSheetProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: challenge, isLoading } = useChallenge(challengeId ?? undefined);
  const { data: entry } = useChallengeEntry(challengeId ?? undefined);
  const joinChallenge = useJoinChallenge();
  const rsvpChallenge = useRSVPChallenge();

  const isEvent = challenge?.type === "event";
  const isJoined = !!entry;
  const challengeTag = challenge ? getChallengeTag(challenge.title) : "";

  // Fetch posts tagged with this challenge
  const { data: taggedPosts, isLoading: postsLoading } = useChallengePosts(challengeId ?? undefined, challengeTag.replace("#", ""));

  const isLoadingAction = joinChallenge.isPending || rsvpChallenge.isPending;

  const handleJoinOrRSVP = () => {
    if (!challenge || isJoined) return;

    if (isEvent) {
      rsvpChallenge.mutate({
        challengeId: challenge.id,
        eventTitle: challenge.title,
        eventDate: challenge.starts_at || new Date().toISOString(),
        location: challenge.location,
      });
    } else {
      const dueDate = challenge.ends_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      joinChallenge.mutate({
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        dueDate,
      });
    }
  };

  const timeDisplay = isEvent
    ? challenge?.starts_at ? formatChallengeDate(challenge.starts_at) : ""
    : challenge?.ends_at ? getTimeRemaining(challenge.ends_at) : "";

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            isEvent ? "bg-primary/10" : "bg-plant-warning/10"
          }`}>
            {isEvent ? "📅" : "🏆"}
          </div>
          <div className="flex-1">
            <SheetTitle className="text-lg">{challenge?.title}</SheetTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isEvent ? <Calendar size={14} /> : <Trophy size={14} />}
              <span>{timeDisplay}</span>
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Description */}
          {challenge?.description && (
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          )}

          {/* Location (for events) */}
          {isEvent && challenge?.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={16} className="text-primary" />
              <span>{challenge.is_virtual ? "Virtual Event" : challenge.location}</span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={16} />
            <span>{challenge?.participants_count ?? 0} {isEvent ? "attending" : "joined"}</span>
          </div>

          {/* Hashtag */}
          <Badge variant="outline" className="gap-1">
            <Hash size={12} />
            {challengeTag.replace("#", "")}
          </Badge>

          {/* Join/RSVP Button */}
          {isJoined ? (
            <Button disabled className="w-full">
              {isEvent ? "RSVP'd" : "Joined"}
            </Button>
          ) : (
            <Button 
              onClick={handleJoinOrRSVP} 
              disabled={isLoadingAction}
              className="w-full"
            >
              {isLoadingAction && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEvent ? "RSVP" : "Join Challenge"}
            </Button>
          )}

          {/* Tagged Posts */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3 text-sm">
              Posts tagged {challengeTag}
            </h3>
            {postsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : taggedPosts && taggedPosts.length > 0 ? (
              <div className="space-y-4">
                {taggedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No posts yet. Be the first to share!
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={onOpenChange}>
          <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : challenge ? (
              content
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Challenge not found</p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
            <DialogHeader className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  isEvent ? "bg-primary/10" : "bg-plant-warning/10"
                }`}>
                  {isEvent ? "📅" : "🏆"}
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-lg">{challenge?.title}</DialogTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isEvent ? <Calendar size={14} /> : <Trophy size={14} />}
                    <span>{timeDisplay}</span>
                  </div>
                </div>
              </div>
            </DialogHeader>
            {challenge ? content : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Challenge not found</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}