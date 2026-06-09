# PlantPal — Production Readiness Guide

> A complete technical roadmap for turning this Vite + React + shadcn/ui prototype into a fully functional, production-grade mobile-first web application.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current State Audit](#2-current-state-audit)
3. [Tech Stack Decisions](#3-tech-stack-decisions)
4. [Backend & Database Architecture](#4-backend--database-architecture)
5. [Authentication & User Management](#5-authentication--user-management)
6. [File Uploads & Media Storage](#6-file-uploads--media-storage)
7. [Making Every Feature Functional](#7-making-every-feature-functional)
8. [Real-Time Features (Live & Chat)](#8-real-time-features-live--chat)
9. [AI Plant Identification](#9-ai-plant-identification)
10. [Push Notifications & Care Reminders](#10-push-notifications--care-reminders)
11. [Responsive Design & PWA](#11-responsive-design--pwa)
12. [State Management](#12-state-management)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment](#14-deployment)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Full Implementation Checklist](#16-full-implementation-checklist)

---

## 1. Project Overview

PlantPal is a social plant-care mobile app with the following core feature areas:

| Feature Area | Pages Involved |
|---|---|
| Plant collection & care tracking | `MyPlantsPage`, `PlantDetailPage`, `HomePage` |
| Social feed & community | `CommunityPage`, `PostCard` |
| Real-time live streaming | `LiveViewerPage`, `LiveHostPage` |
| Direct messaging | `ChatPage` |
| Discovery & AI identification | `ExplorePage` |
| User profile & settings | `ProfilePage` |

---

## 2. Current State Audit

### What exists (UI only)
- All pages are fully built with static/mock data
- Navigation works between pages
- Dark/light theme toggle is wired up (localStorage)
- Form inputs exist but submit nothing
- Buttons trigger navigation but no real actions
- Images are local assets (`src/assets/`)
- No backend, no auth, no database

### What's missing
- User authentication and session management
- A database for plants, posts, users, chats
- File/image upload pipeline
- Real API calls replacing hardcoded arrays
- Live video streaming infrastructure
- WebSocket-based chat
- Push notifications for care reminders
- AI plant identification API integration

---

## 3. Tech Stack Decisions

### Recommended Production Stack

**Frontend (keep as-is)**
- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack Query v5 (already installed — wire it up)

**Backend — Two viable paths:**

#### Option A: Supabase (Fastest path, recommended for solo/small team)
Supabase gives you a PostgreSQL database, Auth, Storage, Realtime subscriptions, and Edge Functions — all with a generous free tier.

```
npm install @supabase/supabase-js
```

#### Option B: Custom Node.js Backend (More control)
```
Express or Fastify + PostgreSQL (via Prisma ORM) + Redis (sessions/queues)
AWS S3 or Cloudflare R2 (media storage)
Socket.io (chat + live notifications)
```

**The rest of this guide uses Supabase for simplicity, with callouts for the custom backend approach where they differ significantly.**

---

## 4. Backend & Database Architecture

### 4.1 Database Schema (PostgreSQL)

Create these tables in Supabase's SQL editor (or your Prisma schema):

```sql
-- Users (extends Supabase Auth)
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  location text,
  followers_count int default 0,
  following_count int default 0,
  plants_count int default 0,
  created_at timestamptz default now()
);

-- Plants collection
create table plants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  nickname text not null,
  species text,
  scientific_name text,
  image_url text,
  health_percent int default 100,
  water_frequency_days int default 7,
  last_watered_at timestamptz,
  next_water_at timestamptz,
  light_requirement text,
  notes text,
  acquired_at date,
  created_at timestamptz default now()
);

-- Care log (journal)
create table care_logs (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references plants(id) on delete cascade,
  user_id uuid references profiles(id),
  care_type text not null, -- 'water', 'fertilize', 'prune', 'repot', 'note'
  notes text,
  image_url text,
  logged_at timestamptz default now()
);

-- Social posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  caption text,
  image_url text,
  plant_id uuid references plants(id),
  tags text[],
  likes_count int default 0,
  comments_count int default 0,
  is_sponsored boolean default false,
  created_at timestamptz default now()
);

-- Likes (deduplicated)
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  text text not null,
  likes_count int default 0,
  created_at timestamptz default now()
);

-- Follows
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

-- Direct messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid references profiles(id) on delete cascade,
  text text,
  image_url text,
  plant_card_id uuid references plants(id),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Conversations
create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids uuid[] not null,
  last_message_at timestamptz default now()
);

-- Live streams
create table live_streams (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references profiles(id),
  title text not null,
  category text,
  thumbnail_url text,
  viewer_count int default 0,
  status text default 'scheduled', -- 'scheduled', 'live', 'ended'
  stream_key text unique,
  started_at timestamptz,
  ended_at timestamptz
);

-- Challenges
create table challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  participants_count int default 0,
  ends_at timestamptz,
  created_at timestamptz default now()
);

create table challenge_entries (
  challenge_id uuid references challenges(id),
  user_id uuid references profiles(id),
  post_id uuid references posts(id),
  primary key (challenge_id, user_id)
);

-- Push notification tokens
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null,
  platform text, -- 'web', 'ios', 'android'
  created_at timestamptz default now()
);
```

### 4.2 Row Level Security (Supabase)

Always enable RLS. Example policies:

```sql
-- Profiles: anyone can read, only owner can update
alter table profiles enable row level security;
create policy "Public profiles" on profiles for select using (true);
create policy "Own profile update" on profiles for update using (auth.uid() = id);

-- Plants: only owner sees/edits their plants
alter table plants enable row level security;
create policy "Own plants" on plants for all using (auth.uid() = owner_id);

-- Posts: anyone can read, only author can delete
alter table posts enable row level security;
create policy "Public posts" on posts for select using (true);
create policy "Own posts write" on posts for insert using (auth.uid() = author_id);
create policy "Own posts delete" on posts for delete using (auth.uid() = author_id);

-- Messages: only conversation participants can read
alter table messages enable row level security;
create policy "Conversation participants" on messages
  for select using (
    auth.uid() = any(
      select participant_ids from conversations where id = conversation_id
    )
  );
```

### 4.3 Supabase Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types' // generated by Supabase CLI

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Generate TypeScript types from your schema:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

---

## 5. Authentication & User Management

### 5.1 Supabase Auth Setup

Supabase Auth handles email/password, magic links, OAuth (Google, Apple) out of the box.

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

```typescript
// src/lib/auth.ts — Auth action helpers
export const signUp = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } }
  })
  if (error) throw error

  // Create profile row
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      display_name: username,
    })
  }
  return data
}

export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () => supabase.auth.signOut()

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google', options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }})
```

### 5.2 Protected Routes

```tsx
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

```tsx
// In App.tsx — wrap protected pages
<Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
<Route path="/my-plants" element={<ProtectedRoute><MyPlantsPage /></ProtectedRoute>} />
// ... all pages except /login and /signup
```

### 5.3 Login/Signup Pages to Create

Create `src/pages/LoginPage.tsx` and `src/pages/SignupPage.tsx`. These pages don't currently exist and must be built. They should use `react-hook-form` + `zod` (both already installed):

```tsx
// Minimal structure for LoginPage.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signInWithGoogle } from '@/lib/auth'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema)
  })
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    await signIn(data.email, data.password)
    navigate('/')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}
      <input {...register('password')} type="password" placeholder="Password" />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
      <button type="button" onClick={signInWithGoogle}>Continue with Google</button>
    </form>
  )
}
```

---

## 6. File Uploads & Media Storage

### 6.1 Supabase Storage Buckets

Create these buckets in the Supabase dashboard (Storage → New bucket):

| Bucket | Public? | Purpose |
|---|---|---|
| `avatars` | Yes | Profile pictures |
| `plant-images` | Yes | Plant photos |
| `post-images` | Yes | Community post images |
| `chat-images` | No | Chat attachments (auth-gated) |
| `live-thumbnails` | Yes | Live stream thumbnails |

Set bucket policies to restrict uploads to authenticated users only:
```sql
create policy "Authenticated uploads" on storage.objects
  for insert to authenticated with check (bucket_id = 'plant-images');

create policy "Public read" on storage.objects
  for select using (bucket_id = 'plant-images');
```

### 6.2 Upload Hook

```typescript
// src/hooks/useUpload.ts
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useUpload(bucket: string) {
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  const upload = async (file: File): Promise<string> => {
    if (!user) throw new Error('Must be authenticated')

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false })

      if (error) throw error

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading }
}
```

### 6.3 Image Compression Before Upload

Install and use browser-image-compression to reduce upload sizes:

```bash
npm install browser-image-compression
```

```typescript
import imageCompression from 'browser-image-compression'

const compressImage = async (file: File) => {
  return imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })
}

// Use before calling upload():
const compressed = await compressImage(selectedFile)
const url = await upload(compressed)
```

### 6.4 Wiring Up the Camera/Upload Button

In `MyPlantsPage.tsx`, the "Add New Plant" button currently navigates nowhere. Here's how to wire it:

```tsx
// Add to MyPlantsPage.tsx
const { upload, uploading } = useUpload('plant-images')
const fileInputRef = useRef<HTMLInputElement>(null)

const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  const imageUrl = await upload(file)
  // Then call your addPlant mutation with imageUrl
}

// In JSX:
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  capture="environment"  // Opens camera on mobile
  className="hidden"
  onChange={handleImageSelect}
/>
<button onClick={() => fileInputRef.current?.click()}>
  {uploading ? 'Uploading...' : 'Add Plant'}
</button>
```

---

## 7. Making Every Feature Functional

### 7.1 TanStack Query Data Layer

TanStack Query is already installed. Create a query/mutation for every data operation:

```typescript
// src/queries/plants.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// Fetch user's plants
export function usePlants() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['plants', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!user,
  })
}

