import { ArrowLeft, Heart, Share2, Bookmark, Droplets, Sun, Thermometer, Wind, HelpCircle, Camera, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { usePlant } from "@/queries/plants";
import { useCareLogs, useAddCareLog } from "@/queries/careLogs";
import { useUpload } from "@/hooks/useUpload";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&h=600&fit=crop";

export default function PlantDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const [careType, setCareType] = useState("water");
  const [careNotes, setCareNotes] = useState("");
  const [careImage, setCareImage] = useState<File | null>(null);
  const [careImagePreview, setCareImagePreview] = useState<string | null>(null);

  const addCareLog = useAddCareLog();
  const { uploadFile: uploadCareImage, uploading: careUploading } = useUpload();

  const { data: plant, isLoading, error } = usePlant(id);
  const { data: careLogs = [] } = useCareLogs(id);

  const healthPercent = plant?.health_percent ?? 100;

  const careGuide = [
    {
      icon: Droplets,
      label: "Water",
      value: plant?.water_frequency_days ? `Every ${plant.water_frequency_days} days` : "Not set",
      detail: "Allow soil to dry between waterings",
      color: "text-primary",
    },
    {
      icon: Sun,
      label: "Light",
      value: plant?.light_requirement || "Not set",
      detail: "Tolerates medium light",
      color: "text-plant-warning",
    },
    {
      icon: Thermometer,
      label: "Temperature",
      value: "—",
      detail: "Keep above 60°F",
      color: "text-plant-live",
    },
    {
      icon: Wind,
      label: "Humidity",
      value: "—",
      detail: "Loves high humidity",
      color: "text-plant-sponsored",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading plant...</p>
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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero image */}
      <div className="relative h-72">
        <img
          src={plant.image_url || FALLBACK_IMAGE}
          alt={plant.nickname || plant.scientific_name || "Plant"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-foreground/20" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Like"
            >
              <Heart
                size={18}
                className={liked ? "fill-plant-live text-plant-live" : "text-primary-foreground"}
              />
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Save"
            >
              <Bookmark
                size={18}
                className={saved ? "fill-primary text-primary" : "text-primary-foreground"}
              />
            </button>
            <button
              className="w-9 h-9 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center"
              aria-label="Share"
            >
              <Share2 size={18} className="text-primary-foreground" />
            </button>
          </div>
        </div>
        {/* AI scan badge */}
        <div className="absolute bottom-4 right-4">
          <button className="flex items-center gap-1.5 bg-primary rounded-full px-3 py-2 shadow-fab">
            <Camera size={14} className="text-primary-foreground" />
            <span className="text-xs font-bold text-primary-foreground">AI Scan</span>
          </button>
        </div>
      </div>

      {/* Plant info */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-card rounded-2xl shadow-elevated p-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{plant.nickname || "Unnamed Plant"}</h1>
              <p className="text-sm text-muted-foreground italic">
                {plant.scientific_name || plant.species || "Unknown species"}
              </p>
              {plant.common_name && (
                <p className="text-xs text-primary font-medium mt-1">{plant.common_name}</p>
              )}
            </div>
            <div className="bg-plant-success/10 rounded-xl px-3 py-1.5 text-center">
              <p className="text-lg font-bold text-plant-success">{healthPercent}%</p>
              <p className="text-[10px] text-plant-success font-medium">Healthy</p>
            </div>
          </div>

          {plant.notes && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{plant.notes}</p>
          )}
        </div>
      </div>

      {/* Care Guide */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold mb-3">Care Guide</h2>
        <div className="grid grid-cols-2 gap-2">
          {careGuide.map(({ icon: Icon, label, value, detail, color }) => (
            <div key={label} className="bg-card rounded-xl shadow-card p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={16} className={color} />
                <span className="text-xs font-bold">{label}</span>
              </div>
              <p className="text-sm font-semibold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold mb-3">Growth Timeline</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {["Week 1", "Week 4", "Week 8", "Now"].map((label, i) => (
            <div key={label} className="min-w-[100px] text-center">
              <div
                className={`aspect-square rounded-xl overflow-hidden ${i === 3 ? "ring-2 ring-primary" : ""}`}
              >
                <img
                  src={plant.image_url || FALLBACK_IMAGE}
                  alt={`${label} growth`}
                  className="w-full h-full object-cover"
                  style={{
                    filter: i < 2 ? `brightness(${0.7 + i * 0.1}) saturate(${0.5 + i * 0.2})` : "none",
                  }}
                />
              </div>
              <p className="text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ask Community */}
      <div className="px-4 mt-4">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-primary/10 rounded-2xl text-primary font-semibold text-sm">
          <HelpCircle size={16} />
          Ask Community About This Plant
        </button>
      </div>

      {/* Comments */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Discussion</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">Community tips coming soon!</p>
      </div>

      {/* Care History */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Care History</h2>
          <span className="text-xs text-muted-foreground">{careLogs.length} entries</span>
        </div>
        {careLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No care logs yet. Log your first care event below!</p>
        ) : (
          <div className="space-y-3">
            {careLogs.map((log) => (
              <div key={log.id} className="bg-card rounded-2xl shadow-card p-3 flex gap-3">
                {log.image_url ? (
                  <img src={log.image_url} alt={log.care_type} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Droplets size={20} className="text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold capitalize">{log.care_type}</p>
                    <span className="text-xs text-muted-foreground">
                      {log.logged_at ? new Date(log.logged_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  {log.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Care Logging */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold mb-3">Log Care</h2>
        <div className="bg-card rounded-2xl shadow-card p-4 flex flex-col gap-3">
          {/* Care type selector */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
            <Select value={careType} onValueChange={setCareType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="fertilize">Fertilize</SelectItem>
                <SelectItem value="prune">Prune</SelectItem>
                <SelectItem value="repot">Repot</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
            <Textarea
              value={careNotes}
              onChange={(e) => setCareNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={3}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Photo (optional)</label>
            {careImagePreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden">
                <img src={careImagePreview} alt="Care preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCareImage(null);
                    setCareImagePreview(null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <X size={14} className="text-primary-foreground" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-colors text-muted-foreground">
                <Camera size={20} />
                <span className="text-sm font-medium">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCareImage(file);
                      setCareImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Error message */}
          {addCareLog.isError && (
            <p className="text-xs text-destructive">Failed to log care. Please try again.</p>
          )}

          {/* Submit button */}
          <button
            onClick={async () => {
              try {
                let careImageUrl: string | undefined;
                if (careImage) {
                  careImageUrl = (await uploadCareImage(careImage, { bucket: "plant-images" })).url;
                }
                await addCareLog.mutateAsync({
                  plant_id: id!,
                  care_type: careType,
                  notes: careNotes || undefined,
                  image_url: careImageUrl,
                });
                setCareType("water");
                setCareNotes("");
                setCareImage(null);
                setCareImagePreview(null);
              } catch {
                // error state is handled by isError
              }
            }}
            disabled={addCareLog.isPending || careUploading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {(addCareLog.isPending || careUploading) && <Loader2 size={16} className="animate-spin" />}
            {(addCareLog.isPending || careUploading) ? "Logging..." : "Log Care"}
          </button>
        </div>
      </div>
    </div>
  );
}