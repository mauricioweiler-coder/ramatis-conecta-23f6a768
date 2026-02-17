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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      assistance_records: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          interviewer_name: string | null
          linked_previous_id: string | null
          observations: string | null
          phone: string | null
          referral: string | null
          status: string | null
          symptom: string
          updated_at: string
          visitor_id: string | null
          visitor_name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interviewer_name?: string | null
          linked_previous_id?: string | null
          observations?: string | null
          phone?: string | null
          referral?: string | null
          status?: string | null
          symptom: string
          updated_at?: string
          visitor_id?: string | null
          visitor_name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          interviewer_name?: string | null
          linked_previous_id?: string | null
          observations?: string | null
          phone?: string | null
          referral?: string | null
          status?: string | null
          symptom?: string
          updated_at?: string
          visitor_id?: string | null
          visitor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistance_records_linked_previous_id_fkey"
            columns: ["linked_previous_id"]
            isOneToOne: false
            referencedRelation: "assistance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistance_records_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          activity_type: string
          date: string
          id: string
          member_id: string | null
          member_name: string | null
          notes: string | null
        }
        Insert: {
          activity_type: string
          date?: string
          id?: string
          member_id?: string | null
          member_name?: string | null
          notes?: string | null
        }
        Update: {
          activity_type?: string
          date?: string
          id?: string
          member_id?: string | null
          member_name?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      course_attendance: {
        Row: {
          course_id: string
          created_at: string
          date: string
          id: string
          member_id: string
          notes: string | null
          present: boolean
        }
        Insert: {
          course_id: string
          created_at?: string
          date?: string
          id?: string
          member_id: string
          notes?: string | null
          present?: boolean
        }
        Update: {
          course_id?: string
          created_at?: string
          date?: string
          id?: string
          member_id?: string
          notes?: string | null
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "course_attendance_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      course_student_notes: {
        Row: {
          author_id: string
          content: string
          course_id: string
          created_at: string
          id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          course_id: string
          created_at?: string
          id?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          course_id?: string
          created_at?: string
          id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_student_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_student_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      course_students: {
        Row: {
          course_id: string
          enrolled_at: string
          id: string
          member_id: string
          status: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string
          id?: string
          member_id: string
          status?: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string
          id?: string
          member_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_students_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          assistant_ids: string[] | null
          coordinator_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          graduation_role: string | null
          id: string
          main_teacher_id: string | null
          name: string
          room: string | null
          schedule_dates: string[] | null
          start_date: string | null
          start_time: string | null
          weekday: string | null
        }
        Insert: {
          assistant_ids?: string[] | null
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          graduation_role?: string | null
          id?: string
          main_teacher_id?: string | null
          name: string
          room?: string | null
          schedule_dates?: string[] | null
          start_date?: string | null
          start_time?: string | null
          weekday?: string | null
        }
        Update: {
          assistant_ids?: string[] | null
          coordinator_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          graduation_role?: string | null
          id?: string
          main_teacher_id?: string | null
          name?: string
          room?: string | null
          schedule_dates?: string[] | null
          start_date?: string | null
          start_time?: string | null
          weekday?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_main_teacher_id_fkey"
            columns: ["main_teacher_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          email: string | null
          id: string
          last_attendance: string | null
          name: string
          phone: string | null
          registration_date: string | null
          role: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          last_attendance?: string | null
          name: string
          phone?: string | null
          registration_date?: string | null
          role?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          last_attendance?: string | null
          name?: string
          phone?: string | null
          registration_date?: string | null
          role?: string | null
        }
        Relationships: []
      }
      monthly_fees: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          receipt_url: string | null
          status: string | null
          updated_at: string
          worker_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string | null
          updated_at?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monthly_fees_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          cep: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login: string | null
          mobile_phone: string | null
          profile_completed: boolean
          profile_photo_url: string | null
          role: string | null
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          mobile_phone?: string | null
          profile_completed?: boolean
          profile_photo_url?: string | null
          role?: string | null
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          mobile_phone?: string | null
          profile_completed?: boolean
          profile_photo_url?: string | null
          role?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      service_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      session_services: {
        Row: {
          created_at: string
          id: string
          people_count: number
          service_type_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          people_count?: number
          service_type_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          people_count?: number
          service_type_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_services_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "spiritual_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_sessions: {
        Row: {
          created_at: string
          id: string
          observations: string | null
          responsible_name: string | null
          session_date: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          observations?: string | null
          responsible_name?: string | null
          session_date: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          observations?: string | null
          responsible_name?: string | null
          session_date?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string
          id: string
          related_monthly_fee_id: string | null
          responsible_name: string | null
          type: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date?: string
          description: string
          id?: string
          related_monthly_fee_id?: string | null
          responsible_name?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          related_monthly_fee_id?: string | null
          responsible_name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_related_monthly_fee_id_fkey"
            columns: ["related_monthly_fee_id"]
            isOneToOne: false
            referencedRelation: "monthly_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workers: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_country: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          birth_date: string | null
          bond_type: string | null
          cep: string | null
          cpf: string | null
          created_at: string
          dependents_count: number | null
          email: string | null
          full_address: string | null
          full_name: string
          id: string
          landline_phone: string | null
          marital_status: string | null
          mobile_phone: string | null
          profile_photo_url: string | null
          rg: string | null
          status: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          birth_date?: string | null
          bond_type?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          dependents_count?: number | null
          email?: string | null
          full_address?: string | null
          full_name: string
          id?: string
          landline_phone?: string | null
          marital_status?: string | null
          mobile_phone?: string | null
          profile_photo_url?: string | null
          rg?: string | null
          status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_country?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          birth_date?: string | null
          bond_type?: string | null
          cep?: string | null
          cpf?: string | null
          created_at?: string
          dependents_count?: number | null
          email?: string | null
          full_address?: string | null
          full_name?: string
          id?: string
          landline_phone?: string | null
          marital_status?: string | null
          mobile_phone?: string | null
          profile_photo_url?: string | null
          rg?: string | null
          status?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      enable_authenticated_access: { Args: { tbl: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "professor"
        | "estagiario"
        | "trabalhador"
        | "aluno"
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
      app_role: [
        "admin",
        "moderator",
        "user",
        "professor",
        "estagiario",
        "trabalhador",
        "aluno",
      ],
    },
  },
} as const