// Add a plant
export function useAddPlant() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (plant: Partial<Plant>) => {
      const { data, error } = await supabase
        .from('plants')
        .insert({ ...plant, owner_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants'] })
    }
  })
}

// Log care action (watering, etc.)
export function useLogCare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ plantId, careType, notes }: CareLogInput) => {
      // 1. Insert care log
      await supabase.from('care_logs').insert({ plant_id: plantId, care_type: careType, notes })
      // 2. Update plant's last_watered_at / next_water_at
      if (careType === 'water') {
        const { data: plant } = await supabase.from('plants').select('water_frequency_days').eq('id', plantId).single()
        const nextWater = new Date()
        nextWater.setDate(nextWater.getDate() + (plant?.water_frequency_days ?? 7))
        await supabase.from('plants').update({
          last_watered_at: new Date().toISOString(),
          next_water_at: nextWater.toISOString(),
        }).eq('id', plantId)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants'] })
  })
}
```

```typescript
// src/queries/posts.ts
export function useFeed(tab: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['feed', tab, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`*, author:profiles(id, username, avatar_url), liked_by_me:likes(user_id)`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (tab === 'Following') {
        // Only get posts from people the user follows
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user!.id)
        const ids = follows?.map(f => f.following_id) ?? []
        query = query.in('author_id', ids)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    }
  })
}

