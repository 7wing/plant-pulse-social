# Supabase Setup Steps for PlantPal

> Run these steps in order before starting the application. After the schema is created, generate TypeScript types and start the dev server.

---

## Step 1 — Run the Full Schema SQL

Open the **Supabase SQL Editor** (Dashboard → SQL Editor → New query), paste the entire block below, and click **Run**.

```sql
-- =====================================================
-- 1. Profiles (extends Supabase Auth users)
-- =====================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
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

-- =====================================================
-- 2. Plants collection
-- =====================================================
create table if not exists plants (
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

-- =====================================================
-- 3. Care log (journal)
-- =====================================================
create table if not exists care_logs (
  id uuid primary key default gen_random_uuid(),
  plant_id uuid references plants(id) on delete cascade,
  user_id uuid references profiles(id),
  care_type text not null, -- 'water', 'fertilize', 'prune', 'repot', 'note'
  notes text,
  image_url text,
  logged_at timestamptz default now()
);

-- =====================================================
-- 4. Social posts
-- =====================================================
create table if not exists posts (
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

-- =====================================================
-- 5. Likes (deduplicated)
-- =====================================================
create table if not exists likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- =====================================================
-- 6. Comments
-- =====================================================
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  text text not null,
  likes_count int default 0,
  created_at timestamptz default now()
);

-- =====================================================
-- 7. Follows
-- =====================================================
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  primary key (follower_id, following_id)
);

-- =====================================================
-- 8. Direct messages
-- =====================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  sender_id uuid references profiles(id) on delete cascade,
  text text,
  image_url text,
  plant_card_id uuid references plants(id),
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =====================================================
-- 9. Conversations
-- =====================================================
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  participant_ids uuid[] not null,
  last_message_at timestamptz default now()
);

-- =====================================================
-- 10. Live streams
-- =====================================================
create table if not exists live_streams (
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

-- =====================================================
-- 11. Challenges
-- =====================================================
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  participants_count int default 0,
  ends_at timestamptz,
  created_at timestamptz default now()
);

-- =====================================================
-- 12. Challenge entries
-- =====================================================
create table if not exists challenge_entries (
  challenge_id uuid references challenges(id),
  user_id uuid references profiles(id),
  post_id uuid references posts(id),
  primary key (challenge_id, user_id)
);

-- =====================================================
-- 13. Push notification tokens
-- =====================================================
create table if not exists push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null,
  platform text, -- 'web', 'ios', 'android'
  created_at timestamptz default now()
);
```

---

## Step 2 — Enable Row Level Security (RLS)

Run this second block in the SQL Editor to enable RLS on **every table**.

```sql
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table plants enable row level security;
alter table care_logs enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table follows enable row level security;
alter table messages enable row level security;
alter table conversations enable row level security;
alter table live_streams enable row level security;
alter table challenges enable row level security;
alter table challenge_entries enable row level security;
alter table push_tokens enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles"
  on profiles for select using (true);

create policy "Own profile update"
  on profiles for update using (auth.uid() = id);

create policy "Own profile insert"
  on profiles for insert with check (auth.uid() = id);

-- Plants: only owner sees/edits their plants
create policy "Own plants"
  on plants for all using (auth.uid() = owner_id);

-- Care logs: only owner sees/edits
create policy "Own care logs"
  on care_logs for all using (auth.uid() = user_id);

-- Posts: anyone can read, only author can insert/delete
create policy "Public posts"
  on posts for select using (true);

create policy "Own posts write"
  on posts for insert with check (auth.uid() = author_id);

create policy "Own posts delete"
  on posts for delete using (auth.uid() = author_id);

-- Likes: users can only like/unlike as themselves
create policy "Own likes"
  on likes for all using (auth.uid() = user_id);

-- Comments: anyone can read, only author can delete
create policy "Public comments"
  on comments for select using (true);

create policy "Own comments write"
  on comments for insert with check (auth.uid() = author_id);

create policy "Own comments delete"
  on comments for delete using (auth.uid() = author_id);

-- Follows: users manage their own follows
create policy "Own follows"
  on follows for all using (auth.uid() = follower_id);

-- Messages: only conversation participants can read
create policy "Conversation participants"
  on messages for select using (
    auth.uid() = any(
      select unnest(participant_ids) from conversations where id = conversation_id
    )
  );

create policy "Conversation participants insert"
  on messages for insert with check (
    auth.uid() = any(
      select unnest(participant_ids) from conversations where id = conversation_id
    )
  );

-- Conversations: participants only
create policy "Conversation access"
  on conversations for all using (auth.uid() = any(participant_ids));

-- Live streams: public read, host-only write
create policy "Public live streams"
  on live_streams for select using (true);

create policy "Host live streams"
  on live_streams for all using (auth.uid() = host_id);

-- Challenges: public read
create policy "Public challenges"
  on challenges for select using (true);

-- Challenge entries: participants only
create policy "Own challenge entries"
  on challenge_entries for all using (auth.uid() = user_id);

-- Push tokens: owner only
create policy "Own push tokens"
  on push_tokens for all using (auth.uid() = user_id);
```

