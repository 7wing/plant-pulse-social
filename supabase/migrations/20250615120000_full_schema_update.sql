-- ============================================================================
-- PlantPal Full Schema Update Migration
-- Timestamp: 20250615120000
-- Description: Comprehensive schema update including new columns, tables, RLS, and indexes
-- ============================================================================

-- ============================================================================
-- SECTION 1: New columns on existing tables
-- ============================================================================

-- 1.1 profiles table - add role, interests, and notification settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'moderator', 'admin'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location_hidden BOOLEAN DEFAULT false;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings_care_reminders BOOLEAN DEFAULT true;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings_social_notifications BOOLEAN DEFAULT true;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings_challenge_notifications BOOLEAN DEFAULT false;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'banned'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- 1.2 plants table - add location
ALTER TABLE plants ADD COLUMN IF NOT EXISTS location TEXT;

-- 1.3 posts table - add media_urls and challenge_id
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT[] DEFAULT '{}';

ALTER TABLE posts ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL;

-- 1.4 care_logs table - add task_id and scheduled_due
ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES care_tasks(id) ON DELETE SET NULL;

ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS scheduled_due TIMESTAMPTZ;

-- 1.5 challenges table - extend with additional fields
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'challenge'
  CHECK (type IN ('challenge', 'event'));

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS location TEXT;

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming'
  CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled'));

ALTER TABLE challenges ADD COLUMN IF NOT EXISTS proposer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 2: New tables
-- ============================================================================

-- 2.1 care_tasks - recurring plant care task management
CREATE TABLE IF NOT EXISTS care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('water', 'fertilize', 'repot', 'custom')),
  due_date TIMESTAMPTZ,
  repeat_interval INTEGER,
  repeat_unit TEXT CHECK (repeat_unit IN ('days', 'weeks', 'months', 'years')),
  is_recurring BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.2 plant_library - curated and fallback plant species database
CREATE TABLE IF NOT EXISTS plant_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  species_name TEXT,
  common_name TEXT,
  description TEXT,
  image_url TEXT,
  light TEXT,
  water TEXT,
  difficulty TEXT,
  toxicity TEXT,
  source TEXT DEFAULT 'api_fallback' CHECK (source IN ('curated', 'api_fallback')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 notifications - user notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('care_reminder', 'like', 'comment', 'follow', 'proposal_approved', 'proposal_rejected', 'challenge_reminder', 'event_reminder', 'badge', 'report_update')),
  title TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.4 reports - content moderation reporting system
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT CHECK (target_type IN ('post', 'comment', 'user')),
  target_id UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed', 'resolved')),
  moderator_note TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 proposals - community challenge/event proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('challenge', 'event')),
  title TEXT NOT NULL,
  description TEXT,
  proposed_options JSONB DEFAULT '[]',
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderator_note TEXT,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 saved_guides - user bookmarked plant library entries
CREATE TABLE IF NOT EXISTS saved_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plant_library_id UUID NOT NULL REFERENCES plant_library(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, plant_library_id)
);

-- 2.7 blocked_users - user blocking functionality
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

-- 2.8 violations - admin audit trail for user actions
CREATE TABLE IF NOT EXISTS violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('warn', 'suspend', 'ban', 'unban', 'promote', 'demote')),
  duration_hours INTEGER,
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 3: Enable RLS on all new tables
-- ============================================================================

ALTER TABLE care_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on existing tables if not already enabled (for tables we modify)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 4: RLS Policies
-- ============================================================================

-- 4.1 profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4.2 plants policies
DROP POLICY IF EXISTS "Plant owners have full access" ON plants;
CREATE POLICY "Plant owners have full access"
  ON plants FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Anyone can view plants for profile browsing" ON plants;
CREATE POLICY "Anyone can view plants for profile browsing"
  ON plants FOR SELECT
  USING (true);

-- 4.3 care_logs policies
DROP POLICY IF EXISTS "Users can manage their own care logs" ON care_logs;
CREATE POLICY "Users can manage their own care logs"
  ON care_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4.4 posts policies
DROP POLICY IF EXISTS "Posts are public for reading" ON posts;
CREATE POLICY "Posts are public for reading"
  ON posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authors can insert posts" ON posts;
CREATE POLICY "Authors can insert posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own posts" ON posts;
CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own posts" ON posts;
CREATE POLICY "Authors can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- 4.5 comments policies
DROP POLICY IF EXISTS "Comments are public for reading" ON comments;
CREATE POLICY "Comments are public for reading"
  ON comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
CREATE POLICY "Authenticated users can insert comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own comments" ON comments;
CREATE POLICY "Authors can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own comments" ON comments;
CREATE POLICY "Authors can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- 4.6 likes policies
DROP POLICY IF EXISTS "Likes are public for reading" ON likes;
CREATE POLICY "Likes are public for reading"
  ON likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON likes;
