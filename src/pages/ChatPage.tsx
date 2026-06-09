import { ArrowLeft, Phone, MoreVertical, Send, Smile, Paperclip, Image, Camera, Check, CheckCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMessages, useSendMessage, useMarkAsRead } from "@/queries/messages";
import { useConversations } from "@/queries/conversations";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [msg, setMsg] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useMessages(conversationId);
  const { data: conversations } = useConversations();
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const otherUser = conversation?.otherParticipant;

  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId]);
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  const otherName = otherUser?.display_name || otherUser?.username || "Chat";

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-3 bg-card/95 backdrop-blur-lg border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Back">
          <ArrowLeft size={18} />
        </button>
        {otherUser?.avatar_url ? (
          <img src={otherUser.avatar_url} alt={otherName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">{otherName[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">{otherName}</p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-plant-success" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Call">
          <Phone size={16} />
        </button>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="More options">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            const sender = m.profiles;
            const senderName = sender?.display_name || sender?.username || "User";
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] ${isMe ? "order-1" : ""}`}>
                  {!isMe && sender?.avatar_url && (
                    <img src={sender.avatar_url} alt={senderName} className="w-6 h-6 rounded-full object-cover mb-1" />
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "gradient-leaf text-primary-foreground rounded-br-md"
                      : "bg-card shadow-card rounded-bl-md"
                  }`}>
                    {m.text}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : ""}`}>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                    {isMe && (
                      m.is_read
                        ? <CheckCheck size={12} className="text-primary" />
                        : <Check size={12} className="text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Sponsored tip */}
        <div className="bg-card rounded-xl p-3 border border-border">
          <span className="sponsored-badge text-[10px] mb-1">Sponsored tip</span>
          <p className="text-xs text-muted-foreground mt-1">Try rooting hormone for faster propagation results. <span className="text-primary font-medium cursor-pointer">Shop now</span></p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-card/95 backdrop-blur-lg border-t border-border px-3 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Camera">
              <Camera size={16} className="text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Photo">
              <Image size={16} className="text-muted-foreground" />
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" aria-label="Attach">
              <Paperclip size={16} className="text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Message..."
              className="w-full bg-muted rounded-full pl-4 pr-10 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2" aria-label="Emoji">
              <Smile size={18} className="text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={() => {
              if (!msg.trim() || !conversationId) return;
              sendMessage.mutate({ conversation_id: conversationId, text: msg.trim() }, {
                onSuccess: () => setMsg(""),
              });
            }}
            disabled={sendMessage.isPending || !msg.trim()}
            className="w-10 h-10 gradient-leaf rounded-full flex items-center justify-center shadow-fab disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}