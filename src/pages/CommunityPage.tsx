import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Plus, Search, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import PostCard from "@/components/PostCard";
import { useCreatePost, useFeedPosts } from "@/queries/posts";
import { usePlants } from "@/queries/plants";
import { useUpload } from "@/hooks/useUpload";
import { Skeleton } from "@/components/ui/skeleton";

const postSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(500),
  plant_id: z.string().optional(),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const feedTabs = ["For You", "Following"];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("For You");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: plants } = usePlants();
  const { uploadFile, uploading } = useUpload();
  const createPost = useCreatePost();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeedPosts(activeTab === "Following");

  const posts = data?.pages.flat() ?? [];

  const onSubmit = async (data: PostFormData) => {
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        imageUrl = (await uploadFile(selectedImage, { bucket: "post-images" })).url;
      }
      const tags = data.tags
        ? data.tags.split(/[,#\s]+/).filter(Boolean)
        : [];
      await createPost.mutateAsync({
        caption: data.caption,
        image_url: imageUrl,
        plant_id: data.plant_id || null,
        tags,
      });
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      setNewPostOpen(false);
    } catch {
      // Error handled by mutation state
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Infinite scroll trigger
  useEffect(() => {
    if (!observerRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Community</h1>
        <div className="relative mb-3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search posts, users, tags..."
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {feedTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "chip-active" : "chip"}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* FAB for New Post */}
      <Button
        onClick={() => setNewPostOpen(true)}
        className="fixed bottom-24 right-4 z-40 rounded-full w-14 h-14 shadow-lg p-0"
        size="icon"
      >
        <Plus className="w-5 h-5" />
      </Button>

      {/* Trending Tags */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-primary" />
          <span className="text-xs font-semibold text-primary">Trending</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            "#Monstera",
            "#PropagationTips",
            "#RarePlants",
            "#PlantShelfie",
            "#UrbanJungle",
            "#SpringGrowth",
          ].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-primary/20 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
                <Skeleton className="w-full h-64" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <p className="text-sm text-muted-foreground">
              No posts yet. Be the first to share!
            </p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}

        {/* Infinite scroll trigger / loading more indicator */}
        <div ref={observerRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* New Post Sheet */}
      <Sheet open={newPostOpen} onOpenChange={setNewPostOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Post</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Caption */}
            <div>
              <Textarea
                {...register("caption")}
                placeholder="Share your plant journey..."
                className="min-h-[120px]"
              />
              {errors.caption && (
                <p className="text-sm text-destructive mt-1">{errors.caption.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <Input
                {...register("tags")}
                placeholder="Tags: #Monstera, #PlantTips"
              />
            </div>

            {/* Plant Tag (Optional) */}
            <div>
              <select
                {...register("plant_id")}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Tag a plant (optional)</option>
                {plants?.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.nickname || plant.species || "Unnamed Plant"}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Add a photo</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Error Display */}
            {createPost.isError && (
              <p className="text-sm text-destructive">
                Failed to create post. Please try again.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset();
                  setSelectedImage(null);
                  setImagePreview(null);
                  setNewPostOpen(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={uploading || isSubmitting}
                className="flex-1"
              >
                {(uploading || isSubmitting) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Share Post
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}