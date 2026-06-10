import imageCompression from "browser-image-compression";

export interface PlantSuggestion {
  scientificName: string;
  commonNames: string[];
  score: number;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function identifyPlant(imageFile: File): Promise<PlantSuggestion[]> {
  const compressed = await imageCompression(imageFile, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  });

  const base64 = await fileToBase64(compressed);

  const res = await fetch("https://api.plant.id/v3/identification?details=common_names", {
    method: "POST",
    headers: {
      "Api-Key": import.meta.env.VITE_PLANT_ID_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ images: [base64] }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  interface Suggestion {
    name: string;
    details?: { common_names?: string[] };
    probability: number;
  }
  return data.result.classification.suggestions.slice(0, 3).map((s: Suggestion) => ({
    scientificName: s.name,
    commonNames: s.details?.common_names ?? [],
    score: s.probability,
  }));
}