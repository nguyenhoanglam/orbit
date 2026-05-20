/**
 * Auto-generated Supabase database types.
 * Regenerate with: pnpm supabase gen types typescript --local > types/database.ts
 *
 * This file is a hand-written stub that mirrors the schema defined in
 * supabase/migrations/20260520000001_initial_schema.sql.
 * Replace with the auto-generated output once local Supabase is running.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type TeamRole = 'admin' | 'member' | 'viewer'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none'
export type SubscriptionPlan = 'lite' | 'pro'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          stripe_customer_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          stripe_customer_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: TeamRole
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: TeamRole
          created_at?: string
        }
        Update: {
          role?: TeamRole
        }
      }
      team_invites: {
        Row: {
          id: string
          team_id: string
          email: string
          role: TeamRole
          token: string
          invited_by: string
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          email: string
          role?: TeamRole
          token?: string
          invited_by: string
          accepted_at?: string | null
          expires_at?: string
          created_at?: string
        }
        Update: {
          accepted_at?: string | null
          role?: TeamRole
        }
      }
      workspaces: {
        Row: {
          id: string
          team_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          updated_at?: string
        }
      }
      boards: {
        Row: {
          id: string
          workspace_id: string
          team_id: string
          name: string
          description: string | null
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          team_id: string
          name: string
          description?: string | null
          position?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          position?: number
          updated_at?: string
        }
      }
      columns: {
        Row: {
          id: string
          board_id: string
          name: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          position?: number
          updated_at?: string
        }
      }
      labels: {
        Row: {
          id: string
          team_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          name?: string
          color?: string
        }
      }
      tasks: {
        Row: {
          id: string
          board_id: string
          column_id: string
          team_id: string
          title: string
          description: string | null
          priority: TaskPriority
          due_date: string | null
          position: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          board_id: string
          column_id: string
          team_id: string
          title: string
          description?: string | null
          priority?: TaskPriority
          due_date?: string | null
          position?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          title?: string
          description?: string | null
          priority?: TaskPriority
          due_date?: string | null
          position?: number
          updated_at?: string
        }
      }
      task_assignees: {
        Row: {
          task_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          task_id: string
          user_id: string
          created_at?: string
        }
        Update: Record<string, never>
      }
      task_labels: {
        Row: {
          task_id: string
          label_id: string
        }
        Insert: {
          task_id: string
          label_id: string
        }
        Update: Record<string, never>
      }
      task_activity: {
        Row: {
          id: string
          task_id: string
          user_id: string
          type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_id: string
          type: string
          payload?: Json
          created_at?: string
        }
        Update: Record<string, never>
      }
      subscriptions: {
        Row: {
          id: string
          team_id: string
          plan: SubscriptionPlan
          status: SubscriptionStatus
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          team_id: string
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      team_role: TeamRole
      task_priority: TaskPriority
      subscription_plan: SubscriptionPlan
      subscription_status: SubscriptionStatus
    }
  }
}
