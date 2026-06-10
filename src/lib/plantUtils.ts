export function formatNextWater(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export function isWaterToday(dateStr: string | null): boolean {
  return formatNextWater(dateStr) === "Today";
}

export function healthColor(h: number): string {
  return h > 70 ? "text-plant-success" : h > 40 ? "text-plant-warning" : "text-plant-live";
}

export function healthBg(h: number): string {
  return h > 70 ? "bg-plant-success" : h > 40 ? "bg-plant-warning" : "bg-plant-live";
}