export function useLikePost() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string, liked: boolean }) => {
      if (liked) {
        await supabase.from('likes').insert({ user_id: user!.id, post_id: postId })
        await supabase.rpc('increment_likes', { post_id: postId }) // Postgres function
      } else {
        await supabase.from('likes').delete().match({ user_id: user!.id, post_id: postId })
        await supabase.rpc('decrement_likes', { post_id: postId })
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] })
  })
}
```

### 7.2 HomePage — Care Tasks

Replace hardcoded `careItems` with real data:

```tsx
// In HomePage.tsx
const { data: plants, isLoading } = usePlants()
const logCare = useLogCare()

// Generate today's tasks from plants data
const todayTasks = plants?.filter(p => {
  if (!p.next_water_at) return false
  return new Date(p.next_water_at) <= new Date()
}) ?? []

// Wire the care button:
const handleCareComplete = (plantId: string) => {
  logCare.mutate({ plantId, careType: 'water' })
}
```

### 7.3 CommunityPage — Live Feed

Replace the hardcoded `PostCard` array with `useFeed()`:

```tsx
const { data: posts, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['feed', activeTab],
  queryFn: ({ pageParam = 0 }) => fetchPosts(activeTab, pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.length === 20 ? pages.length : undefined
})

// Infinite scroll via IntersectionObserver:
const sentinelRef = useRef<HTMLDivElement>(null)
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => { if (entries[0].isIntersecting && hasNextPage) fetchNextPage() },
    { threshold: 1 }
  )
  if (sentinelRef.current) observer.observe(sentinelRef.current)
  return () => observer.disconnect()
}, [hasNextPage])

