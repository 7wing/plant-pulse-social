import { ArrowLeft, Heart, Share2, Flag, UserPlus, Eye, Gift, X, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom } from "@livekit/components-react";
import { useRemoteParticipants, VideoTrack } from "@livekit/components-react";
import { Track } from "livekit-client";

import { useAuth } from "@/hooks/useAuth";
import { useStream, useUpdateViewerCount, useStreamChat, type StreamChatMessage } from "@/queries/liveStreams";
import { supabase } from "@/lib/supabase";

import liveProImg from "@/assets/live-propagation.jpg";

const AVAILABLE_REACTIONS = ["❤️", "🌿", "🔥", "😍", "👏", "🌱"];

// Fallback avatar used when host has no avatar
function HostAvatar({ src, alt }: { src: string | null | undefined; alt: string }) {
  return src ? (
    <img src={src} alt={alt} className="w-7 h-7 rounded-full object-cover ring-2 ring-plant-live" />
  ) : (
    <div className="w-7 h-7 rounded-full bg-plant-live flex items-center justify-center text-xs font-bold text-white ring-2 ring-plant-live">
      {alt.charAt(0).toUpperCase()}
    </div>
  );
}

// Renders the host's remote video track
function ViewerVideo() {
  const participants = useRemoteParticipants();
  const hostParticipant = participants.find(
    (p) => p.isCameraEnabled || p.getTrackPublication(Track.Source.Camera)
  );
  const cameraPub = hostParticipant?.getTrackPublication(Track.Source.Camera);

  if (!hostParticipant || !cameraPub?.track) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-0">
        <p className="text-white text-sm animate-pulse">Waiting for host...</p>
      </div>
    );
  }

  return (
    <VideoTrack
      trackRef={cameraPub.trackRef}
      className="absolute inset-0 w-full h-full object-cover z-0"
    />
  );
}

