import { Loader2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePostLikers } from "@/queries/posts";

interface PostLikersDialogProps {
  postId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_FALLBACK = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face";

export default function PostLikersDialog({ postId, open, onOpenChange }: PostLikersDialogProps) {
  const navigate = useNavigate();
  const { data: likers, isLoading } = usePostLikers(postId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Liked by</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !likers || likers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No likes yet. Be the first!
            </p>
          ) : (
            <div className="space-y-3">
              {likers.map((liker, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/profile/${liker.id}`);
                  }}
                  className="flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  {liker.avatar_url ? (
                    <img
                      src={liker.avatar_url}
                      alt={liker.username}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-2 ring-primary/20">
                      <User size={18} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {liker.display_name || liker.username}
                    </p>
                    {liker.display_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        @{liker.username}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
