export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      care_logs: {
        Row: {
          care_type: string
          id: string
          image_url: string | null
          logged_at: string | null
          notes: string | null
          plant_id: string | null
          scheduled_due: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          care_type: string
          id?: string
          image_url?: string | null
          logged_at?: string | null
          notes?: string | null
          plant_id?: string | null
          scheduled_due?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          care_type?: string
          id?: string
          image_url?: string | null
          logged_at?: string | null
          notes?: string | null
          plant_id?: string | null
          scheduled_due?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_logs_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "care_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      care_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          plant_id: string | null
          repeat_interval: number | null
          repeat_unit: string | null
          task_name: string
          task_type: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          plant_id?: string | null
          repeat_interval?: number | null
          repeat_unit?: string | null
          task_name: string
          task_type: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          plant_id?: string | null
          repeat_interval?: number | null
          repeat_unit?: string | null
          task_name?: string
          task_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_tasks_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_entries: {
        Row: {
          challenge_id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_virtual: boolean | null
          location: string | null
          participants_count: number | null
          proposer_id: string | null
          starts_at: string | null
          status: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          participants_count?: number | null
          proposer_id?: string | null
          starts_at?: string | null
          status?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_virtual?: boolean | null
          location?: string | null
          participants_count?: number | null
          proposer_id?: string | null
          starts_at?: string | null
          status?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_proposer_id_fkey"
            columns: ["proposer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          post_id: string | null
          text: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string | null
          text: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          post_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          id: string
          last_message_at: string | null
          participant_ids: string[]
        }
        Insert: {
          id?: string
          last_message_at?: string | null
          participant_ids: string[]
        }
        Update: {
          id?: string
          last_message_at?: string | null
          participant_ids?: string[]
        }
        Relationships: []
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
        }
        Insert: {
          follower_id: string
          following_id: string
        }
        Update: {
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          post_id: string
          user_id: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: {
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          category: string | null
          ended_at: string | null
          host_id: string | null
          id: string
          started_at: string | null
          status: string | null
          stream_key: string | null
          thumbnail_url: string | null
          title: string
          viewer_count: number | null
          co_host_setting: string | null
          moderation_setting: string | null
          chat_setting: string | null
        }
        Insert: {
          category?: string | null
          ended_at?: string | null
          host_id?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stream_key?: string | null
          thumbnail_url?: string | null
          title: string
          viewer_count?: number | null
          co_host_setting?: string | null
          moderation_setting?: string | null
          chat_setting?: string | null
        }
        Update: {
          category?: string | null
          ended_at?: string | null
          host_id?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stream_key?: string | null
          thumbnail_url?: string | null
          title?: string
          viewer_count?: number | null
          co_host_setting?: string | null
          moderation_setting?: string | null
          chat_setting?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_streams_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          plant_card_id: string | null
          sender_id: string | null
          text: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          plant_card_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          plant_card_id?: string | null
          sender_id?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_plant_card_id_fkey"
            columns: ["plant_card_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          acquired_at: string | null
          created_at: string | null
          health_percent: number | null
          id: string
          image_url: string | null
          last_watered_at: string | null
          light_requirement: string | null
          location: string | null
          next_water_at: string | null
          nickname: string
          notes: string | null
          owner_id: string | null
          scientific_name: string | null
          species: string | null
          water_frequency_days: number | null
        }
        Insert: {
          acquired_at?: string | null
          created_at?: string | null
          health_percent?: number | null
          id?: string
          image_url?: string | null
          last_watered_at?: string | null
          light_requirement?: string | null
          location?: string | null
          next_water_at?: string | null
          nickname: string
          notes?: string | null
          owner_id?: string | null
          scientific_name?: string | null
          species?: string | null
          water_frequency_days?: number | null
        }
        Update: {
          acquired_at?: string | null
          created_at?: string | null
          health_percent?: number | null
          id?: string
          image_url?: string | null
          last_watered_at?: string | null
          light_requirement?: string | null
          location?: string | null
          next_water_at?: string | null
          nickname?: string
          notes?: string | null
          owner_id?: string | null
          scientific_name?: string | null
          species?: string | null
          water_frequency_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_library: {
        Row: {
          common_name: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          id: string
          image_url: string | null
          light: string | null
          safe_placement: string | null
          source: string | null
          species_name: string | null
          symptoms: string | null
          toxicity_to_humans: boolean | null
          toxicity_to_pets: string | null
          water: string | null
        }
        Insert: {
          common_name?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          light?: string | null
          safe_placement?: string | null
          source?: string | null
          species_name?: string | null
          symptoms?: string | null
          toxicity_to_humans?: boolean | null
          toxicity_to_pets?: string | null
          water?: string | null
        }
        Update: {
          common_name?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          light?: string | null
          safe_placement?: string | null
          source?: string | null
          species_name?: string | null
          symptoms?: string | null
          toxicity_to_humans?: boolean | null
          toxicity_to_pets?: string | null
          water?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string | null
          caption: string | null
          challenge_id: string | null
          comments_count: number | null
          created_at: string | null
          id: string
          image_url: string | null
          is_sponsored: boolean | null
          likes_count: number | null
          media_urls: string[] | null
          plant_id: string | null
          tags: string[] | null
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          challenge_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          plant_id?: string | null
          tags?: string[] | null
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          challenge_id?: string | null
          comments_count?: number | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          media_urls?: string[] | null
          plant_id?: string | null
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_posts: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_guides: {
        Row: {
          created_at: string | null
          id: string
          plant_library_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          plant_library_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          plant_library_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_guides_plant_library_id_fkey"
            columns: ["plant_library_id"]
            isOneToOne: false
            referencedRelation: "plant_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_guides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          interests: string[] | null
          location: string | null
          location_hidden: boolean | null
          plants_count: number | null
          role: string | null
          settings_care_reminders: boolean | null
          settings_challenge_notifications: boolean | null
          settings_social_notifications: boolean | null
          status: string | null
          suspended_until: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          id: string
          interests?: string[] | null
          location?: string | null
          location_hidden?: boolean | null
          plants_count?: number | null
          role?: string | null
          settings_care_reminders?: boolean | null
          settings_challenge_notifications?: boolean | null
          settings_social_notifications?: boolean | null
          status?: string | null
          suspended_until?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          interests?: string[] | null
          location?: string | null
          location_hidden?: boolean | null
          plants_count?: number | null
          role?: string | null
          settings_care_reminders?: boolean | null
          settings_challenge_notifications?: boolean | null
          settings_social_notifications?: boolean | null
          status?: string | null
          suspended_until?: string | null
          username?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          moderator_note: string | null
          proposed_options: Json | null
          scheduled_at: string | null
          status: string | null
          submitter_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          moderator_note?: string | null
          proposed_options?: Json | null
          scheduled_at?: string | null
          status?: string | null
          submitter_id?: string | null
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          moderator_note?: string | null
          proposed_options?: Json | null
          scheduled_at?: string | null
          status?: string | null
          submitter_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string | null
          token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          id: string
          moderator_note: string | null
          reason: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          moderator_note?: string | null
          reason?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          moderator_note?: string | null
          reason?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      violations: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          duration_hours: number | null
          id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          duration_hours?: number | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          duration_hours?: number | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "violations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
