import { useNavigate } from "react-router-dom";
import { Video, Eye, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveStreams } from "@/queries/liveStreams";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StreamCard({ stream }: { stream: { id: string; title: string; category: string | null; viewer_count: number | null; profiles: { username: string; avatar_url: string | null; display_name: string | null } | null } }) {
  const navigate = useNavigate();
  const hostName = stream.profiles?.display_name || stream.profiles?.username || "Unknown";
  const avatarUrl = stream.profiles?.avatar_url || null;

  return (
    <Card
      className="cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
      onClick={() => navigate(`/live/${stream.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Host row */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={avatarUrl ?? undefined} alt={hostName} />
            <AvatarFallback>{getInitials(hostName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{hostName}</p>
            <p className="text-xs text-muted-foreground truncate">{stream.title}</p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="destructive" className="text-xs font-bold px-2 py-0.5">
            LIVE
          </Badge>
          {stream.category && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {stream.category}
            </Badge>
          )}
        </div>

        {/* Viewer count */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Eye size={14} />
          <span className="text-xs font-medium">
            {stream.viewer_count ?? 0} watching
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DiscoverLivePage() {
  const navigate = useNavigate();
  const { data: streams, isLoading } = useLiveStreams();

  return (
    <div className="pb-20 md:pb-4 min-h-screen md:max-w-6xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">Live Streams</h1>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-12 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-3 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : !streams || streams.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-4 px-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Video size={32} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-base font-semibold">No one is live right now.</p>
            <p className="text-sm text-muted-foreground">
              Be the first to go live and share your plants!
            </p>
          </div>
          <Button onClick={() => navigate("/live-host")} size="lg" className="mt-2">
            Go Live
          </Button>
        </div>
      ) : (
        /* Stream list */
        <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {streams.map((stream) => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      )}
    </div>
  );
}