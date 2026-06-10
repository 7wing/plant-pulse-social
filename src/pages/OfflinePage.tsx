import { Leaf } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Leaf className="w-16 h-16 text-primary" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">You're offline</h1>
          <p className="text-muted-foreground">
            Check your internet connection and try again.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Reload
        </button>
      </div>
    </div>
  );
}