---

## Step 3 — Optional: Database Trigger for Email Confirmation

If your Supabase project has **email confirmation enabled** (default in production projects), the client-side profile insert after `auth.signUp` will fail because the user is not yet authenticated. Use this trigger to auto-create the profile row on the server:

```sql
-- Create the trigger function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Attach it to auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

> **Note:** If you add this trigger, you can remove the client-side `profiles.insert` from `src/lib/auth.ts` — or leave both; the `on conflict` pattern will safely noop.

---

## Step 4 — Create Storage Buckets

Go to **Supabase Dashboard → Storage → New bucket**. Create these buckets:

| Bucket | Public? | Purpose |
|---|---|---|
| `avatars` | ✅ Yes | Profile pictures |
| `plant-images` | ✅ Yes | Plant photos |
| `post-images` | ✅ Yes | Community post images |
| `chat-images` | ❌ No | Chat attachments (auth-gated) |
| `live-thumbnails` | ✅ Yes | Live stream thumbnails |

After creating each bucket, set the **RLS policies** for the public buckets. In the bucket settings → Policies, add:

```sql
-- Allow authenticated users to upload to any bucket
create policy "Authenticated uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('avatars', 'plant-images', 'post-images', 'chat-images', 'live-thumbnails'));

-- Allow public read on public buckets
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Public read plant-images"
  on storage.objects for select
  using (bucket_id = 'plant-images');

create policy "Public read post-images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Public read live-thumbnails"
  on storage.objects for select
  using (bucket_id = 'live-thumbnails');

-- Chat images: only authenticated users can read (they are private attachments)
create policy "Authenticated read chat-images"
  on storage.objects for select to authenticated
  using (bucket_id = 'chat-images');
```

Run the above SQL in the SQL Editor after creating the buckets.

---

## Step 5 — Generate TypeScript Database Types

After the schema and RLS are live, generate the typed Supabase client:

```bash
npx supabase gen types typescript --project-id kjmgtctcwwqsrepoldor > src/lib/database.types.ts
```

Replace `kjmgtctcwwqsrepoldor` with your actual Supabase project reference ID if different.

> The initial `src/lib/database.types.ts` created in this Sprint contains a minimal placeholder type for the `profiles` table so TypeScript compiles before the full type generation step. Running the command above will overwrite it with the complete, auto-generated schema types.

---

## Step 6 — Confirm Environment Variables

Your `.env.local` should already contain these. Verify they are correct:

```env
VITE_SUPABASE_URL=https://kjmgtctcwwqsrepoldor.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PLANT_ID_API_KEY=your-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_LIVEKIT_URL=wss://your-app.livekit.cloud
```

**Never** prefix server-only secrets with `VITE_`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-secret
VAPID_PRIVATE_KEY=your-vapid-private-key
```

---

## Done

Once all steps above are completed, run:

```bash
npm install
npm run dev
```

and log in or sign up to test the auth flow.
