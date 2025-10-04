export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Initial database interface - will be auto-generated after schema setup
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          email?: string
          name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          visibility: 'private' | 'public'
          files: Json
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          visibility?: 'private' | 'public'
          files?: Json
          settings?: Json
        }
        Update: {
          name?: string
          description?: string | null
          visibility?: 'private' | 'public'
          files?: Json
          settings?: Json
          updated_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          url_id: string
          description: string | null
          messages: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          url_id: string
          description?: string | null
          messages: Json
        }
        Update: {
          project_id?: string | null
          description?: string | null
          messages?: Json
          updated_at?: string
        }
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
        }
        Update: {
          role?: 'owner' | 'editor' | 'viewer'
        }
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