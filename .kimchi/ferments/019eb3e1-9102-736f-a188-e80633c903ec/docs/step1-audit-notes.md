# Step 1: Audit Notes - MyPlantsPage.tsx Undefined Image References

## Issue Found

**File:** `src/pages/MyPlantsPage.tsx`  
**Location:** Journal tab section (lines ~267-280)  
**Severity:** Critical Runtime Bug

### Problem Description

The Journal tab contained hardcoded mock data entries that referenced undefined image variables:
- `monsteraImg` - never imported or defined
- `calatImg` - never imported or defined  
- `pothosImg` - never imported or defined

```tsx
// BEFORE (broken):
{[
  { date: "Mar 6", plant: "Monty", note: "New leaf unfurling! 🌿 Moved to brighter spot.", img: monsteraImg },
  { date: "Mar 3", plant: "Rosa", note: "Leaves curling — adjusted humidity. Misting daily now.", img: calatImg },
  { date: "Feb 28", plant: "Goldie", note: "Started water propagation with 3 cuttings.", img: pothosImg },
].map((entry) => (
  <img src={entry.img} alt={entry.plant} className="w-16 h-16 rounded-xl object-cover" />
))}
```

This would cause runtime crashes when users navigate to the Journal tab.

## Root Cause Analysis

1. The Journal tab data was hardcoded mock data (not wired to real plant data)
2. The developers used placeholder variable names (`monsteraImg`, etc.) that were never imported
3. No validation was in place to catch undefined variable references

## Fix Applied

Replaced the undefined image references with a placeholder component using the already-imported `Leaf` icon from lucide-react:

```tsx
// AFTER (fixed):
<div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
  <Leaf size={24} className="text-muted-foreground" />
</div>
```

### Why This Approach

1. **Minimal change**: Only fixes the immediate crash without refactoring data flow
2. **Uses existing imports**: `Leaf` was already imported from lucide-react
3. **Placeholder design**: Consistent with the app's design language (bg-muted rounded containers)
4. **Non-breaking**: Journal entries still render with visual placeholder

## Verification Results

| Check | Result |
|-------|--------|
| `grep -E 'monsteraImg\|calatImg\|pothosImg' src/pages/MyPlantsPage.tsx` | Exit code 1 (no matches) |
| `npx eslint src/pages/MyPlantsPage.tsx` | Clean (no errors) |
| `npx tsc --noEmit` | No errors in MyPlantsPage.tsx |

## Recommendations for Future Work

1. **Wire Journal to real data**: The Journal tab should fetch entries from a `useJournalEntries()` hook tied to actual plants
2. **Add image_url to journal entries**: If journal entries need plant images, the Plant type should include an `image_url` field
3. **Add ESLint rule**: Consider adding a rule to catch undefined variable references at lint time

## Files Modified

- `src/pages/MyPlantsPage.tsx`

## Status: COMPLETE ✓

All undefined image references have been eliminated. The Journal tab now renders without runtime crashes.