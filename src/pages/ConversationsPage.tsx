import { MessageCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/queries/conversations";

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

export default function ConversationsPage() {
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">Messages</h1>
      </div>
      {conversations.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <MessageCircle size={48} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Start a conversation from someone&apos;s profile
          </p>
        </div>
      ) : (
        <div className="px-4 space-y-1">
          {conversations.map((conv) => {
            const other = conv.otherParticipant;
            const lastMsg = conv.lastMessage;
            return (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="w-full flex items-center gap-3 bg-card rounded-xl p-3 shadow-card text-left"
              >
                <div className="relative">
                  <img
                    src={other?.avatar_url || AVATAR_FALLBACK}
                    alt={other?.username || "User"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-plant-live text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {other?.display_name || other?.username || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {lastMsg
                      ? `${lastMsg.profiles?.username ?? ""}: ${lastMsg.text || "Sent an image"}`
                      : "No messages yet"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground">
                    {lastMsg?.created_at
                      ? new Date(lastMsg.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}