CREATE POLICY "Users can like posts"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users unlike posts" ON likes;
CREATE POLICY "Users can unlike posts"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- 4.7 follows policies
DROP POLICY IF EXISTS "Follows are public for reading" ON follows;
CREATE POLICY "Follows are public for reading"
  ON follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 4.8 messages policies
DROP POLICY IF EXISTS "Conversation participants can view messages" ON messages;
CREATE POLICY "Conversation participants can view messages"
  ON messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT unnest(participant_ids) FROM conversations WHERE id = conversation_id
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON messages;
CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT unnest(participant_ids) FROM conversations WHERE id = conversation_id
    )
  );

DROP POLICY IF EXISTS "Participants can update messages" ON messages;
CREATE POLICY "Participants can update messages"
  ON messages FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT unnest(participant_ids) FROM conversations WHERE id = conversation_id
    )
  );

-- 4.9 conversations policies
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

-- 4.10 live_streams policies
DROP POLICY IF EXISTS "Live streams are public for viewing" ON live_streams;
CREATE POLICY "Live streams are public for viewing"
  ON live_streams FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Hosts can update their streams" ON live_streams;
CREATE POLICY "Hosts can update their streams"
  ON live_streams FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Authenticated users can create streams" ON live_streams;
CREATE POLICY "Authenticated users can create streams"
  ON live_streams FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- 4.11 challenges policies
DROP POLICY IF EXISTS "Challenges are public for reading" ON challenges;
CREATE POLICY "Challenges are public for reading"
  ON challenges FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create challenges" ON challenges;
CREATE POLICY "Authenticated users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);

-- 4.12 challenge_entries policies
DROP POLICY IF EXISTS "Challenge entries are public for reading" ON challenge_entries;
CREATE POLICY "Challenge entries are public for reading"
  ON challenge_entries FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can enter challenges" ON challenge_entries;
CREATE POLICY "Users can enter challenges"
  ON challenge_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their entries" ON challenge_entries;
CREATE POLICY "Users can remove their entries"
  ON challenge_entries FOR DELETE
  USING (auth.uid() = user_id);

-- 4.13 care_tasks policies
DROP POLICY IF EXISTS "Users can view their own care tasks" ON care_tasks;
CREATE POLICY "Users can view their own care tasks"
  ON care_tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create care tasks" ON care_tasks;
CREATE POLICY "Users can create care tasks"
  ON care_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own care tasks" ON care_tasks;
CREATE POLICY "Users can update their own care tasks"
  ON care_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own care tasks" ON care_tasks;
CREATE POLICY "Users can delete their own care tasks"
  ON care_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 4.14 plant_library policies
DROP POLICY IF EXISTS "Plant library is public for reading" ON plant_library;
CREATE POLICY "Plant library is public for reading"
  ON plant_library FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Moderators and admins can insert plant library entries" ON plant_library;
CREATE POLICY "Moderators and admins can insert plant library entries"
  ON plant_library FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators and admins can update plant library entries" ON plant_library;
CREATE POLICY "Moderators and admins can update plant library entries"
  ON plant_library FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators and admins can delete plant library entries" ON plant_library;
CREATE POLICY "Moderators and admins can delete plant library entries"
  ON plant_library FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- 4.15 notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON notifications;
CREATE POLICY "Users can update their own notifications (mark as read)"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No direct INSERT policy for users - notifications are created via service role functions

-- 4.16 reports policies
DROP POLICY IF EXISTS "Reporters can view their own reports" ON reports;
CREATE POLICY "Reporters can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can submit reports" ON reports;
CREATE POLICY "Users can submit reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Moderators and admins can view all reports" ON reports;
CREATE POLICY "Moderators and admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators and admins can update reports" ON reports;
CREATE POLICY "Moderators and admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- 4.17 proposals policies
DROP POLICY IF EXISTS "Submitters can view their own proposals" ON proposals;
CREATE POLICY "Submitters can view their own proposals"
  ON proposals FOR SELECT
  USING (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "Users can submit proposals" ON proposals;
CREATE POLICY "Users can submit proposals"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "Submitters can update their own proposals" ON proposals;
CREATE POLICY "Submitters can update their own proposals"
  ON proposals FOR UPDATE
  USING (auth.uid() = submitter_id)
  WITH CHECK (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "Everyone can view approved proposals" ON proposals;
CREATE POLICY "Everyone can view approved proposals"
  ON proposals FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Moderators and admins can view all pending proposals" ON proposals;
CREATE POLICY "Moderators and admins can view all pending proposals"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators and admins can update proposals" ON proposals;
CREATE POLICY "Moderators and admins can update proposals"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- 4.18 saved_guides policies
DROP POLICY IF EXISTS "Users can view their own saved guides" ON saved_guides;
CREATE POLICY "Users can view their own saved guides"
  ON saved_guides FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save guides" ON saved_guides;
CREATE POLICY "Users can save guides"
  ON saved_guides FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave guides" ON saved_guides;
CREATE POLICY "Users can unsave guides"
  ON saved_guides FOR DELETE
  USING (auth.uid() = user_id);

-- 4.19 blocked_users policies
DROP POLICY IF EXISTS "Users can view their own blocked list" ON blocked_users;
CREATE POLICY "Users can view their own blocked list"
  ON blocked_users FOR SELECT
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block other users" ON blocked_users;
CREATE POLICY "Users can block other users"
  ON blocked_users FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock users" ON blocked_users;
CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  USING (auth.uid() = blocker_id);

-- 4.20 violations policies
DROP POLICY IF EXISTS "Users can view their own violations" ON violations;
CREATE POLICY "Users can view their own violations"
  ON violations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Moderators and admins can view all violations" ON violations;
CREATE POLICY "Moderators and admins can view all violations"
  ON violations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

DROP POLICY IF EXISTS "Moderators and admins can create violations" ON violations;
CREATE POLICY "Moderators and admins can create violations"
  ON violations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('moderator', 'admin')
    )
  );

