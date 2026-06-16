import { 
  ArrowLeft, 
  MoreHorizontal, 
  Share2, 
  Edit3, 
  Trash2, 
  Check, 
  Plus, 
  ChevronRight,
  Calendar,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { usePlant, useDeletePlant } from "@/queries/plants";
import { useCareTaskHistory, usePlantCareScore, useCareTasks, formatRelativeTime } from "@/queries/careTasks";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditPlantSheet from "@/components/EditPlantSheet";
import PlantNotesSheet from "@/components/PlantNotesSheet";
import CareHistorySheet from "@/components/CareHistorySheet";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&h=600&fit=crop";

interface CareLogEntry {
  id: string;
  care_type: string;
  logged_at: string | null;
  notes: string | null;
  image_url: string | null;
  scheduled_due: string | null;
  care_tasks: {
    task_name: string;
    task_type: string;
  } | null;
}

// SVG-based circular progress for care score
function CareScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return "text-plant-success";
    if (score >= 60) return "text-plant-warning";
    return "text-destructive";
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-500 ${getScoreColor()}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-bold ${getScoreColor()}`}>{score}%</span>
      </div>
    </div>
  );
}

// Get task display name
function getTaskDisplayName(entry: CareLogEntry): string {
  if (entry.care_tasks?.task_name) {
    return entry.care_tasks.task_name;
  }
  if (entry.care_type === "note") {
    return "Note";
  }
  return entry.care_type.charAt(0).toUpperCase() + entry.care_type.slice(1);
}

// Get task icon
function getTaskIcon(careType: string): string {
  switch (careType.toLowerCase()) {
    case "water":
      return "💧";
    case "fertilize":
      return "🧪";
    case "repot":
      return "🪴";
    case "prune":
      return "✂️";
    case "note":
      return "📝";
    default:
      return "✓";
  }
}

export default function PlantDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // State for sheets and dialogs
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showNotesSheet, setShowNotesSheet] = useState(false);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: plant, isLoading, error } = usePlant(id);
  const { data: careScore } = usePlantCareScore(id);
  const { data: recentHistory = [] } = useCareTaskHistory(id, 5);
  const { data: careTasks = [] } = useCareTasks(id);
  const deletePlant = useDeletePlant();

  // Get next upcoming task
  const upcomingTasks = careTasks
    .filter((t) => !t.completed_at && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  const nextTask = upcomingTasks[0];

  // Get notes and photos from care logs (entries with notes or images)
  const notesAndPhotos = (recentHistory as unknown as CareLogEntry[]).filter(
    (log) => log.notes || log.image_url
  );

  // Share functionality
  const handleShare = async () => {
    if (!plant) return;
    
    const shareData = {
      title: plant.nickname || "My Plant",
      text: `Check out my ${plant.nickname || "plant"} on PlantPal!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      // Could show a toast here
    }
    
    setShowMenu(false);
  };

  // Delete plant
  const handleDelete = async () => {
    if (!plant) return;
    try {
      await deletePlant.mutateAsync(plant.id);
      navigate("/my-plants");
    } catch (err) {
      console.error("Failed to delete plant:", err);
    }
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <div className="h-72 bg-muted">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="px-4 -mt-6 relative z-10">
          <div className="bg-card rounded-2xl shadow-elevated p-4 space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !plant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <p className="text-muted-foreground">Failed to load plant</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    );
  }

  const score = careScore?.score ?? plant.health_percent ?? 100;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Hero image */}
        <div className="relative h-72">
          <img
            src={plant.image_url || FALLBACK_IMAGE}
            alt={plant.nickname || plant.scientific_name || "Plant"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/20" />
          
          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-primary-foreground" />
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="w-10 h-10 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Menu"
            >
              <MoreHorizontal size={20} className="text-primary-foreground" />
            </button>
          </div>
        </div>

        {/* Plant info */}
        <div className="px-4 -mt-12 relative z-10">
          <div className="bg-card rounded-2xl shadow-elevated p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{plant.nickname || "Unnamed Plant"}</h1>
                <p className="text-sm text-muted-foreground italic">
                  {plant.scientific_name || plant.species || "Unknown species"}
                </p>
                {plant.location && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    {plant.location}
                  </p>
                )}
              </div>
              <CareScoreRing score={score} size={70} />
            </div>
            
            <p className="text-xs text-muted-foreground">Care score based on care consistency</p>
            
            {/* Next care */}
            {nextTask && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Next care:</p>
                <p className="font-medium">
                  {nextTask.task_name} in {Math.ceil((new Date(nextTask.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Care History */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Care History (last 30 days)</h2>
            {(recentHistory as unknown as CareLogEntry[]).length > 0 && (
              <button
                onClick={() => setShowHistorySheet(true)}
                className="text-sm text-primary flex items-center gap-1"
              >
                View all <ChevronRight size={16} />
              </button>
            )}
          </div>
          
          {(recentHistory as unknown as CareLogEntry[]).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 bg-card rounded-xl">
              No care history yet
            </p>
          ) : (
            <div className="space-y-2">
              {(recentHistory as unknown as CareLogEntry[]).slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-card rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-plant-success/10 flex items-center justify-center">
                    <Check size={16} className="text-plant-success" />
                  </div>
                  <span className="flex-1 font-medium text-sm">{getTaskDisplayName(log)}</span>
                  <span className="text-xs text-muted-foreground">
                    {log.logged_at ? formatRelativeTime(log.logged_at) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes & Photos */}
        <div className="px-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">Notes & Photos</h2>
          </div>
          
          {notesAndPhotos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 bg-card rounded-xl">
              No notes or photos yet
            </p>
          ) : (
            <div className="space-y-2">
              {notesAndPhotos.map((log) => (
                <div key={log.id} className="bg-card rounded-xl p-3">
                  {log.image_url && (
                    <img
                      src={log.image_url}
                      alt="Care note"
                      className="w-full h-40 rounded-lg object-cover mb-2"
                    />
                  )}
                  {log.notes && (
                    <p className="text-sm text-muted-foreground">{log.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {log.logged_at ? formatRelativeTime(log.logged_at) : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <Button
            onClick={() => setShowNotesSheet(true)}
            variant="outline"
            className="w-full mt-3"
          >
            <Plus size={16} />
            Add note/photo
          </Button>
        </div>
      </div>

      {/* Desktop Layout (md+) */}
      <div className="hidden md:block">
        <div className="max-w-4xl mx-auto px-6 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              onClick={() => setShowMenu(true)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
              aria-label="Menu"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Left: Photo */}
            <div className="rounded-2xl overflow-hidden bg-muted aspect-square">
              <img
                src={plant.image_url || FALLBACK_IMAGE}
                alt={plant.nickname || plant.scientific_name || "Plant"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right: Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-bold mb-1">{plant.nickname || "Unnamed Plant"}</h1>
              <p className="text-lg text-muted-foreground italic mb-4">
                {plant.scientific_name || plant.species || "Unknown species"}
              </p>
              
              {plant.location && (
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                  <Calendar size={14} />
                  {plant.location}
                </p>
              )}

              <div className="flex items-center gap-6 mb-4">
                <CareScoreRing score={score} size={100} />
                <div>
                  <p className="font-bold text-lg">Care Score</p>
                  <p className="text-sm text-muted-foreground">Based on care consistency</p>
                </div>
              </div>

              {nextTask && (
                <div className="p-3 rounded-xl bg-muted/50 inline-block">
                  <p className="text-sm text-muted-foreground">Next care:</p>
                  <p className="font-medium">
                    {nextTask.task_name} in {Math.ceil((new Date(nextTask.due_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Care History - Full width */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Care History (last 30 days)</h2>
              {(recentHistory as unknown as CareLogEntry[]).length > 0 && (
                <button
                  onClick={() => setShowHistorySheet(true)}
                  className="text-sm text-primary flex items-center gap-1 hover:underline"
                >
                  View all <ChevronRight size={16} />
                </button>
              )}
            </div>
            
            {(recentHistory as unknown as CareLogEntry[]).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-xl">
                No care history yet
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {(recentHistory as unknown as CareLogEntry[]).slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-4 bg-card rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-plant-success/10 flex items-center justify-center shrink-0">
                      <Check size={18} className="text-plant-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{getTaskDisplayName(log)}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.logged_at ? formatRelativeTime(log.logged_at) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes & Photos - Full width */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Notes & Photos</h2>
            </div>
            
            {notesAndPhotos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 bg-card rounded-xl">
                No notes or photos yet
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {notesAndPhotos.map((log) => (
                  <div key={log.id} className="bg-card rounded-xl p-4">
                    {log.image_url && (
                      <img
                        src={log.image_url}
                        alt="Care note"
                        className="w-full h-48 rounded-lg object-cover mb-3"
                      />
                    )}
                    {log.notes && (
                      <p className="text-sm text-muted-foreground">{log.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {log.logged_at ? formatRelativeTime(log.logged_at) : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            <Button
              onClick={() => setShowNotesSheet(true)}
              variant="outline"
              className="w-full mt-4"
            >
              <Plus size={16} />
              Add note/photo
            </Button>
          </div>
        </div>
      </div>

      {/* Overflow Menu Sheet */}
      <Sheet open={showMenu} onOpenChange={setShowMenu}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="text-center">Options</SheetTitle>
          </SheetHeader>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                setShowMenu(false);
                setShowEditSheet(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
            >
              <Edit3 size={20} />
              <span className="font-medium">Edit</span>
            </button>
            
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-muted transition-colors"
            >
              <Share2 size={20} />
              <span className="font-medium">Share</span>
            </button>
            
            <button
              onClick={() => {
                setShowMenu(false);
                setShowDeleteDialog(true);
              }}
              className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 size={20} />
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Plant Sheet */}
      <EditPlantSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        plant={plant}
      />

      {/* Notes Sheet */}
      <PlantNotesSheet
        open={showNotesSheet}
        onOpenChange={setShowNotesSheet}
        plantId={plant.id}
        onSuccess={() => {
          // Query will auto-refetch
        }}
      />

      {/* Care History Sheet */}
      <CareHistorySheet
        open={showHistorySheet}
        onOpenChange={setShowHistorySheet}
        plantId={plant.id}
        plantName={plant.nickname}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {plant.nickname || "this plant"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the plant and all associated care history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}