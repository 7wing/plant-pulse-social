import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { useState } from "react";
import { useLikePost, useUnlikePost, usePostLikeStatus } from "@/queries/posts";
import { useComments, useAddComment } from "@/queries/comments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");

  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const { data: hasLiked } = usePostLikeStatus(post.id);

  const { data: comments, isLoading: commentsLoading } = useComments(commentsOpen ? post.id : undefined);
  const addComment = useAddComment();

  const handleLike = () => {
    if (hasLiked) {
      unlikePost.mutate(post.id);
    } else {
      likePost.mutate(post.id);
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment.mutate(
      { post_id: post.id, content: commentText.trim() },
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
              <button onClick={handleLike} className="transition-transform active:scale-125" aria-label="Like">
                <Heart size={22} className={hasLiked ? "fill-plant-live text-plant-live" : "text-muted-foreground"} />
              </button>
              <button onClick={() => setCommentsOpen(true)} aria-label="Comment">
                <MessageCircle size={22} className="text-muted-foreground" />
              </button>
              <button aria-label="Share">
                <Share2 size={20} className="text-muted-foreground" />
              </button>
            </div>
            <button onClick={() => setSaved(!saved)} aria-label="Save">
              <Bookmark size={22} className={saved ? "fill-primary text-primary" : "text-muted-foreground"} />
            </button>
          </div>
          <p className="text-sm font-semibold">{post.likes_count ?? 0} likes</p>
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

      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full mt-4">
            <div className="flex-1 overflow-y-auto space-y-3">
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
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{comment.profiles?.username || "Unknown"}</span>{" "}
                        {comment.content}
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
            <div className="flex gap-2 pt-3 border-t mt-3">
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
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}