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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      automation_flows: {
        Row: {
          created_at: string | null
          flow_data: Json
          id: string
          is_active: boolean | null
          name: string
          parish_id: string | null
          trigger_keywords: string[] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean | null
          name: string
          parish_id?: string | null
          trigger_keywords?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          parish_id?: string | null
          trigger_keywords?: string[] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_flows_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_messages_log: {
        Row: {
          content: string | null
          created_at: string
          direction: string | null
          flow_id: string | null
          id: string
          metadata: Json | null
          node_id: string | null
          node_type: string | null
          parish_id: string | null
          session_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          direction?: string | null
          flow_id?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          node_type?: string | null
          parish_id?: string | null
          session_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          direction?: string | null
          flow_id?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          node_type?: string | null
          parish_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_messages_log_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_messages_log_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_messages_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "automation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_sessions: {
        Row: {
          current_flow_id: string | null
          current_node_id: string | null
          id: string
          last_interaction: string | null
          metadata: Json | null
          parish_id: string | null
          remote_jid: string
          variables: Json | null
        }
        Insert: {
          current_flow_id?: string | null
          current_node_id?: string | null
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          parish_id?: string | null
          remote_jid: string
          variables?: Json | null
        }
        Update: {
          current_flow_id?: string | null
          current_node_id?: string | null
          id?: string
          last_interaction?: string | null
          metadata?: Json | null
          parish_id?: string | null
          remote_jid?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_sessions_current_flow_id_fkey"
            columns: ["current_flow_id"]
            isOneToOne: false
            referencedRelation: "automation_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_sessions_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parish_id: string | null
          status: Database["public"]["Enums"]["feedback_status"] | null
          type: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parish_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          type: Database["public"]["Enums"]["feedback_type"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parish_id?: string | null
          status?: Database["public"]["Enums"]["feedback_status"] | null
          type?: Database["public"]["Enums"]["feedback_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_columns: {
        Row: {
          created_at: string
          id: string
          order: number
          parish_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order?: number
          parish_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order?: number
          parish_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_columns_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_tasks: {
        Row: {
          column_id: string | null
          created_at: string
          description: string | null
          id: string
          order: number
          parish_id: string | null
          tags: string[] | null
          title: string
        }
        Insert: {
          column_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order?: number
          parish_id?: string | null
          tags?: string[] | null
          title: string
        }
        Update: {
          column_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order?: number
          parish_id?: string | null
          tags?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanban_tasks_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "kanban_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_tasks_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
      parish_notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          id: string
          parish_id: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string
          id?: string
          parish_id?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          id?: string
          parish_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parish_notes_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parish_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parishes: {
        Row: {
          address: string | null
          business_hours_end: string | null
          business_hours_start: string | null
          city: string | null
          cnpj: string | null
          created_at: string | null
          diocese: string | null
          id: string
          name: string
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["parish_status"] | null
          whatsapp_connected: boolean | null
          whatsapp_instance_id: string | null
          whatsapp_token: string | null
        }
        Insert: {
          address?: string | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          diocese?: string | null
          id?: string
          name: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["parish_status"] | null
          whatsapp_connected?: boolean | null
          whatsapp_instance_id?: string | null
          whatsapp_token?: string | null
        }
        Update: {
          address?: string | null
          business_hours_end?: string | null
          business_hours_start?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string | null
          diocese?: string | null
          id?: string
          name?: string
          phone?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["parish_status"] | null
          whatsapp_connected?: boolean | null
          whatsapp_instance_id?: string | null
          whatsapp_token?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          parish_id: string | null
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          parish_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          parish_id?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parish_id_fkey"
            columns: ["parish_id"]
            isOneToOne: false
            referencedRelation: "parishes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_parish_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      feedback_status: "pending" | "under_review" | "implemented" | "closed"
      feedback_type: "suggestion" | "report"
      parish_status: "active" | "suspended" | "trial"
      user_role: "superadmin" | "admin" | "user"
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
    Enums: {
      feedback_status: ["pending", "under_review", "implemented", "closed"],
      feedback_type: ["suggestion", "report"],
      parish_status: ["active", "suspended", "trial"],
      user_role: ["superadmin", "admin", "user"],
    },
  },
} as const