// In JSX after the post list:
<div ref={sentinelRef} className="h-4" />
```

### 7.4 Creating a New Post

The FAB's "New Post" button currently navigates to `/community`. Instead, open a bottom sheet / modal:

```tsx
// src/components/NewPostSheet.tsx
export default function NewPostSheet({ open, onClose }: Props) {
  const { upload, uploading } = useUpload('post-images')
  const createPost = useCreatePost()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')

  const handleSubmit = async () => {
    await createPost.mutateAsync({ image_url: imageUrl, caption, tags: extractTags(caption) })
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh]">
        {/* Image picker */}
        <ImagePicker onUpload={async (file) => {
          const url = await upload(file)
          setImageUrl(url)
        }} />
        {/* Caption textarea */}
        <textarea value={caption} onChange={e => setCaption(e.target.value)}
          placeholder="Write a caption... #tags" className="w-full" />
        <button onClick={handleSubmit} disabled={!imageUrl || createPost.isPending}>
          {createPost.isPending ? 'Posting...' : 'Share'}
        </button>
      </SheetContent>
    </Sheet>
  )
}
```

### 7.5 Profile Page

Wire up real profile data:

```typescript
// src/queries/profile.ts
export function useProfile(userId?: string) {
  const { user } = useAuth()
  const targetId = userId ?? user?.id

  return useQuery({
    queryKey: ['profile', targetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!targetId,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
  })
}
```

The "Edit Profile" button should open a modal using `useUpdateProfile()`, and avatar changes should go through `useUpload('avatars')`.

---

## 8. Real-Time Features (Live & Chat)

### 8.1 Chat with Supabase Realtime

Supabase Realtime lets you subscribe to database changes. No separate WebSocket server needed.

```typescript
// src/hooks/useMessages.ts
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient()

  // Initial load
  const query = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    }
  })

  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, payload => {
        // Add the new message to the cache without refetching
        queryClient.setQueryData(['messages', conversationId], (old: Message[]) => [
          ...(old ?? []),
          payload.new as Message
        ])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  return query
}

// Send a message
export function useSendMessage() {
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ conversationId, text, imageUrl }: SendMessageInput) => {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user!.id,
        text,
        image_url: imageUrl,
      })
      if (error) throw error
    }
  })
}
```

In `ChatPage.tsx`, replace the static `messages` array with `useMessages(conversationId)` and wire the Send button to `useSendMessage()`.

### 8.2 Live Streaming

Live video streaming requires a media server. The recommended approach:

#### Option A: Mux (Easiest, paid)
Mux provides live streaming APIs with a generous free tier for testing.

```bash
npm install @mux/mux-node  # backend only
npm install @mux/mux-player-react  # viewer
```

**Flow:**
1. Host clicks "Go Live" → your backend creates a Mux live stream → returns `stream_key` and `playback_id`
2. Store `stream_key` (secret, sent only to host's browser) and `playback_id` (public) in `live_streams` table
3. Host's browser uses the Web Broadcast SDK to send video to Mux via the stream key
4. Viewers use `<MuxPlayer playbackId={...} />` to watch
5. Mux sends webhooks when stream starts/ends → update `live_streams.status`

```typescript
// src/lib/mux.ts (Supabase Edge Function or your Node backend)
import Mux from '@mux/mux-node'
const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET })

