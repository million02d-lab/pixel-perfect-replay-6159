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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          sender_id: string | null
          status: Database["public"]["Enums"]["contact_status"]
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          sender_id?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          sender_id?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          doc_type: string
          driver_id: string
          file_size_bytes: number
          id: string
          mime_type: string
          original_filename: string
          review_status: Database["public"]["Enums"]["review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          driver_id: string
          file_size_bytes: number
          id?: string
          mime_type: string
          original_filename: string
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          driver_id?: string
          file_size_bytes?: number
          id?: string
          mime_type?: string
          original_filename?: string
          review_status?: Database["public"]["Enums"]["review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_presence: {
        Row: {
          last_seen_at: string | null
          latitude: number | null
          longitude: number | null
          online: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          online?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          online?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "driver_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_profiles: {
        Row: {
          created_at: string
          license_country: string
          license_expiry: string | null
          reviewed_at: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          created_at?: string
          license_country?: string
          license_expiry?: string | null
          reviewed_at?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          created_at?: string
          license_country?: string
          license_expiry?: string | null
          reviewed_at?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "driver_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fare_rules: {
        Row: {
          active: boolean
          assumed_l_per_100km: number | null
          base_fare_mad: number
          created_at: string
          fuel_price_mad_per_l: number | null
          id: string
          minimum_fare_mad: number
          per_km_mad: number
          per_minute_mad: number
          platform_fee_mad: number
          valid_from: string
          valid_until: string | null
          vehicle_class: Database["public"]["Enums"]["vehicle_class"]
        }
        Insert: {
          active?: boolean
          assumed_l_per_100km?: number | null
          base_fare_mad: number
          created_at?: string
          fuel_price_mad_per_l?: number | null
          id?: string
          minimum_fare_mad?: number
          per_km_mad: number
          per_minute_mad?: number
          platform_fee_mad?: number
          valid_from?: string
          valid_until?: string | null
          vehicle_class: Database["public"]["Enums"]["vehicle_class"]
        }
        Update: {
          active?: boolean
          assumed_l_per_100km?: number | null
          base_fare_mad?: number
          created_at?: string
          fuel_price_mad_per_l?: number | null
          id?: string
          minimum_fare_mad?: number
          per_km_mad?: number
          per_minute_mad?: number
          platform_fee_mad?: number
          valid_from?: string
          valid_until?: string | null
          vehicle_class?: Database["public"]["Enums"]["vehicle_class"]
        }
        Relationships: []
      }
      loyalty_ledger: {
        Row: {
          created_at: string
          id: string
          passenger_id: string
          points_delta: number
          reason: string
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_id: string
          points_delta: number
          reason: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          passenger_id?: string
          points_delta?: number
          reason?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_ledger_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_ledger_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          business_name: string
          city: string
          contact_email: string
          created_at: string
          fleet_size: number
          id: string
          owner_user_id: string
          reviewed_at: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          business_name: string
          city: string
          contact_email: string
          created_at?: string
          fleet_size?: number
          id?: string
          owner_user_id: string
          reviewed_at?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          business_name?: string
          city?: string
          contact_email?: string
          created_at?: string
          fleet_size?: number
          id?: string
          owner_user_id?: string
          reviewed_at?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          preferred_language: string
          role: Database["public"]["Enums"]["account_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferred_language?: string
          role?: Database["public"]["Enums"]["account_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          city: string
          commission_free_until: string | null
          contact_sharing_accepted_at: string | null
          created_at: string
          driver_id: string
          id: string
          notes: string | null
          partner_confirmed_at: string | null
          partner_id: string | null
          status: Database["public"]["Enums"]["rental_request_status"]
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
        }
        Insert: {
          city: string
          commission_free_until?: string | null
          contact_sharing_accepted_at?: string | null
          created_at?: string
          driver_id: string
          id?: string
          notes?: string | null
          partner_confirmed_at?: string | null
          partner_id?: string | null
          status?: Database["public"]["Enums"]["rental_request_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Update: {
          city?: string
          commission_free_until?: string | null
          contact_sharing_accepted_at?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          notes?: string | null
          partner_confirmed_at?: string | null
          partner_id?: string | null
          status?: Database["public"]["Enums"]["rental_request_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "rental_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          event_type: string
          id: string
          trip_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          trip_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cancelled_at: string | null
          client_request_id: string | null
          completed_at: string | null
          created_at: string
          currency: string
          destination_label: string
          destination_latitude: number
          destination_longitude: number
          driver_id: string | null
          fare_rule_id: string | null
          id: string
          matched_at: string | null
          passenger_id: string
          pickup_label: string
          pickup_latitude: number
          pickup_longitude: number
          platform_fee_mad: number
          quoted_fare_mad: number
          requested_at: string
          route_distance_m: number | null
          route_duration_s: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status"]
          updated_at: string
          vehicle_class: Database["public"]["Enums"]["vehicle_class"]
        }
        Insert: {
          cancelled_at?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          destination_label: string
          destination_latitude: number
          destination_longitude: number
          driver_id?: string | null
          fare_rule_id?: string | null
          id?: string
          matched_at?: string | null
          passenger_id: string
          pickup_label: string
          pickup_latitude: number
          pickup_longitude: number
          platform_fee_mad?: number
          quoted_fare_mad: number
          requested_at?: string
          route_distance_m?: number | null
          route_duration_s?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_class?: Database["public"]["Enums"]["vehicle_class"]
        }
        Update: {
          cancelled_at?: string | null
          client_request_id?: string | null
          completed_at?: string | null
          created_at?: string
          currency?: string
          destination_label?: string
          destination_latitude?: number
          destination_longitude?: number
          driver_id?: string | null
          fare_rule_id?: string | null
          id?: string
          matched_at?: string | null
          passenger_id?: string
          pickup_label?: string
          pickup_latitude?: number
          pickup_longitude?: number
          platform_fee_mad?: number
          quoted_fare_mad?: number
          requested_at?: string
          route_distance_m?: number | null
          route_duration_s?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status"]
          updated_at?: string
          vehicle_class?: Database["public"]["Enums"]["vehicle_class"]
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "trips_fare_rule_id_fkey"
            columns: ["fare_rule_id"]
            isOneToOne: false
            referencedRelation: "fare_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          driver_id: string
          id: string
          make: string
          model: string
          plate_number: string
          reviewed_at: string | null
          seats: number
          updated_at: string
          vehicle_class: Database["public"]["Enums"]["vehicle_class"]
          verification_status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          color?: string | null
          created_at?: string
          driver_id: string
          id?: string
          make: string
          model: string
          plate_number: string
          reviewed_at?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: Database["public"]["Enums"]["vehicle_class"]
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          color?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          make?: string
          model?: string
          plate_number?: string
          reviewed_at?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: Database["public"]["Enums"]["vehicle_class"]
          verification_status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "driver_profiles"
            referencedColumns: ["user_id"]
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
      account_role: "passenger" | "driver" | "partner" | "admin"
      contact_status: "new" | "in_review" | "resolved" | "spam"
      rental_request_status:
        | "pending"
        | "matched"
        | "approved"
        | "rejected"
        | "cancelled"
      review_status: "pending" | "approved" | "rejected" | "suspended"
      trip_status:
        | "requested"
        | "matched"
        | "driver_arriving"
        | "in_progress"
        | "completed"
        | "cancelled"
      vehicle_class: "economy" | "comfort" | "van"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_role: ["passenger", "driver", "partner", "admin"],
      contact_status: ["new", "in_review", "resolved", "spam"],
      rental_request_status: [
        "pending",
        "matched",
        "approved",
        "rejected",
        "cancelled",
      ],
      review_status: ["pending", "approved", "rejected", "suspended"],
      trip_status: [
        "requested",
        "matched",
        "driver_arriving",
        "in_progress",
        "completed",
        "cancelled",
      ],
      vehicle_class: ["economy", "comfort", "van"],
    },
  },
} as const
