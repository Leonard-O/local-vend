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
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          phone: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          phone: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          phone?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string | null
          customer_address: string
          customer_id: string | null
          customer_location_lat: number | null
          customer_location_lng: number | null
          customer_name: string
          customer_phone: string
          delivery_code: string | null
          delivery_confirmed: boolean | null
          delivery_time: string | null
          id: string
          notes: string | null
          pickup_confirmed: boolean | null
          pickup_time: string | null
          products: Json
          rider_id: string | null
          rider_location_lat: number | null
          rider_location_lng: number | null
          rider_name: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          vendor_id: string | null
          vendor_location_lat: number | null
          vendor_location_lng: number | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          customer_address: string
          customer_id?: string | null
          customer_location_lat?: number | null
          customer_location_lng?: number | null
          customer_name: string
          customer_phone: string
          delivery_code?: string | null
          delivery_confirmed?: boolean | null
          delivery_time?: string | null
          id?: string
          notes?: string | null
          pickup_confirmed?: boolean | null
          pickup_time?: string | null
          products: Json
          rider_id?: string | null
          rider_location_lat?: number | null
          rider_location_lng?: number | null
          rider_name?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_location_lat?: number | null
          vendor_location_lng?: number | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          customer_address?: string
          customer_id?: string | null
          customer_location_lat?: number | null
          customer_location_lng?: number | null
          customer_name?: string
          customer_phone?: string
          delivery_code?: string | null
          delivery_confirmed?: boolean | null
          delivery_time?: string | null
          id?: string
          notes?: string | null
          pickup_confirmed?: boolean | null
          pickup_time?: string | null
          products?: Json
          rider_id?: string | null
          rider_location_lat?: number | null
          rider_location_lng?: number | null
          rider_name?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_location_lat?: number | null
          vendor_location_lng?: number | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          type: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          type?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          type?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_location_lat: number | null
          customer_location_lng: number | null
          customer_name: string
          delivery_code: string
          delivery_confirmed: boolean | null
          delivery_time: string | null
          distance_km: number | null
          eta_minutes: number | null
          id: string
          notes: string | null
          pickup_code: string | null
          pickup_confirmed: boolean | null
          pickup_time: string | null
          products: Json
          rider_id: string | null
          rider_location_lat: number | null
          rider_location_lng: number | null
          rider_name: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          vendor_id: string | null
          vendor_location_lat: number | null
          vendor_location_lng: number | null
          vendor_name: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_location_lat?: number | null
          customer_location_lng?: number | null
          customer_name: string
          delivery_code: string
          delivery_confirmed?: boolean | null
          delivery_time?: string | null
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          pickup_code?: string | null
          pickup_confirmed?: boolean | null
          pickup_time?: string | null
          products: Json
          rider_id?: string | null
          rider_location_lat?: number | null
          rider_location_lng?: number | null
          rider_name?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_location_lat?: number | null
          vendor_location_lng?: number | null
          vendor_name: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_location_lat?: number | null
          customer_location_lng?: number | null
          customer_name?: string
          delivery_code?: string
          delivery_confirmed?: boolean | null
          delivery_time?: string | null
          distance_km?: number | null
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          pickup_code?: string | null
          pickup_confirmed?: boolean | null
          pickup_time?: string | null
          products?: Json
          rider_id?: string | null
          rider_location_lat?: number | null
          rider_location_lng?: number | null
          rider_name?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_location_lat?: number | null
          vendor_location_lng?: number | null
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          mpesa_transaction_id: string | null
          order_id: string | null
          platform_fee: number
          released_at: string | null
          rider_id: string | null
          rider_share: number
          status: string | null
          total_amount: number
          vendor_id: string | null
          vendor_share: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          order_id?: string | null
          platform_fee: number
          released_at?: string | null
          rider_id?: string | null
          rider_share: number
          status?: string | null
          total_amount: number
          vendor_id?: string | null
          vendor_share: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          mpesa_transaction_id?: string | null
          order_id?: string | null
          platform_fee?: number
          released_at?: string | null
          rider_id?: string | null
          rider_share?: number
          status?: string | null
          total_amount?: number
          vendor_id?: string | null
          vendor_share?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "riders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          quantity_per_unit: number | null
          stock_quantity: number | null
          unit_label: string | null
          unit_type: string | null
          unit_value: number | null
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          quantity_per_unit?: number | null
          stock_quantity?: number | null
          unit_label?: string | null
          unit_type?: string | null
          unit_value?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          quantity_per_unit?: number | null
          stock_quantity?: number | null
          unit_label?: string | null
          unit_type?: string | null
          unit_value?: number | null
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          feedback: string | null
          from_user_id: string
          from_user_name: string
          id: string
          order_id: string | null
          rating: number
          role_type: string
          to_user_id: string
          to_user_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          from_user_id: string
          from_user_name: string
          id?: string
          order_id?: string | null
          rating: number
          role_type: string
          to_user_id: string
          to_user_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          from_user_id?: string
          from_user_name?: string
          id?: string
          order_id?: string | null
          rating?: number
          role_type?: string
          to_user_id?: string
          to_user_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          active_deliveries: number | null
          average_delivery_time: number | null
          created_at: string | null
          email: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          phone: string
          rating: number | null
          status: string | null
          total_deliveries: number | null
          updated_at: string | null
        }
        Insert: {
          active_deliveries?: number | null
          average_delivery_time?: number | null
          created_at?: string | null
          email: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          phone: string
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Update: {
          active_deliveries?: number | null
          average_delivery_time?: number | null
          created_at?: string | null
          email?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          phone?: string
          rating?: number | null
          status?: string | null
          total_deliveries?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string
          business_name: string
          created_at: string | null
          email: string
          id: string
          location_lat: number | null
          location_lng: number | null
          name: string
          phone: string
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          business_name: string
          created_at?: string | null
          email: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name: string
          phone: string
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          business_name?: string
          created_at?: string | null
          email?: string
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          phone?: string
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
