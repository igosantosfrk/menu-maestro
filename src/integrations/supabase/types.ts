Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ad_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          platform: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          customer_phone: string
          discount_applied: number | null
          id: string
          order_id: string | null
          order_total: number | null
          tenant_id: string
          used_at: string | null
        }
        Insert: {
          coupon_id: string
          customer_phone: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          order_total?: number | null
          tenant_id: string
          used_at?: string | null
        }
        Update: {
          coupon_id?: string
          customer_phone?: string
          discount_applied?: number | null
          id?: string
          order_id?: string | null
          order_total?: number | null
          tenant_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          tenant_id: string
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          tenant_id: string
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          tenant_id?: string
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          avg_ticket: number | null
          birthday: string | null
          city: string | null
          created_at: string | null
          email: string | null
          first_order_at: string | null
          id: string
          last_order_at: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string
          tags: string[] | null
          tenant_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avg_ticket?: number | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone: string
          tags?: string[] | null
          tenant_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avg_ticket?: number | null
          birthday?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string
          tags?: string[] | null
          tenant_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_drivers: {
        Row: {
          created_at: string | null
          current_orders: number | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          max_orders: number | null
          name: string
          phone: string | null
          tenant_id: string
          updated_at: string | null
          vehicle: string | null
        }
        Insert: {
          created_at?: string | null
          current_orders?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_orders?: number | null
          name: string
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
          vehicle?: string | null
        }
        Update: {
          created_at?: string | null
          current_orders?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_orders?: number | null
          name?: string
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          created_at: string | null
          estimated_time_min: number | null
          fee: number | null
          id: string
          is_active: boolean | null
          min_order: number | null
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_time_min?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          estimated_time_min?: number | null
          fee?: number | null
          id?: string
          is_active?: boolean | null
          min_order?: number | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_entries: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          recurring_frequency: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          recurring_frequency?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          points_per_real: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_per_real?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_per_real?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_programs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          points_required: number
          program_id: string | null
          reward_type: string | null
          reward_value: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          points_required: number
          program_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          points_required?: number
          program_id?: string | null
          reward_type?: string | null
          reward_value?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_rewards_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string
          order_id: string | null
          points: number
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_page_views: {
        Row: {
          created_at: string | null
          id: string
          page_id: string | null
          page_name: string | null
          page_type: string | null
          session_id: string | null
          tenant_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_id?: string | null
          page_name?: string | null
          page_type?: string | null
          session_id?: string | null
          tenant_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_id?: string | null
          page_name?: string | null
          page_type?: string | null
          session_id?: string | null
          tenant_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_page_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          addons: Json | null
          created_at: string | null
          id: string
          notes: string | null
          order_id: string
          product_name: string
          quantity: number
          tenant_id: string
          total: number
          unit_price: number
        }
        Insert: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id: string
          product_name: string
          quantity?: number
          tenant_id: string
          total: number
          unit_price: number
        }
        Update: {
          addons?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          product_name?: string
          quantity?: number
          tenant_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asaas_payment_id: string | null
          cancelled_at: string | null
          coupon_code: string | null
          coupon_discount: number | null
          coupon_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_city: string | null
          delivery_fee: number | null
          delivery_neighborhood: string | null
          delivery_notes: string | null
          discount: number | null
          driver_id: string | null
          estimated_delivery_at: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          session_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id: string | null
          subtotal: number | null
          tenant_id: string
          total: number | null
          updated_at: string | null
          utm_ad_link: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          asaas_payment_id?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_fee?: number | null
          delivery_neighborhood?: string | null
          delivery_notes?: string | null
          discount?: number | null
          driver_id?: string | null
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tenant_id: string
          total?: number | null
          updated_at?: string | null
          utm_ad_link?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          asaas_payment_id?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_discount?: number | null
          coupon_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_fee?: number | null
          delivery_neighborhood?: string | null
          delivery_notes?: string | null
          discount?: number | null
          driver_id?: string | null
          estimated_delivery_at?: string | null
          id?: string
          notes?: string | null
          order_number?: number
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          tenant_id?: string
          total?: number | null
          updated_at?: string | null
          utm_ad_link?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          name: string
          price: number | null
          product_id: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          price?: number | null
          product_id: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          price?: number | null
          product_id?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_addons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_featured: boolean | null
          name: string
          prep_time_min: number | null
          price: number
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name: string
          prep_time_min?: number | null
          price?: number
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_featured?: boolean | null
          name?: string
          prep_time_min?: number | null
          price?: number
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          address: string | null
          asaas_api_key: string | null
          asaas_webhook_token: string | null
          avg_delivery_time_min: number | null
          banner_url: string | null
          city: string | null
          created_at: string | null
          delivery_fee: number | null
          description: string | null
          email: string | null
          id: string
          is_open: boolean | null
          logo_url: string | null
          mercadopago_access_token: string | null
          min_order_value: number | null
          name: string
          pagarme_api_key: string | null
          pagseguro_email: string | null
          pagseguro_token: string | null
          payment_gateway: string | null
          phone: string | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["tenant_status"] | null
          stripe_customer_id: string | null
          stripe_publishable_key: string | null
          stripe_secret_key: string | null
          stripe_subscription_id: string | null
          stripe_webhook_secret: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          asaas_api_key?: string | null
          asaas_webhook_token?: string | null
          avg_delivery_time_min?: number | null
          banner_url?: string | null
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          mercadopago_access_token?: string | null
          min_order_value?: number | null
          name: string
          pagarme_api_key?: string | null
          pagseguro_email?: string | null
          pagseguro_token?: string | null
          payment_gateway?: string | null
          phone?: string | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"] | null
          stripe_customer_id?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_subscription_id?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          asaas_api_key?: string | null
          asaas_webhook_token?: string | null
          avg_delivery_time_min?: number | null
          banner_url?: string | null
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          mercadopago_access_token?: string | null
          min_order_value?: number | null
          name?: string
          pagarme_api_key?: string | null
          pagseguro_email?: string | null
          pagseguro_token?: string | null
          payment_gateway?: string | null
          phone?: string | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["tenant_status"] | null
          stripe_customer_id?: string | null
          stripe_publishable_key?: string | null
          stripe_secret_key?: string | null
          stripe_subscription_id?: string | null
          stripe_webhook_secret?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      tracking_links: {
        Row: {
          clicks: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          orders: number | null
          revenue: number | null
          slug: string
          tenant_id: string
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          orders?: number | null
          revenue?: number | null
          slug: string
          tenant_id: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          orders?: number | null
          revenue?: number | null
          slug?: string
          tenant_id?: string
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_campaign_logs: {
        Row: {
          campaign_id: string
          customer_id: string | null
          customer_phone: string
          id: string
          message_sent: string | null
          sent_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          campaign_id: string
          customer_id?: string | null
          customer_phone: string
          id?: string
          message_sent?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          campaign_id?: string
          customer_id?: string | null
          customer_phone?: string
          id?: string
          message_sent?: string | null
          sent_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaign_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          campaign_type: string
          coupon_id: string | null
          created_at: string | null
          frequency: string | null
          id: string
          inactive_days: number | null
          is_active: boolean | null
          last_sent_at: string | null
          name: string
          send_day: number | null
          send_hour: number | null
          template_message: string
          tenant_id: string
          total_sent: number | null
          updated_at: string | null
          use_ai_personalization: boolean | null
        }
        Insert: {
          campaign_type: string
          coupon_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          inactive_days?: number | null
          is_active?: boolean | null
          last_sent_at?: string | null
          name: string
          send_day?: number | null
          send_hour?: number | null
          template_message: string
          tenant_id: string
          total_sent?: number | null
          updated_at?: string | null
          use_ai_personalization?: boolean | null
        }
        Update: {
          campaign_type?: string
          coupon_id?: string | null
          created_at?: string | null
          frequency?: string | null
          id?: string
          inactive_days?: number | null
          is_active?: boolean | null
          last_sent_at?: string | null
          name?: string
          send_day?: number | null
          send_hour?: number | null
          template_message?: string
          tenant_id?: string
          total_sent?: number | null
          updated_at?: string | null
          use_ai_personalization?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          auto_send_completed: boolean | null
          auto_send_confirmation: boolean | null
          auto_send_delivery: boolean | null
          auto_send_preparing: boolean | null
          created_at: string | null
          id: string
          instance_name: string | null
          instance_token: string | null
          is_connected: boolean | null
          phone_number: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auto_send_completed?: boolean | null
          auto_send_confirmation?: boolean | null
          auto_send_delivery?: boolean | null
          auto_send_preparing?: boolean | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          instance_token?: string | null
          is_connected?: boolean | null
          phone_number?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auto_send_completed?: boolean | null
          auto_send_confirmation?: boolean | null
          auto_send_delivery?: boolean | null
          auto_send_preparing?: boolean | null
          created_at?: string | null
          id?: string
          instance_name?: string | null
          instance_token?: string | null
          is_connected?: boolean | null
          phone_number?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_instances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_name: string | null
          contact_phone: string
          content: string | null
          created_at: string | null
          direction: string
          id: string
          is_read: boolean | null
          media_mime_type: string | null
          media_url: string | null
          message_type: string
          status: string | null
          tenant_id: string
          updated_at: string | null
          wa_message_id: string | null
        }
        Insert: {
          contact_name?: string | null
          contact_phone: string
          content?: string | null
          created_at?: string | null
          direction: string
          id?: string
          is_read?: boolean | null
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          wa_message_id?: string | null
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          is_read?: boolean | null
          media_mime_type?: string | null
          media_url?: string | null
          message_type?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          message: string
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      app_role: "super_admin" | "tenant_admin" | "tenant_user"
      order_status:
        | "new"
        | "preparing"
        | "out_for_delivery"
        | "completed"
        | "cancelled"
      payment_method: "pix" | "credit_card" | "debit_card" | "cash" | "online"
      payment_status: "pending" | "confirmed" | "failed" | "refunded"
      tenant_status: "active" | "suspended" | "trial" | "cancelled"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["super_admin", "tenant_admin", "tenant_user"],
      order_status: [
        "new",
        "preparing",
        "out_for_delivery",
        "completed",
        "cancelled",
      ],
      payment_method: ["pix", "credit_card", "debit_card", "cash", "online"],
      payment_status: ["pending", "confirmed", "failed", "refunded"],
      tenant_status: ["active", "suspended", "trial", "cancelled"],
    },
  },
} as const
