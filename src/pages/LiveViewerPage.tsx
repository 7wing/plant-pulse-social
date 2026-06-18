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

const REACTIONS = [
  { id: "heart", label: "Heart", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  )},
  { id: "leaf", label: "Leaf", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A4.49,4.49,0,0,0,8,20C19,20,22,3,22,3,21,5,14,5.25,9,6.25S2,11.5,2,13.5a6.22,6.22,0,0,0,1.75,3.75C7,8,17,8,17,8Z"/>
    </svg>
  )},
  { id: "fire", label: "Fire", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67ZM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8Z"/>
    </svg>
  )},
  { id: "star", label: "Star", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </svg>
  )},
  { id: "clap", label: "Clap", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M23 5v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2h18a2 2 0 012 2zm-2 0H3v14h18V5z"/>
      <path d="M10 8h4v2h-4zm0 4h4v2h-4z"/>
    </svg>
  )},
  { id: "sprout", label: "Sprout", svg: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M2 22h20v-2H2v2zm2-4h16v-2H4v2zm4-4h8v-2H8v2zm-2-4h12V4H6v6z"/>
    </svg>
  )},
];

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
          onClick={() => addReactionStatic("heart")}
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
      />
    </div>
  );
}

// ---- Sub-components preserving existing UI ----

// Module-level ref to avoid window pollution while still wiring
// FloatingReactions and ChatOverlay together.
let reactionRef: ((reactionId: string) => void) | null = null;

const addReactionStatic = (reactionId: string) => {
  reactionRef?.(reactionId);
};

function FloatingReactions() {
  const [floatingReactions, setFloatingReactions] = useState<
    { id: number; reactionId: string }[]
  >([]);

  const addReaction = (reactionId: string) => {
    const id = Date.now();
    setFloatingReactions((prev) => [...prev, { id, reactionId }]);
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
      {floatingReactions.map((r) => {
        const reaction = REACTIONS.find((rx) => rx.id === r.reactionId);
        return reaction ? (
          <span
            key={r.id}
            className="animate-float pointer-events-none text-plant-live"
            style={{ animationDuration: "1.5s" }}
          >
            {reaction.svg}
          </span>
        ) : null;
      })}
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
}: {
  messages: StreamChatMessage[];
  onSendMessage: (text: string) => void;
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
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.id}
              onClick={() => {
                addReactionStatic(reaction.id);
                setShowReactions(false);
              }}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-plant-live hover:scale-110 transition-transform"
            >
              {reaction.svg}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center text-plant-live"
        >
          {REACTIONS.find((r) => r.id === "leaf")?.svg}
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