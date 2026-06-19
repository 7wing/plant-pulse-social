import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Search, Pencil, Check, X, Trash2, Leaf } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/lib/supabase";
import type { PlantLibraryEntry } from "@/queries/plantLibrary";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

type SourceFilter = "all" | "curated" | "api_fallback";

const sourceColors: Record<string, string> = {
  curated: "bg-green-100 text-green-800",
  api_fallback: "bg-orange-100 text-orange-800",
};

function SourceBadge({ source }: { source: string | null }) {
  const sourceValue = source || "unknown";
  const colorClass = sourceColors[sourceValue] || "bg-gray-100 text-gray-800";
  const label = sourceValue === "api_fallback" ? "API Fallback" : sourceValue;

  return (
    <Badge variant="secondary" className={colorClass}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </Badge>
  );
}

interface EditFormData {
  species_name: string;
  common_name: string;
  description: string;
  light: string;
  water: string;
  difficulty: string;
  toxicity: string;
  image_url: string;
}

export default function AdminLibraryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [editingEntry, setEditingEntry] = useState<PlantLibraryEntry | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    species_name: "",
    common_name: "",
    description: "",
    light: "",
    water: "",
    difficulty: "",
    toxicity: "",
    image_url: "",
  });
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<PlantLibraryEntry | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Fetch all plant library entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ["plantLibrary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plant_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PlantLibraryEntry[];
    },
  });

  // Client-side filtering
  const filteredEntries = useMemo(() => {
    if (!entries) return [];

    let filtered = entries;

    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter((entry) => entry.source === sourceFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          (entry.species_name && entry.species_name.toLowerCase().includes(query)) ||
          (entry.common_name && entry.common_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [entries, searchQuery, sourceFilter]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<PlantLibraryEntry>;
    }) => {
      const { error } = await supabase
        .from("plant_library")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantLibrary"] });
      toast({ title: "Entry updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update entry", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plant_library")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plantLibrary"] });
      toast({ title: "Entry deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete entry", variant: "destructive" });
    },
  });

  const handleEdit = (entry: PlantLibraryEntry) => {
    setEditingEntry(entry);
    setEditFormData({
      species_name: entry.species_name || "",
      common_name: entry.common_name || "",
      description: entry.description || "",
      light: entry.light || "",
      water: entry.water || "",
      difficulty: entry.difficulty || "",
      toxicity: entry.toxicity_to_pets || "",
      image_url: entry.image_url || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setLoadingAction(editingEntry.id);
    try {
      await updateMutation.mutateAsync({
        id: editingEntry.id,
        updates: {
          species_name: editFormData.species_name || null,
          common_name: editFormData.common_name || null,
          description: editFormData.description || null,
          light: editFormData.light || null,
          water: editFormData.water || null,
          difficulty: editFormData.difficulty || null,
          toxicity_to_pets: editFormData.toxicity || null,
          image_url: editFormData.image_url || null,
        },
      });
      setEditingEntry(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkAsCurated = async (entry: PlantLibraryEntry) => {
    setLoadingAction(entry.id);
    try {
      await updateMutation.mutateAsync({
        id: entry.id,
        updates: { source: "curated" },
      });
      toast({ title: "Marked as curated" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleMarkAsApiFallback = async (entry: PlantLibraryEntry) => {
    setLoadingAction(entry.id);
    try {
      await updateMutation.mutateAsync({
        id: entry.id,
        updates: { source: "api_fallback" },
      });
      toast({ title: "Marked as API fallback" });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmEntry) return;
    setLoadingAction(deleteConfirmEntry.id);
    try {
      await deleteMutation.mutateAsync(deleteConfirmEntry.id);
      setDeleteConfirmEntry(null);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <AdminLayout title="Library">
      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by species or common name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={sourceFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceFilter("all")}
            >
              All
            </Button>
            <Button
              variant={sourceFilter === "curated" ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceFilter("curated")}
            >
              Curated
            </Button>
            <Button
              variant={sourceFilter === "api_fallback" ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceFilter("api_fallback")}
            >
              API Fallback
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Common Name</TableHead>
                <TableHead>Light</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-md" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {searchQuery || sourceFilter !== "all"
                      ? "No entries found matching your filters"
                      : "No plant library entries found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const isLoading = loadingAction === entry.id;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {entry.image_url ? (
                          <img
                            src={entry.image_url}
                            alt={entry.common_name || entry.species_name || "Plant"}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Leaf className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.species_name || "-"}
                      </TableCell>
                      <TableCell>{entry.common_name || "-"}</TableCell>
                      <TableCell className="capitalize">{entry.light || "-"}</TableCell>
                      <TableCell className="capitalize">{entry.water || "-"}</TableCell>
                      <TableCell className="capitalize">{entry.difficulty || "-"}</TableCell>
                      <TableCell>
                        <SourceBadge source={entry.source} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entry)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {entry.source !== "curated" && (
                              <DropdownMenuItem onClick={() => handleMarkAsCurated(entry)}>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Curated
                              </DropdownMenuItem>
                            )}
                            {entry.source !== "api_fallback" && (
                              <DropdownMenuItem onClick={() => handleMarkAsApiFallback(entry)}>
                                <X className="mr-2 h-4 w-4" />
                                Mark as API Fallback
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirmEntry(entry)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Plant Entry</DialogTitle>
            <DialogDescription>
              Update the details for this plant library entry.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Species Name</label>
              <Input
                value={editFormData.species_name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, species_name: e.target.value }))
                }
                placeholder="e.g., Monstera deliciosa"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Common Name</label>
              <Input
                value={editFormData.common_name}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, common_name: e.target.value }))
                }
                placeholder="e.g., Swiss Cheese Plant"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Plant description..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Light</label>
              <Input
                value={editFormData.light}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, light: e.target.value }))
                }
                placeholder="e.g., bright indirect"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Water</label>
              <Input
                value={editFormData.water}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, water: e.target.value }))
                }
                placeholder="e.g., weekly"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Input
                value={editFormData.difficulty}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, difficulty: e.target.value }))
                }
                placeholder="e.g., easy, medium, hard"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Toxicity</label>
              <Input
                value={editFormData.toxicity}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, toxicity: e.target.value }))
                }
                placeholder="e.g., toxic to pets"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Image URL</label>
              <Input
                value={editFormData.image_url}
                onChange={(e) =>
                  setEditFormData((prev) => ({ ...prev, image_url: e.target.value }))
                }
                placeholder="https://example.com/plant.jpg"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loadingAction !== null}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmEntry} onOpenChange={() => setDeleteConfirmEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "
              {deleteConfirmEntry?.common_name || deleteConfirmEntry?.species_name || "this entry"}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loadingAction !== null}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}