export default function LiveViewerPage() {
  const navigate = useNavigate();
  const { streamId } = useParams<{ streamId: string }>();
  const { user } = useAuth();

  const { data: stream, isLoading } = useStream(streamId);
  const updateViewerCount = useUpdateViewerCount();
  const { messages: chatMessages, sendMessage } = useStreamChat(streamId, !!stream);

  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [hasEnded, setHasEnded] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [liveViewerCount, setLiveViewerCount] = useState(0);
  const lastCountUpdateRef = useRef<number>(0);

  // Fetch LiveKit token once stream and user are available
  const fetchToken = async () => {
    try {
      setTokenError(null);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not authenticated");

      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/livekit-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                room_name: streamId,
                identity: user!.id,
                role: "viewer",
              }),
            }
          );

          if (!res.ok) throw new Error("Failed to fetch token");
          const data = await res.json();
          setToken(data.token);
          setWsUrl(data.ws_url);
          return;
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error("Token fetch failed");
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
      throw lastErr ?? new Error("Token fetch failed");
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : "Token fetch failed");
    }
  };

  useEffect(() => {
    if (!stream || !user) return;
    if (stream.status !== "live") return;
    fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, user, streamId]);

  // Supabase Presence for real-time viewer count
  useEffect(() => {
    if (!streamId || !user) return;

    const channel = supabase.channel(`live:${streamId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setLiveViewerCount(count);
        const now = Date.now();
        if (now - lastCountUpdateRef.current > 5000) {
          lastCountUpdateRef.current = now;
          updateViewerCount.mutate({ id: streamId, viewer_count: count });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId, user, updateViewerCount]);

  // ---- Overlay states ----
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-foreground">
        <Loader2 size={40} className="text-plant-live animate-spin mb-3" />
        <p className="text-primary-foreground text-sm">Joining stream...</p>
      </div>
    );
  }

  if (!stream || stream.status !== "live") {
    return (
      <div className="relative h-screen bg-foreground overflow-hidden flex flex-col items-center justify-center">
        <img
          src={liveProImg}
          alt="Stream ended"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="relative z-10 text-center px-6">
          <p className="text-primary-foreground text-lg font-semibold mb-2">
            This stream has ended.
          </p>
          <p className="text-primary-foreground/60 text-sm mb-6">
            The host has ended the broadcast.
          </p>
          <button
            onClick={() => navigate("/live")}
            className="px-6 py-2.5 rounded-full bg-plant-live text-white text-sm font-bold hover:bg-plant-live/90 transition-colors"
          >
            Back to Live
          </button>
        </div>
      </div>
    );
  }

  if (hasEnded || tokenError) {
    return (
      <div className="relative h-screen bg-foreground overflow-hidden flex flex-col items-center justify-center">
        <img
          src={liveProImg}
          alt="Stream ended"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="relative z-10 text-center px-6">
          <p className="text-primary-foreground text-lg font-semibold mb-2">
            {tokenError ? "Connection failed" : "The host has ended the stream."}
          </p>
          {tokenError && (
            <p className="text-primary-foreground/60 text-sm mb-4">{tokenError}</p>
          )}
          <div className="flex gap-3 justify-center">
            {tokenError && (
              <button
                onClick={fetchToken}
                className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => navigate("/live")}
              className="px-6 py-2.5 rounded-full bg-plant-live text-white text-sm font-bold hover:bg-plant-live/90 transition-colors"
            >
              Back to Live
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !wsUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-foreground">
        <Loader2 size={40} className="text-plant-live animate-spin mb-3" />
        <p className="text-primary-foreground text-sm">Connecting...</p>
      </div>
    );
  }

  const hostName =
    stream.profiles?.display_name || stream.profiles?.username || "Host";
  const hostAvatar = stream.profiles?.avatar_url;

  return (
    <div className="relative h-screen bg-foreground overflow-hidden">
      {/* LiveKit video replaces the static background */}
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        options={{ publishDefaults: { videoCodec: "vp8" } }}
        video={false}
        audio={true}
        onDisconnected={() => setHasEnded(true)}
      >
        <ViewerVideo />
      </LiveKitRoom>

      {/* Gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-foreground/30" />

      {/* Floating reactions */}
      <FloatingReactions />

      {/* Top overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <div className="flex items-center gap-2 bg-foreground/30 backdrop-blur-sm rounded-full pl-1 pr-3 py-1">
            <HostAvatar src={hostAvatar} alt={hostName} />
            <div>
              <p className="text-xs font-bold text-primary-foreground">{hostName}</p>
              <span className="live-badge text-[10px]">LIVE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-foreground/30 backdrop-blur-sm rounded-full px-2.5 py-1.5">
            <Eye size={14} className="text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground">
              {liveViewerCount}
            </span>
          </div>
          <button
            onClick={() => navigate("/live")}
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Side actions */}
      <div className="absolute right-3 bottom-44 flex flex-col gap-3 z-10">
        <SideActionButton
          icon={<Heart size={20} className="text-primary-foreground" />}
          label="Like"
          onClick={() => addReactionStatic("❤️")}
        />
        <SideActionButton
          icon={<UserPlus size={20} className="text-primary-foreground" />}
          label="Follow"
        />
        <SideActionButton
          icon={<Gift size={20} className="text-primary-foreground" />}
          label="Gift"
        />
        <SideActionButton
          icon={<Share2 size={20} className="text-primary-foreground" />}
          label="Share"
        />
        <SideActionButton
          icon={<Flag size={16} className="text-primary-foreground" />}
          label="Report"
        />
      </div>

      {/* Chat overlay */}
      <ChatOverlay
        messages={chatMessages}
        onSendMessage={sendMessage}
        availableReactions={AVAILABLE_REACTIONS}
      />
    </div>
  );
}

// ---- Sub-components preserving existing UI ----

// Module-level ref to avoid window pollution while still wiring
// FloatingReactions and ChatOverlay together.
let reactionRef: ((emoji: string) => void) | null = null;

const addReactionStatic = (emoji: string) => {
  reactionRef?.(emoji);
};

function FloatingReactions() {
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; emoji: string }[]
  >([]);

  const addReaction = (emoji: string) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, emoji }]);
    setTimeout(
      () => setFloatingReactions((prev) => prev.filter((r) => r.id !== id)),
      2000
    );
  };

  useEffect(() => {
    reactionRef = addReaction;
    return () => { reactionRef = null; };
  }, []);

  return (
    <div className="absolute right-4 bottom-40 flex flex-col items-center pointer-events-none z-10">
      {floatingReactions.map((r) => (
        <span
          key={r.id}
          className="text-2xl animate-float pointer-events-none"
          style={{ animationDuration: "1.5s" }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}

function SideActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-11 h-11 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function ChatOverlay({
  messages,
  onSendMessage,
  availableReactions,
}: {
  messages: StreamChatMessage[];
  onSendMessage: (text: string) => void;
  availableReactions: string[];
}) {
  const [chatMsg, setChatMsg] = useState("");
  const [showReactions, setShowReactions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (chatMsg.trim()) {
      onSendMessage(chatMsg);
      setChatMsg("");
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="absolute bottom-0 left-0 right-0 md:right-16 z-10 px-4 pb-4">
      {/* Chat messages */}
      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={m.id}
            className="flex items-start gap-2 animate-fade-in"
          >
            {m.avatar_url ? (
              <img
                src={m.avatar_url}
                alt={m.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-plant-live flex items-center justify-center text-[10px] font-bold text-white">
                {(m.display_name || m.username).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="bg-foreground/20 backdrop-blur-sm rounded-xl rounded-bl-md px-2.5 py-1.5 max-w-[80%]">
              <span className="text-[10px] font-bold text-primary">
                {m.display_name || m.username}
              </span>
              <p className="text-xs text-primary-foreground">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reaction bar */}
      {showReactions && (
        <div className="flex gap-2 mb-2 animate-scale-in">
          {availableReactions.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                addReactionStatic(emoji);
                setShowReactions(false);
              }}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-lg hover:scale-110 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-lg"
        >
          🌿
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={chatMsg}
            onChange={(e) => setChatMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Say something..."
            className="w-full bg-foreground/20 backdrop-blur-sm rounded-full pl-4 pr-10 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            aria-label="Send"
          >
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}