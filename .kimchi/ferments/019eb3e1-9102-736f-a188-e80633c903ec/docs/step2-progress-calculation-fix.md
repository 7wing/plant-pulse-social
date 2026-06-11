# Step 2: Fix Progress Calculation - Investigation & Implementation Notes

## Issue
**Location:** `src/pages/HomePage.tsx`

**Problem:** The daily progress summary calculation was treating null/unscheduled tasks as "completed", giving users an inflated sense of progress.

### Root Cause Analysis
The original code had this logic:
```typescript
const completedCount = totalCount - urgentCount;
```

This meant:
- `urgent = true` → needs water today/tomorrow (triggers notification)
- `urgent = false` → NOT counted as completed

However, `getTaskInfo()` returns `urgent: false` for BOTH:
1. Tasks scheduled 2+ days away (legitimately not urgent)
2. Tasks with `null` next_water_at (unscheduled → "Not scheduled")

This caused unscheduled/null tasks to be incorrectly counted as "completed" in the progress ring.

## Implementation

### Changes Made to `src/pages/HomePage.tsx`

1. **Added explicit `completed` field to careTasks:**
   ```typescript
   const isCompleted =
     plant.completed === true ||
     plant.status === "completed" ||
     (typeof plant.status === "string" && plant.status.toLowerCase() === "completed");
   
   return {
     id: plant.id,
     name: plant.nickname,
     task: taskInfo.text,
     img: plant.image_url || FALLBACK_PLANT_IMAGE,
     urgent: taskInfo.urgent,
     completed: isCompleted,  // NEW: explicit completion flag
     icon: Droplets,
   };
   ```

2. **Updated progress calculation:**
   ```typescript
   // Only count tasks that are explicitly completed
   // Exclude null/unscheduled tasks from the completed count
   const completedCount = careTasks.filter((t) => t.completed).length;
   ```

3. **Updated task card rendering:**
   - Changed `const done = !r.urgent` → `r.completed`
   - All references to `done` now use `r.completed`

### Why This Fix Works
- Tasks with `null` next_water_at have `completed: false` (not counted as done)
- Only tasks with explicit `completed: true` or `status: 'completed'` are counted
- Progress bar now accurately reflects actual completed tasks
- Visual styling (opacity, strikethrough) tied to actual completion status

## Verification Results

### Command: `grep -E 'progress|completed' src/pages/HomePage.tsx`
```
✓ Found 14 matches for progress/completed keywords
✓ New `completed` field properly added to careTasks
✓ completedCount uses .filter((t) => t.completed) pattern
```

### ESLint: `npx eslint src/pages/HomePage.tsx`
```
✓ No errors
✓ Clean lint
```

### TypeScript: `npx tsc --noEmit`
```
✓ No type errors
✓ Compiles cleanly
```

## Impact
- **User Experience:** Progress ring now shows 0% until tasks are explicitly marked complete
- **Data Integrity:** Unscheduled tasks no longer inflate completion metrics
- **UI Accuracy:** Task cards show checkmark only when `completed` is true

## Files Modified
- `src/pages/HomePage.tsx` - 5 edit blocks (completion logic + rendering)

## Status: COMPLETE