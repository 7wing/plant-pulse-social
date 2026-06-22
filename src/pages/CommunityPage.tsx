import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, Plus, Search, TrendingUp, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PostCard from "@/components/PostCard";
import ChallengeEventCard from "@/components/ChallengeEventCard";
import ChallengeEventDetailSheet from "@/components/ChallengeEventDetailSheet";
import ProposeChallengeSheet from "@/components/ProposeChallengeSheet";
import { useCreatePost, useFeedPosts } from "@/queries/posts";
import { usePlants } from "@/queries/plants";
import { useUpload } from "@/hooks/useUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { useChallenges } from "@/queries/challenges";
import { useUserSearch, useTagSearch, useTrendingTags } from "@/queries/search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const postSchema = z.object({
  caption: z.string().min(1, "Caption is required").max(500),
  plant_id: z.string().optional(),
  tags: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

const feedTabs = ["For You", "Following"];
type SearchTab = "posts" | "users" | "tags";

export default function CommunityPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("For You");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTab, setSearchTab] = useState<SearchTab>("posts");
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // Auto-open new post dialog when navigated from FAB
  useEffect(() => {
    if (searchParams.get("newPost") === "1") {
      setNewPostOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [challengeDetailOpen, setChallengeDetailOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const { data: plants } = usePlants();
  const { data: challenges } = useChallenges();
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

  const posts = useMemo(() => data?.pages.flat() ?? [], [data?.pages]);

  // User search for search tab
  const { data: userResults } = useUserSearch(searchQuery);
  const { data: tagResults } = useTagSearch(searchQuery);
  const { data: trendingTags = [] } = useTrendingTags();

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((post) => {
      const captionMatch = post.caption?.toLowerCase().includes(q);
      const tagMatch = post.tags?.some((t) => t.toLowerCase().includes(q));
      const authorMatch =
        post.profiles?.username?.toLowerCase().includes(q) ||
        post.profiles?.display_name?.toLowerCase().includes(q);
      return captionMatch || tagMatch || authorMatch;
    });
  }, [posts, searchQuery]);

  // Posts filtered by tag search
  const tagFilteredPosts = useMemo(() => {
    if (searchTab !== "tags" || !searchQuery.trim()) return posts;
    const q = searchQuery.toLowerCase();
    return posts.filter((post) =>
      post.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [posts, searchQuery, searchTab]);

  const displayPosts = searchTab === "tags" ? tagFilteredPosts : filteredPosts;

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

  const handleChallengeClick = (challengeId: string) => {
    setSelectedChallengeId(challengeId);
    setChallengeDetailOpen(true);
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
    <div className="pb-20 md:pb-4 min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Community</h1>
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search posts, users, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Search Tabs (only show when searching) */}
        {searchQuery.trim() && (
          <Tabs value={searchTab} onValueChange={(v) => setSearchTab(v as SearchTab)} className="mb-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Feed Tabs */}
        {!searchQuery.trim() && (
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
        )}
      </div>

      {/* Main Content - Two columns on desktop */}
      <div className="px-4 md:flex md:gap-6">
        {/* Left Column - Feed */}
        <div className="flex-1">
          {/* User Search Results */}
          {searchQuery.trim() && searchTab === "users" && (
            <div className="py-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Users matching "{searchQuery}"
              </h3>
              {userResults && userResults.length > 0 ? (
                userResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-card rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/profile/${user.id}`)}
                  >
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.display_name?.[0] || user.username[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{user.display_name || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          )}

          {/* Tag Search Results */}
          {searchQuery.trim() && searchTab === "tags" && (
            <div className="py-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Tags matching "{searchQuery}"
              </h3>
              {tagResults && tagResults.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tagResults.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => setSearchQuery(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags found</p>
              )}

              {/* Posts with matching tags */}
              {tagFilteredPosts.length > 0 && (
                <div className="pt-4 space-y-4">
                  {tagFilteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feed (Posts tab or no search) */}
          {(!searchQuery.trim() || searchTab === "posts") && (
            <>
              {/* Mobile: This week challenges */}
              <div className="md:hidden py-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold">This week</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setProposeOpen(true)}
                    className="text-xs h-7"
                  >
                    <Plus size={14} className="mr-1" />
                    Propose
                  </Button>
                </div>
                {challenges && challenges.length > 0 ? (
                  <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {challenges.map((challenge) => (
                      <ChallengeEventCard
                        key={challenge.id}
                        challenge={challenge}
                        onClick={() => handleChallengeClick(challenge.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground px-1">No active challenges or events</p>
                )}

                {/* Mobile: Trending tags */}
                <div className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-primary">Trending</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.length > 0 ? (
                      trendingTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearchQuery(tag)}
                          className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No trending tags</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Posts Feed */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {isLoading ? (
                  <div className="space-y-4 col-span-full">
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
                ) : displayPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2 col-span-full">
                    <p className="text-sm text-muted-foreground">
                      {searchQuery.trim() ? "No posts found" : "No posts yet. Be the first to share!"}
                    </p>
                  </div>
                ) : (
                  displayPosts.map((post) => <PostCard key={post.id} post={post} />)
                )}

                {/* Infinite scroll trigger / loading more indicator */}
                <div ref={observerRef} className="h-4" />
                {isFetchingNextPage && (
                  <div className="flex justify-center py-2 col-span-full">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar - Challenges (Desktop only) */}
        <div className="hidden md:block w-80 flex-shrink-0 sticky top-40 self-start space-y-3 z-40">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">This week</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProposeOpen(true)}
                className="text-xs h-7"
              >
                <Plus size={14} className="mr-1" />
                Propose
              </Button>
            </div>

            {challenges && challenges.length > 0 ? (
              <div className="space-y-2">
                {challenges.slice(0, 4).map((challenge) => (
                  <ChallengeEventCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => handleChallengeClick(challenge.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active challenges or events
              </p>
            )}

            {/* Trending tags in sidebar */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-xs font-semibold text-primary">Trending</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingTags.length > 0 ? (
                  trendingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-primary/20 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No trending tags</p>
                )}
              </div>
            </div>
          </div>
      </div>

      {/* Challenge Event Detail Sheet */}
      <ChallengeEventDetailSheet
        challengeId={selectedChallengeId}
        open={challengeDetailOpen}
        onOpenChange={setChallengeDetailOpen}
      />

      {/* Propose Challenge/Event Sheet */}
      <ProposeChallengeSheet
        open={proposeOpen}
        onOpenChange={setProposeOpen}
      />

      {/* New Post Sheet */}
      {isMobile ? (
        <Sheet open={newPostOpen} onOpenChange={setNewPostOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
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
      ) : (
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[85dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Post</DialogTitle>
            </DialogHeader>

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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}