export async function createLiveStream(title: string, hostId: string) {
  const stream = await mux.video.liveStreams.create({
    playback_policy: ['public'],
    new_asset_settings: { playback_policy: ['public'] },
  })
  // Save to DB
  await supabase.from('live_streams').insert({
    host_id: hostId,
    title,
    stream_key: stream.stream_key,
    playback_id: stream.playback_ids?.[0]?.id,
    status: 'live'
  })
  return stream
}
```

#### Option B: Cloudflare Stream (Cheaper at scale)
Similar API, but cheaper for high-volume usage.

### 8.3 Online Presence / Viewer Count

```typescript
// Track who's watching a live stream
const channel = supabase.channel(`live:${streamId}`, {
  config: { presence: { key: user.id } }
})

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    setViewerCount(Object.keys(state).length)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: user.id, online_at: new Date().toISOString() })
    }
  })
```

---

## 9. AI Plant Identification

The "Scan Plant" / "AI Scan" button on `ExplorePage` and `PlantDetailPage` should call a plant identification API.

### Recommended: Plant.id API

```bash
# No npm package needed — just fetch
```

```typescript
// src/lib/plantId.ts
export async function identifyPlant(imageFile: File): Promise<PlantIdentification> {
  const base64 = await fileToBase64(imageFile)

  const response = await fetch('https://api.plant.id/v3/identification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': import.meta.env.VITE_PLANT_ID_API_KEY,
    },
    body: JSON.stringify({
      images: [base64],
      similar_images: true,
      plant_details: ['common_names', 'url', 'wiki_description', 'taxonomy', 'watering', 'propagation_methods'],
    }),
  })

  const data = await response.json()
  return {
    name: data.result.classification.suggestions[0].name,
    commonNames: data.result.classification.suggestions[0].details.common_names,
    confidence: data.result.classification.suggestions[0].probability,
    description: data.result.classification.suggestions[0].details.wiki_description?.value,
    watering: data.result.classification.suggestions[0].details.watering,
  }
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
  })
```

Wire this to the camera button in `ExplorePage`:

```tsx
const [scanResult, setScanResult] = useState<PlantIdentification | null>(null)
const [scanning, setScanning] = useState(false)

const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return
  setScanning(true)
  const result = await identifyPlant(file)
  setScanResult(result)
  setScanning(false)
  // Open result sheet
}
```

---

## 10. Push Notifications & Care Reminders

### 10.1 Web Push (PWA)

```bash
npm install web-push  # server-side only
```

**Flow:**
1. User grants notification permission in browser
2. Browser generates a push subscription (endpoint + keys)
3. Save subscription to `push_tokens` table
4. A cron job (Supabase Edge Function or server) queries plants with `next_water_at <= now()` and sends push notifications

```typescript
// src/lib/notifications.ts
export async function requestNotificationPermission(userId: string) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
  })

  // Save to Supabase
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token: JSON.stringify(subscription),
    platform: 'web'
  })
}
```

```typescript
// Supabase Edge Function: send-care-reminders (runs on a cron schedule)
// supabase/functions/send-care-reminders/index.ts
import webpush from 'npm:web-push'

