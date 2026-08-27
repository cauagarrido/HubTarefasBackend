export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'colaborador' | 'leitor';
export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';
export type ThemePreference = 'dark' | 'light' | 'system';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          theme_preference: ThemePreference;
          accent_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          theme_preference?: ThemePreference;
          accent_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          theme_preference?: ThemePreference;
          accent_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hubs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          invite_code: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          invite_code: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          invite_code?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hub_members: {
        Row: {
          id: string;
          hub_id: string;
          user_id: string;
          role: UserRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          user_id: string;
          role?: UserRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          user_id?: string;
          role?: UserRole;
          joined_at?: string;
        };
      };
      hub_join_requests: {
        Row: {
          id: string;
          hub_id: string;
          user_id: string;
          status: JoinRequestStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          user_id: string;
          status?: JoinRequestStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          user_id?: string;
          status?: JoinRequestStatus;
          created_at?: string;
        };
      };
      kanban_columns: {
        Row: {
          id: string;
          hub_id: string;
          title: string;
          order_index: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          title: string;
          order_index?: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          title?: string;
          order_index?: number;
          color?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          hub_id: string;
          column_id: string;
          title: string;
          description: string | null;
          priority: TaskPriority;
          due_date: string | null;
          assigned_to: string | null;
          created_by: string;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          column_id: string;
          title: string;
          description?: string | null;
          priority?: TaskPriority;
          due_date?: string | null;
          assigned_to?: string | null;
          created_by: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          column_id?: string;
          title?: string;
          description?: string | null;
          priority?: TaskPriority;
          due_date?: string | null;
          assigned_to?: string | null;
          created_by?: string;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_checklists: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          order_index?: number;
          created_at?: string;
        };
      };
      task_comments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          content: string;
          is_note: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          content: string;
          is_note?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          content?: string;
          is_note?: boolean;
          created_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          hub_id: string;
          author_id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          author_id: string;
          title: string;
          content: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          author_id?: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          hub_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          hub_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          hub_id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_hub_member: {
        Args: {
          p_hub_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      is_hub_admin: {
        Args: {
          p_hub_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      can_edit_tasks: {
        Args: {
          p_hub_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      task_priority: TaskPriority;
      join_request_status: JoinRequestStatus;
      theme_preference: ThemePreference;
    };
  };
}