-- 4.21 saved_posts policies (from previous migration - keeping for consistency)
DROP POLICY IF EXISTS "Users can view their own saved posts" ON saved_posts;
CREATE POLICY "Users can view their own saved posts"
  ON saved_posts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save posts" ON saved_posts;
CREATE POLICY "Users can save posts"
  ON saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unsave posts" ON saved_posts;
CREATE POLICY "Users can unsave posts"
  ON saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: Indexes for performance
-- ============================================================================

-- care_tasks indexes
CREATE INDEX IF NOT EXISTS idx_care_tasks_plant_id ON care_tasks(plant_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_user_id ON care_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_due_date ON care_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_care_tasks_composite ON care_tasks(plant_id, user_id, due_date);

-- plant_library indexes
CREATE INDEX IF NOT EXISTS idx_plant_library_species_name ON plant_library(species_name);
CREATE INDEX IF NOT EXISTS idx_plant_library_common_name ON plant_library(common_name);

-- notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at);

-- reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status_created ON reports(status, created_at);

-- proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_status_created ON proposals(status, created_at);

-- saved_guides indexes
CREATE INDEX IF NOT EXISTS idx_saved_guides_user_id ON saved_guides(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_guides_plant_library_id ON saved_guides(plant_library_id);

-- blocked_users indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON blocked_users(blocked_id);

-- posts indexes (existing but adding more)
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_challenge_id ON posts(challenge_id);

-- comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at);

-- follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- challenges indexes
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_starts_at ON challenges(starts_at);
CREATE INDEX IF NOT EXISTS idx_challenges_proposer_id ON challenges(proposer_id);

-- violations indexes
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_action ON violations(action);

-- profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- ============================================================================
-- SECTION 6: Triggers
-- ============================================================================

-- ============================================================================
-- 6.1 Helper function: Create notification
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_actor_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
  VALUES (p_user_id, p_actor_id, p_type, p_title, p_message, p_metadata);
END;
$$;

-- ============================================================================
-- 6.2 Care Task Recurrence Trigger
-- When a care_log is inserted with a non-null task_id, auto-complete the task
-- and create a new recurring task with the updated due_date.
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_care_task_recurrence() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_task RECORD;
  v_next_due_date TIMESTAMPTZ;
  v_completed_date TIMESTAMPTZ;
