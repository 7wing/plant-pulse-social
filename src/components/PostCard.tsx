import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLikePost, useUnlikePost, usePostLikeStatus, useSavePost, useUnsavePost, usePostSaveStatus } from "@/queries/posts";
import { useComments, useAddComment } from "@/queries/comments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import PostLikersDialog from "@/components/PostLikersDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    author_id: string | null;
    caption: string | null;
    image_url: string | null;
    likes_count: number | null;
    comments_count: number | null;
    tags: string[] | null;
    created_at: string | null;
    profiles: {
      username: string;
      avatar_url: string | null;
      display_name: string | null;
    } | null;
  };
}

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800&h=600&fit=crop";

export default function PostCard({ post }: PostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likersOpen, setLikersOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const { data: hasLiked } = usePostLikeStatus(post.id);

  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const { data: isSaved } = usePostSaveStatus(post.id);

  const { data: comments, isLoading: commentsLoading } = useComments(commentsOpen ? post.id : undefined);
  const addComment = useAddComment();

  const isLikePending = likePost.isPending || unlikePost.isPending;

  const handleLike = () => {
    if (isLikePending) return;
    if (hasLiked) {
      unlikePost.mutate(post.id);
    } else {
      likePost.mutate(post.id);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(
      { post_id: post.id, text: commentText.trim() },
      { onSuccess: () => setCommentText("") }
    );
  };

  const avatar = post.profiles?.avatar_url || AVATAR_FALLBACK;
  const username = post.profiles?.display_name || post.profiles?.username || "Unknown";
  const time = post.created_at ? new Date(post.created_at).toLocaleDateString() : "";
  const image = post.image_url || FALLBACK_IMAGE;

  return (
    <>
      <div className="bg-card rounded-2xl shadow-card overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 p-3">
          <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{username}</p>
            <p className="text-xs text-muted-foreground">{time}</p>
          </div>
        </div>

        <div className="relative aspect-[4/3]">
          <img src={image} alt={post.caption ?? ""} className="w-full h-full object-cover" loading="lazy" />
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handleLike} disabled={isLikePending} className="transition-transform active:scale-125 disabled:opacity-50" aria-label="Like">
                {isLikePending ? (
                  <Loader2 size={22} className="animate-spin text-muted-foreground" />
                ) : (
                  <Heart size={22} className={hasLiked ? "fill-plant-live text-plant-live" : "text-muted-foreground"} />
                )}
              </button>
              <button onClick={() => setCommentsOpen(true)} aria-label="Comment">
                <MessageCircle size={22} className="text-muted-foreground" />
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/community?post=${post.id}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: post.caption ?? "PlantPal Post",
                        text: post.caption ?? "",
                        url,
                      });
                    } catch {
                      // User cancelled share
                    }
                  } else {
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Link copied to clipboard");
                    } catch {
                      toast.error("Failed to copy link");
                    }
                  }
                }}
                aria-label="Share"
              >
                <Share2 size={20} className="text-muted-foreground" />
              </button>
            </div>
            <button
              onClick={() => {
                if (isSaved) {
                  unsavePost.mutate(post.id);
                } else {
                  savePost.mutate(post.id);
                }
              }}
              aria-label="Save"
            >
              <Bookmark size={22} className={isSaved ? "fill-primary text-primary" : "text-muted-foreground"} />
            </button>
          </div>
          <button onClick={() => setLikersOpen(true)} className="text-sm font-semibold text-left">
            {post.likes_count ?? 0} likes
          </button>
          <p className="text-sm">
            <span className="font-semibold">{username}</span>{" "}
            {post.caption}
          </p>
          {post.tags && post.tags.length > 0 && (
            <p className="text-xs text-primary font-medium">
              {post.tags.map((t) => `#${t}`).join(" ")}
            </p>
          )}
          <button onClick={() => setCommentsOpen(true)} className="text-xs text-muted-foreground">
            View all {post.comments_count ?? 0} comments
          </button>
        </div>
      </div>

      <PostLikersDialog postId={post.id} open={likersOpen} onOpenChange={setLikersOpen} />

      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="max-h-[80dvh] flex flex-col p-0">
          {/* Post Preview */}
          <div className="flex-shrink-0 p-3 border-b bg-muted/30">
            <div className="flex items-start gap-3">
              <img
                src={image}
                alt={post.caption ?? ""}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{username}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {post.caption}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">
                    {post.tags.map((t) => `#${t}`).join(" ")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Comments Header */}
          <SheetHeader className="px-3 py-2 border-b">
            <SheetTitle className="text-base">Comments</SheetTitle>
          </SheetHeader>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <img
                    src={comment.profiles?.avatar_url || AVATAR_FALLBACK}
                    alt={comment.profiles?.username || "User"}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm">
                      <span className="font-semibold">{comment.profiles?.username || "Unknown"}</span>{" "}
                      {comment.text}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
            )}
          </div>

          {/* Comment Input */}
          <div className="flex-shrink-0 flex gap-2 p-3 border-t">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              disabled={addComment.isPending}
            />
            <Button onClick={handleAddComment} disabled={addComment.isPending || !commentText.trim()}>
              {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}