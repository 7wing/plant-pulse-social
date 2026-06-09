import { useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";

interface UploadOptions {
  bucket: string;
  fileName?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadFile(file: File, options: UploadOptions): Promise<UploadResult> {
    setUploading(true);
    setProgress(0);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: options.maxSizeMB ?? 1,
        maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
        useWebWorker: true,
        onProgress: (p) => setProgress(Math.round(p * 100)),
      });

      const ext = compressed.name.split(".").pop() ?? "jpg";
      const path = options.fileName
        ? `${options.fileName}.${ext}`
        : `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(path, compressed, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(options.bucket).getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Failed to get public URL");

      return { url: data.publicUrl, path };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return { uploadFile, uploading, progress };
}
