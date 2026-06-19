import type { PlantLibraryEntry } from "@/queries/plantLibrary";

export function getToxicityDisplay(entry: PlantLibraryEntry): string | null {
  const parts: string[] = [];
  if (entry.toxicity_to_pets && entry.toxicity_to_pets.trim()) {
    parts.push(`Toxic to pets: ${entry.toxicity_to_pets}`);
  }
  if (entry.toxicity_to_humans) {
    parts.push("Toxic to humans");
  }
  if (parts.length > 0) return parts.join("; ");
  if (entry.toxicity_to_pets === null && entry.toxicity_to_humans === null) return null;
  return "Non-toxic";
}
