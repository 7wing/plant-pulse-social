-- Create care_tasks table
CREATE TABLE IF NOT EXISTS public.care_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  plant_id uuid REFERENCES public.plants(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  task_type text NOT NULL,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  is_recurring boolean DEFAULT false,
  repeat_interval integer,
  repeat_unit text
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text,
  message text,
  metadata jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on care_tasks
ALTER TABLE public.care_tasks ENABLE ROW LEVEL SECURITY;

-- Enable Row Level Security on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for care_tasks
CREATE POLICY "Users can view own care tasks"
  ON public.care_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own care tasks"
  ON public.care_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own care tasks"
  ON public.care_tasks
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own care tasks"
  ON public.care_tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);