Deno.serve(async () => {
  webpush.setVapidDetails('mailto:you@example.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  // Find plants that need watering today
  const { data: plants } = await supabaseAdmin
    .from('plants')
    .select('*, owner:profiles(id), push_tokens(token)')
    .lte('next_water_at', new Date().toISOString())
    .eq('notification_sent', false)

  for (const plant of plants ?? []) {
    for (const tokenRow of plant.push_tokens ?? []) {
      await webpush.sendNotification(
        JSON.parse(tokenRow.token),
        JSON.stringify({
          title: `${plant.nickname} needs water! 💧`,
          body: `Time to water your ${plant.species}`,
          icon: plant.image_url,
          data: { url: `/plant/${plant.id}` }
        })
      )
    }
  }

  return new Response('OK')
})
```

Schedule this function to run every morning:
```bash
supabase functions deploy send-care-reminders
# Set cron in Supabase dashboard: "0 8 * * *"  (8 AM daily)
```

---

## 11. Responsive Design & PWA

### 11.1 The App Already Scales Well

The `max-w-lg mx-auto` wrapper in `App.tsx` correctly constrains the layout on desktop. For a better desktop experience, add a sidebar navigation variant that replaces `BottomNav` on wide screens:

```tsx
// In BottomNav.tsx or a new SideNav.tsx
const isDesktop = useIsMobile() === false  // hook already exists

if (isDesktop) return <SidebarNav />
return <BottomNav />
```

### 11.2 Converting to a PWA

Install the Vite PWA plugin:

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PlantPal',
        short_name: 'PlantPal',
        theme_color: '#4caf50',
        background_color: '#f5f7f2',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        start_url: '/',
        scope: '/',
        description: 'Your personal plant care companion',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxAgeSeconds: 60 * 60 } }
          },
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'image-cache', expiration: { maxEntries: 100 } }
          }
        ]
      }
    })
  ]
})
```

Add to `public/`:
- `icon-192.png` (192×192 plant logo)
- `icon-512.png` (512×512 plant logo)
- `icon-maskable.png`

---

## 12. State Management

The app uses React local state everywhere. For production, adopt this layered strategy:

| Layer | Tool | Use For |
|---|---|---|
| Server state | TanStack Query | All API data (plants, posts, profile, messages) |
| Global UI state | Zustand or React Context | Auth user, active chat, notification count |
| Local UI state | `useState` | Form values, modal open/close, tab selection |
| URL state | React Router search params | Filters, search queries, pagination |

```bash
npm install zustand
```

```typescript
// src/store/useAppStore.ts
import { create } from 'zustand'

interface AppStore {
  unreadCount: number
  setUnreadCount: (n: number) => void
  activeConversationId: string | null
  setActiveConversation: (id: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),
  activeConversationId: null,
  setActiveConversation: (id) => set({ activeConversationId: id }),
}))
```

---

## 13. Testing Strategy

The project has Vitest + Testing Library configured. Expand the test suite:

```typescript
// src/queries/__tests__/plants.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { usePlants } from '../plants'
import { createWrapper } from '@/test/utils' // QueryClient wrapper

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [{ id: '1', nickname: 'Monty' }], error: null }),
    }))
  }
}))

test('usePlants returns plant list', async () => {
  const { result } = renderHook(() => usePlants(), { wrapper: createWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toHaveLength(1)
  expect(result.current.data![0].nickname).toBe('Monty')
})
```

### E2E Testing with Playwright

```bash
npm install -D @playwright/test
```

```typescript
// e2e/auth.spec.ts
test('user can sign up, add a plant, and water it', async ({ page }) => {
  await page.goto('/signup')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.fill('[name=username]', 'testuser')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL('/')

  await page.click('text=My Plants')
  await page.click('text=Add New Plant')
  // ... continue flow
})
```

---

## 14. Deployment

### 14.1 Frontend — Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard. Set all `VITE_*` environment variables in Project Settings → Environment Variables.

### 14.2 Vercel Config for SPA Routing

Create `vercel.json` at the project root:

```json
{
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

### 14.3 Database — Supabase

Your Supabase project is already your hosted database. For production:
- Enable **Point-in-Time Recovery** (PITR) backups in Supabase dashboard
- Upgrade to the Pro plan for production SLAs
- Set up a **staging project** for testing migrations

### 14.4 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 15. Environment Variables Reference

Create a `.env.local` file (never commit this):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Plant ID API
VITE_PLANT_ID_API_KEY=your-key

# Mux (Live Streaming)
VITE_MUX_ENV_KEY=your-mux-env-key

# Web Push VAPID
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key

# These go on the server / Supabase Edge Functions (NOT prefixed with VITE_)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MUX_TOKEN_ID=your-mux-token-id
MUX_TOKEN_SECRET=your-mux-token-secret
VAPID_PRIVATE_KEY=your-vapid-private-key
```

**Generate VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

---

## 16. Full Implementation Checklist

Use this as your sprint board. Work top-to-bottom for a logical dependency order.

### Sprint 1 — Foundation
- [ ] Create Supabase project, run schema SQL
- [ ] Install `@supabase/supabase-js`, create `src/lib/supabase.ts`
- [ ] Build `LoginPage.tsx` and `SignupPage.tsx`
- [ ] Implement `useAuth` hook and wrap `App.tsx` with auth context
- [ ] Add `ProtectedRoute` and redirect unauthenticated users
- [ ] Create `ProfilePage` edit flow using `useUpdateProfile`
- [ ] Configure RLS policies for all tables

### Sprint 2 — Plant Collection
- [ ] Wire `MyPlantsPage` to `usePlants()` query
- [ ] Implement `useAddPlant()` mutation with modal/sheet
- [ ] Wire image picker to `useUpload('plant-images')`
- [ ] Implement `useLogCare()` and connect to HomePage care buttons
- [ ] Build care calendar using `care_logs` data
- [ ] Build plant journal log view

### Sprint 3 — Social Feed
- [ ] Wire `CommunityPage` to `useFeed()` infinite query
- [ ] Implement `useLikePost()` and connect to PostCard
- [ ] Build `NewPostSheet` component
- [ ] Connect FAB "New Post" to `NewPostSheet`
- [ ] Implement comments list and `useAddComment()`
- [ ] Implement follow/unfollow with `useFollow()`

### Sprint 4 — Messaging
- [ ] Wire `ChatPage` to `useMessages(conversationId)`
- [ ] Implement `useSendMessage()` and connect Send button
- [ ] Subscribe to Supabase Realtime for new messages
- [ ] Implement image sending in chat
- [ ] Build conversations list page (currently missing)

### Sprint 5 — Live Streaming
- [ ] Set up Mux account and create API keys
- [ ] Implement `createLiveStream` Supabase Edge Function
- [ ] Wire "Go Live" button in `LiveHostPage` to Mux
- [ ] Implement Mux Web Broadcast SDK in `LiveHostPage`
- [ ] Replace `<img>` in `LiveViewerPage` with `<MuxPlayer>`
- [ ] Implement Realtime viewer count with Presence

### Sprint 6 — AI & Notifications
- [ ] Sign up for Plant.id API
- [ ] Implement `identifyPlant()` and wire to scan buttons
- [ ] Build plant identification result sheet
- [ ] Request push permission on first login
- [ ] Save push subscription to `push_tokens` table
- [ ] Create `send-care-reminders` Edge Function with daily cron

### Sprint 7 — PWA & Polish
- [ ] Install and configure `vite-plugin-pwa`
- [ ] Create app icons (192px, 512px, maskable)
- [ ] Implement offline fallback page
- [ ] Add desktop sidebar navigation
- [ ] Add loading skeletons for all data-fetching states
- [ ] Add error boundaries and toast error handling
- [ ] Run Lighthouse audit, fix performance/accessibility issues

### Sprint 8 — Testing & Launch
- [ ] Write unit tests for all query hooks
- [ ] Write E2E tests for critical user flows (signup → add plant → water)
- [ ] Set up GitHub Actions CI
- [ ] Connect Vercel to GitHub repo
- [ ] Configure production environment variables in Vercel
- [ ] Enable Supabase PITR backups
- [ ] Final security audit (check RLS policies, exposed keys)

---

## Third-Party Service Summary

| Service | Purpose | Free Tier |
|---|---|---|
| **Supabase** | Database, Auth, Storage, Realtime | 500MB DB, 1GB storage, 2GB bandwidth |
| **Vercel** | Frontend hosting, CI/CD | Unlimited for hobby |
| **Plant.id** | AI plant identification | 100 requests/month |
| **Mux** | Live video streaming | $0 for dev, pay-per-use |
| **web-push** | Push notifications | Free (self-hosted VAPID) |

---

*Last updated: June 2026 | Stack: Vite 5 · React 18 · TypeScript · Supabase · Tailwind CSS*