BEGIN
  -- Only process if task_id is provided
  IF NEW.task_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Fetch the care_task
  SELECT * INTO v_task FROM care_tasks WHERE id = NEW.task_id;

  -- Only process if task exists and is recurring
  IF NOT FOUND OR v_task.is_recurring = false OR v_task.completed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine the completed date (prefer logged_at from care_log, fallback to now)
  v_completed_date := COALESCE(NEW.logged_at, now());

  -- Calculate next due date based on repeat_unit
  IF v_task.repeat_unit = 'days' THEN
    v_next_due_date := v_task.due_date + (v_task.repeat_interval || ' days')::INTERVAL;
  ELSIF v_task.repeat_unit = 'weeks' THEN
    v_next_due_date := v_task.due_date + ((v_task.repeat_interval * 7) || ' days')::INTERVAL;
  ELSIF v_task.repeat_unit = 'months' THEN
    v_next_due_date := v_task.due_date + (v_task.repeat_interval || ' months')::INTERVAL;
  ELSIF v_task.repeat_unit = 'years' THEN
    v_next_due_date := v_task.due_date + ((v_task.repeat_interval * 12) || ' months')::INTERVAL;
  ELSE
    -- Default: add days based on repeat_interval
    v_next_due_date := v_task.due_date + ((COALESCE(v_task.repeat_interval, 1)) || ' days')::INTERVAL;
  END IF;

  -- Mark the current task as completed
  UPDATE care_tasks SET completed_at = v_completed_date WHERE id = v_task.id;

  -- Insert the new recurring task
  INSERT INTO care_tasks (
    plant_id,
    user_id,
    task_name,
    task_type,
    due_date,
    repeat_interval,
    repeat_unit,
    is_recurring,
    completed_at
  ) VALUES (
    v_task.plant_id,
    v_task.user_id,
    v_task.task_name,
    v_task.task_type,
    v_next_due_date,
    v_task.repeat_interval,
    v_task.repeat_unit,
    true,
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS handle_care_task_recurrence ON care_logs;
CREATE TRIGGER handle_care_task_recurrence
  AFTER INSERT ON care_logs
  FOR EACH ROW EXECUTE FUNCTION handle_care_task_recurrence();

-- ============================================================================
-- 6.3 Notification Trigger: Likes
-- Create notification when a user likes a post (but not their own)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_like() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author_id UUID;
  v_actor_username TEXT;
BEGIN
  -- Get the post author
  SELECT author_id INTO v_post_author_id FROM posts WHERE id = NEW.post_id;

  -- Don't notify if user likes their own post
  IF v_post_author_id IS NULL OR v_post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get actor username for message
  SELECT COALESCE(username, display_name, 'Someone') INTO v_actor_username
  FROM profiles WHERE id = NEW.user_id;

  -- Create notification
  INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
  VALUES (
    v_post_author_id,
    NEW.user_id,
    'like',
    'New like',
    v_actor_username || ' liked your post',
    jsonb_build_object('post_id', NEW.post_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_like ON likes;
CREATE TRIGGER notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- ============================================================================
-- 6.4 Notification Trigger: Comments
-- Create notification when a user comments on a post (but not their own)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_comment() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_post_author_id UUID;
  v_actor_username TEXT;
BEGIN
  -- Get the post author
  SELECT author_id INTO v_post_author_id FROM posts WHERE id = NEW.post_id;

  -- Don't notify if user comments on their own post
  IF v_post_author_id IS NULL OR v_post_author_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  -- Get actor username for message
  SELECT COALESCE(username, display_name, 'Someone') INTO v_actor_username
  FROM profiles WHERE id = NEW.author_id;

  -- Create notification
  INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
  VALUES (
    v_post_author_id,
    NEW.author_id,
    'comment',
    'New comment',
    v_actor_username || ' commented on your post',
    jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_comment ON comments;
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ============================================================================
-- 6.5 Notification Trigger: Follows
-- Create notification when a user follows someone
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_follow() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_actor_username TEXT;
BEGIN
  -- Get actor username for message
  SELECT COALESCE(username, display_name, 'Someone') INTO v_actor_username
  FROM profiles WHERE id = NEW.follower_id;

  -- Create notification for the followed user
  INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    'New follower',
    v_actor_username || ' started following you',
    jsonb_build_object('follower_id', NEW.follower_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_follow ON follows;
CREATE TRIGGER notify_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ============================================================================
-- 6.6 Notification Trigger: Challenge Entries
-- Create notification when a user joins a challenge
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_challenge_join() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Create notification for the user who joined
  INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'challenge_reminder',
    'Challenge joined',
    'You joined a challenge',
    jsonb_build_object('challenge_id', NEW.challenge_id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_challenge_join ON challenge_entries;
CREATE TRIGGER notify_on_challenge_join
  AFTER INSERT ON challenge_entries
  FOR EACH ROW EXECUTE FUNCTION notify_on_challenge_join();

-- ============================================================================
-- 6.7 Notification Trigger: Proposal Updates
-- Create notification when a proposal status changes from pending to approved/rejected
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_on_proposal_update() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_notification_type TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Only fire when status changes from 'pending' to 'approved' or 'rejected'
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    -- Determine notification type and message based on new status
    IF NEW.status = 'approved' THEN
      v_notification_type := 'proposal_approved';
      v_notification_title := 'Proposal update';
      v_notification_message := 'Your proposal was approved';
    ELSE
      v_notification_type := 'proposal_rejected';
      v_notification_title := 'Proposal update';
      v_notification_message := 'Your proposal was rejected';
    END IF;

    -- Create notification for the submitter
    INSERT INTO notifications (user_id, actor_id, type, title, message, metadata)
    VALUES (
      NEW.submitter_id,
      NEW.submitter_id,
      v_notification_type,
      v_notification_title,
      v_notification_message,
      jsonb_build_object('proposal_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_proposal_update ON proposals;
CREATE TRIGGER notify_on_proposal_update
  AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION notify_on_proposal_update();

-- ============================================================================
-- Migration complete
-- ============================================================================