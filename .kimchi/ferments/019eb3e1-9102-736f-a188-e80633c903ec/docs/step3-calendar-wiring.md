# Phase 3 Step 3: Calendar Tab Wired to useCareLogs

## Task
Replace hardcoded calendar samples with real care log data from `useCareLogs` query.

## Files Modified

### 1. src/queries/careLogs.ts
**Change:** Added `useAllCareLogs` hook

**Reason:** The existing `useCareLogs` hook requires a `plantId` parameter, making it unsuitable for the calendar tab which needs to display care activities across all plants.

**New Hook Implementation:**
```typescript
export function useAllCareLogs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["careLogs", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_logs")
        .select("*")
        .eq("user_id", user!.id)
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });
}
```

### 2. src/pages/MyPlantsPage.tsx
**Changes:**
1. Added import: `import { useAllCareLogs } from "@/queries/careLogs";`
2. Replaced inline calendar section with `<CalendarTab />` component
3. Added new `CalendarTab` component that:
   - Uses `useAllCareLogs` to fetch all care logs for current user
   - Groups care logs by day of week (Sun-Sat)
   - Maps care types to icons and colors (Water/Droplets, Fertilize/Sun, Prune/Scissors, Repot/Leaf)
   - Shows loading skeletons while data loads
   - Shows empty state message when no care logs exist

## What Was Removed
Hardcoded sample data:
```typescript
// REMOVED - static array with fake activities
{i % 2 === 0 && (
  <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
    <Droplets size={10} className="text-primary" />
    <span className="text-xs text-primary font-medium">Water</span>
  </div>
)}
// Similar for Prune, Rotate on specific days
```

## What Was Added
- Real data from Supabase `care_logs` table
- Dynamic grouping by day of week from `logged_at` timestamp
- Icon/color mapping based on `care_type` field
- Empty state messaging for no data
- Loading skeleton states

## Verification
```bash
$ grep 'useAllCareLogs' src/pages/MyPlantsPage.tsx src/queries/careLogs.ts
src/pages/MyPlantsPage.tsx:8:import { useAllCareLogs } from "@/queries/careLogs";
src/pages/MyPlantsPage.tsx:487:  const { data: careLogs = [], isLoading } = useAllCareLogs();
src/queries/careLogs.ts:29:export function useAllCareLogs() {
```

## Build & Lint Status
- **TypeScript:** Compiles without errors
- **ESLint:** 2 pre-existing errors in posts.ts (unrelated), 0 new errors introduced

## Next Steps
- Journal tab still has hardcoded sample entries (Step 4)