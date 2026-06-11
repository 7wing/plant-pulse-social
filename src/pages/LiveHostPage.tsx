import {
  ArrowLeft,
  Video,
  Settings,
  Users,
  Clock,
  Shield,
  MessageSquare,
  Wifi,
  Mic,
  Camera as CameraIcon,
  SwitchCamera,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LiveKitRoom } from "@livekit/components-react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

import liveTourImg from "@/assets/live-tour.jpg";

// Typed constants for stream settings
const CATEGORIES = [
  "Propagation",
  "Plant Tour",
  "Repotting",
  "Q&A",
  "Unboxing",
  "Care Tips",
] as const;

export type Category = (typeof CATEGORIES)[number];

type CoHostSetting = "None" | "Invite" | "Request Only";
type ModerationSetting = "Auto" | "Manual" | "Strict";
type ChatSetting = "Everyone" | "Followers" | "Subs Only";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useCreateStream, useEndStream } from "@/queries/liveStreams";

type Mode = "setup" | "connecting" | "live";

/** Inner component — rendered inside <LiveKitRoom>, has access to local participant */
function HostVideo({
  onStatusChange,
}: {
  onStatusChange: (info: {
    micEnabled: boolean;
    cameraEnabled: boolean;
  }) => void;
}) {
  const { localParticipant } = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraTrackRef = useRef<ReturnType<
    ReturnType<typeof localParticipant.getTrackPublication>
  >["track"] | null>(null);

  // Attach camera track to the <video> element
  useEffect(() => {
    const cameraPub = localParticipant.getTrackPublication(Track.Source.Camera);
    const track = cameraPub?.track;
    const videoEl = videoRef.current;

    if (track && videoEl) {
      cameraTrackRef.current = track;
      track.attach(videoEl);
      return () => {
        track.detach(videoEl);
        cameraTrackRef.current = null;
      };
    }
  }, [localParticipant]);

  // Sync mic/camera enabled state up to the page
  useEffect(() => {
    onStatusChange({
      micEnabled: localParticipant.isMicrophoneEnabled,
      cameraEnabled: localParticipant.isCameraEnabled,
    });
  }, [
    localParticipant.isMicrophoneEnabled,
    localParticipant.isCameraEnabled,
    onStatusChange,
  ]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}

export default function LiveHostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createStream = useCreateStream();
  const endStream = useEndStream();

  const [streamId] = useState(() => crypto.randomUUID());
  const [mode, setMode] = useState<Mode>("setup");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Propagation");
  const [token, setToken] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [error, setError] = useState("");

  // Stream settings state
  const [coHostSetting, setCoHostSetting] = useState<CoHostSetting>("None");
  const [moderationSetting, setModerationSetting] = useState<ModerationSetting>("Auto");
  const [chatSetting, setChatSetting] = useState<ChatSetting>("Everyone");

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const endedRef = useRef(false);

  function handleStatusChange(info: { micEnabled: boolean; cameraEnabled: boolean }) {
    setMicEnabled(info.micEnabled);
    setCameraEnabled(info.cameraEnabled);
  }

  async function handleGoLive() {
    if (!title.trim()) {
      setError("Please enter a stream title.");
      return;
    }
    if (!user) {
      setError("You must be logged in to go live.");
      return;
    }

    setError("");
    setMode("connecting");

    try {
      // 1. Create DB row
      await createStream.mutateAsync({
        id: streamId,
        title: title.trim(),
        category,
        co_host_setting: coHostSetting,
        moderation_setting: moderationSetting,
        chat_setting: chatSetting,
      });

      // 2. Fetch LiveKit token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("No session token");

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
            identity: user.id,
            role: "host",
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to fetch LiveKit token");
      const { token: liveToken, ws_url } = await res.json();

      setToken(liveToken);
      setWsUrl(ws_url);
      setMode("live");
    } catch (err) {
      console.error("[LiveHostPage] Go live error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start stream."
      );
      setMode("setup");
    }
  }

  async function handleEndStream() {
    endedRef.current = true;
    try {
      await endStream.mutateAsync(streamId);
    } catch (err) {
      console.error("[LiveHostPage] End stream error:", err);
    }
    setMode("setup");
    setToken("");
    setWsUrl("");
    navigate("/live");
  }

  // Connecting overlay
  if (mode === "connecting") {
    return (
      <div className="relative h-screen bg-foreground overflow-hidden">
        <img
          src={liveTourImg}
          alt="Camera preview"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />

        {/* Top bar (same as setup) */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
        </div>

        {/* Center spinner */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          <p className="text-primary-foreground/80 text-sm font-medium">
            Starting your stream…
          </p>
        </div>
      </div>
    );
  }

  // Live mode — render LiveKit room
  if (mode === "live" && token && wsUrl) {
    return (
      <LiveKitRoom
        token={token}
        serverUrl={wsUrl}
        connect={true}
        options={{
          publishDefaults: { videoCodec: "vp8" },
        }}
        video={true}
        audio={true}
        onDisconnected={() => {
          if (!endedRef.current) {
            endStream.mutateAsync(streamId).then(() => navigate("/live"));
          }
        }}
      >
        <LiveRoomContent
          streamId={streamId}
          micEnabled={micEnabled}
          cameraEnabled={cameraEnabled}
          onStatusChange={handleStatusChange}
          onEndStream={handleEndStream}
          navigate={navigate}
        />
      </LiveKitRoom>
    );
  }

  // Setup mode — render pre-stream UI
  return (
    <div className="relative h-screen bg-foreground overflow-hidden">
      {/* Background image */}
      <img
        src={liveTourImg}
        alt="Camera preview"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/40" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-primary-foreground" />
        </button>
        <div className="flex gap-2">
          <button
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings size={18} className="text-primary-foreground" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Switch camera"
          >
            <SwitchCamera size={18} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        <div className="w-full max-w-[320px] md:max-w-md lg:max-w-lg space-y-4">
          {/* Title input */}
          <div>
            <label className="text-xs font-semibold text-primary-foreground/80 mb-1 block">
              Stream Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g., Monstera Propagation Demo"
              className="w-full bg-foreground/20 backdrop-blur-sm rounded-xl px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {error && (
              <p className="text-red-400 text-xs mt-1">{error}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-primary-foreground/80 mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? "gradient-leaf text-primary-foreground"
                      : "bg-foreground/20 text-primary-foreground/70 backdrop-blur-sm"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <SettingsRow
              icon={Users}
              label="Invite Co-hosts"
              value={coHostSetting}
              options={["None", "Invite", "Request Only"] as CoHostSetting[]}
              onChange={setCoHostSetting}
            />
            <SettingsRow
              icon={Shield}
              label="Moderation"
              value={moderationSetting}
              options={["Auto", "Manual", "Strict"] as ModerationSetting[]}
              onChange={setModerationSetting}
            />
            <SettingsRow
              icon={MessageSquare}
              label="Chat"
              value={chatSetting}
              options={["Everyone", "Followers", "Subs Only"] as ChatSetting[]}
              onChange={setChatSetting}
            />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-8 safe-bottom">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Microphone"
          >
            <Mic size={20} className="text-primary-foreground" />
          </button>
          <button
            className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Camera toggle"
          >
            <CameraIcon size={20} className="text-primary-foreground" />
          </button>
          <button
            className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Connection"
          >
            <Wifi size={20} className="text-primary-foreground" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGoLive}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-plant-live rounded-2xl text-primary-foreground font-bold text-sm shadow-elevated"
          >
            <Video size={18} />
            Go Live
          </button>
          <button className="flex items-center justify-center gap-2 px-5 py-3.5 bg-foreground/30 backdrop-blur-sm rounded-2xl text-primary-foreground font-medium text-sm">
            <Clock size={16} />
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rendered inside <LiveKitRoom> — has access to LiveKit context */
function LiveRoomContent({
  micEnabled,
  cameraEnabled,
  onStatusChange,
  onEndStream,
  navigate,
}: {
  micEnabled: boolean;
  cameraEnabled: boolean;
  onStatusChange: (info: { micEnabled: boolean; cameraEnabled: boolean }) => void;
  onEndStream: () => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="relative h-screen bg-foreground overflow-hidden">
      {/* Camera preview fills the screen */}
      <HostVideo onStatusChange={onStatusChange} />

      {/* Dark gradient overlay at top */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-foreground/60 to-transparent z-10" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-primary-foreground" />
        </button>
        <div className="flex gap-2">
          <button
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Settings"
          >
            <Settings size={18} className="text-primary-foreground" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Switch camera"
          >
            <SwitchCamera size={18} className="text-primary-foreground" />
          </button>
        </div>
      </div>

      {/* Live badge */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1.5 bg-red-500 px-3 py-1 rounded-full">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 safe-bottom">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Mic toggle */}
          <button
            onClick={() => localParticipant.setMicrophoneEnabled(!micEnabled)}
            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              micEnabled
                ? "bg-foreground/30 text-primary-foreground"
                : "bg-red-500/80 text-white"
            }`}
            aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            <Mic size={20} className={micEnabled ? "" : "opacity-40"} />
          </button>

          {/* Camera toggle */}
          <button
            onClick={() => localParticipant.setCameraEnabled(!cameraEnabled)}
            className={`w-12 h-12 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
              cameraEnabled
                ? "bg-foreground/30 text-primary-foreground"
                : "bg-red-500/80 text-white"
            }`}
            aria-label={cameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            <CameraIcon
              size={20}
              className={cameraEnabled ? "" : "opacity-40"}
            />
          </button>

          {/* Connection indicator */}
          <div className="w-12 h-12 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
            <Wifi size={20} className="text-green-400" />
          </div>
        </div>

        {/* End Stream button */}
        <button
          onClick={onEndStream}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-500 rounded-2xl text-white font-bold text-sm shadow-elevated"
        >
          <Video size={16} />
          End Stream
        </button>
      </div>
    </div>
  );
}

/** Interactive settings row component for stream options */
function SettingsRow<T extends string>({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-foreground/20 backdrop-blur-sm rounded-xl px-4 py-3 transition-colors hover:bg-foreground/30"
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-primary-foreground/70" />
          <span className="text-sm text-primary-foreground">{label}</span>
        </div>
        <span className="text-xs text-primary-foreground/60">
          {value} ›
        </span>
      </button>

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-foreground/95 backdrop-blur-md rounded-xl overflow-hidden shadow-elevated z-50">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                value === option
                  ? "bg-plant-live text-primary-foreground font-medium"
                  : "text-primary-foreground/80 hover:bg-foreground/50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}