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
      accounting_periods: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      accounting_settings: {
        Row: {
          auto_invoice_shipments: boolean
          auto_post_invoice: boolean
          company_id: string
          created_at: string
          created_by: string | null
          default_currency: string
          default_tax_rate: number
          expense_prefix: string
          id: string
          invoice_prefix: string
          journal_prefix: string
          payment_prefix: string
          tax_enabled: boolean
          updated_at: string
        }
        Insert: {
          auto_invoice_shipments?: boolean
          auto_post_invoice?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_tax_rate?: number
          expense_prefix?: string
          id?: string
          invoice_prefix?: string
          journal_prefix?: string
          payment_prefix?: string
          tax_enabled?: boolean
          updated_at?: string
        }
        Update: {
          auto_invoice_shipments?: boolean
          auto_post_invoice?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          default_currency?: string
          default_tax_rate?: number
          expense_prefix?: string
          id?: string
          invoice_prefix?: string
          journal_prefix?: string
          payment_prefix?: string
          tax_enabled?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      api_idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string
          key: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          key: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          key?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          key: string
          request_count: number
          updated_at: string
          window_started_at: string
        }
        Insert: {
          key: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          key?: string
          request_count?: number
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      approval_history: {
        Row: {
          action: string
          actor_id: string | null
          approval_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          approval_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          approval_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_history_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_history_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          approver_role_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          threshold_amount: number
          updated_at: string
          workflow_name: string
          workflow_type: string
        }
        Insert: {
          approver_role_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          threshold_amount?: number
          updated_at?: string
          workflow_name: string
          workflow_type: string
        }
        Update: {
          approver_role_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          threshold_amount?: number
          updated_at?: string
          workflow_name?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_approver_role_id_fkey"
            columns: ["approver_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approval_type: string
          comments: Json
          company_id: string
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          id: string
          reference_id: string | null
          reference_table: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_type: string
          comments?: Json
          company_id: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_type?: string
          comments?: Json
          company_id?: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          reference_id?: string | null
          reference_table?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          record_id: string | null
          table_name: string | null
          updated_at: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          record_id?: string | null
          table_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          company_id: string
          configuration: Json
          created_at: string
          created_by: string | null
          id: string
          is_enabled: boolean
          rule_name: string
          rule_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          rule_name: string
          rule_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_enabled?: boolean
          rule_name?: string
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string | null
          bank_name: string | null
          chart_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          current_balance: number
          id: string
          is_active: boolean
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number?: string | null
          bank_name?: string | null
          chart_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string | null
          bank_name?: string | null
          chart_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          is_active?: boolean
          opening_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_reconciliation: {
        Row: {
          bank_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          matched_transactions: Json
          reconciled_at: string | null
          statement_balance: number
          statement_date: string
          status: string
          system_balance: number
          unreconciled_transactions: Json
          updated_at: string
        }
        Insert: {
          bank_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          matched_transactions?: Json
          reconciled_at?: string | null
          statement_balance?: number
          statement_date: string
          status?: string
          system_balance?: number
          unreconciled_transactions?: Json
          updated_at?: string
        }
        Update: {
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          matched_transactions?: Json
          reconciled_at?: string | null
          statement_balance?: number
          statement_date?: string
          status?: string
          system_balance?: number
          unreconciled_transactions?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_reconciliation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          compact_mode: boolean
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          primary_color: string
          sidebar_style: string
          theme_mode: string
          updated_at: string
        }
        Insert: {
          compact_mode?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          sidebar_style?: string
          theme_mode?: string
          updated_at?: string
        }
        Update: {
          compact_mode?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          sidebar_style?: string
          theme_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branding_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_accounts: {
        Row: {
          account_name: string
          chart_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          current_balance: number
          id: string
          opening_balance: number
          updated_at: string
        }
        Insert: {
          account_name: string
          chart_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          opening_balance?: number
          updated_at?: string
        }
        Update: {
          account_name?: string
          chart_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          current_balance?: number
          id?: string
          opening_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_accounts_chart_account_id_fkey"
            columns: ["chart_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          is_system: boolean
          normal_balance: string
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          normal_balance: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          normal_balance?: string
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          business_type: string | null
          city: string | null
          company_size: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          phone: string | null
          primary_color: string | null
          slogan: string | null
          slug: string
          tax_registration_number: string | null
          theme_color: string
          timezone: string
          tracking_prefix: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          phone?: string | null
          primary_color?: string | null
          slogan?: string | null
          slug: string
          tax_registration_number?: string | null
          theme_color?: string
          timezone?: string
          tracking_prefix?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_size?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          primary_color?: string | null
          slogan?: string | null
          slug?: string
          tax_registration_number?: string | null
          theme_color?: string
          timezone?: string
          tracking_prefix?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          accounting_settings: Json
          billing_preferences: Json
          business_information: Json
          company_email: string | null
          company_id: string
          company_phone: string | null
          created_at: string
          created_by: string | null
          email_templates: Json
          id: string
          integrations: Json
          language_preferences: Json
          notification_preferences: Json
          onboarding_state: Json
          updated_at: string
          whatsapp_templates: Json
        }
        Insert: {
          accounting_settings?: Json
          billing_preferences?: Json
          business_information?: Json
          company_email?: string | null
          company_id: string
          company_phone?: string | null
          created_at?: string
          created_by?: string | null
          email_templates?: Json
          id?: string
          integrations?: Json
          language_preferences?: Json
          notification_preferences?: Json
          onboarding_state?: Json
          updated_at?: string
          whatsapp_templates?: Json
        }
        Update: {
          accounting_settings?: Json
          billing_preferences?: Json
          business_information?: Json
          company_email?: string | null
          company_id?: string
          company_phone?: string | null
          created_at?: string
          created_by?: string | null
          email_templates?: Json
          id?: string
          integrations?: Json
          language_preferences?: Json
          notification_preferences?: Json
          onboarding_state?: Json
          updated_at?: string
          whatsapp_templates?: Json
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          role_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          role_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          role_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          metadata: Json
          name: string
          phone: string | null
          service: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          metadata?: Json
          name: string
          phone?: string | null
          service?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          metadata?: Json
          name?: string
          phone?: string | null
          service?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_activity_logs: {
        Row: {
          activity_type: string
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          description: string | null
          id: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_activity_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contacts: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_ledger: {
        Row: {
          balance: number
          company_id: string
          created_at: string
          created_by: string | null
          credit: number
          customer_id: string | null
          debit: number
          id: string
          reference_id: string | null
          reference_module: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          credit?: number
          customer_id?: string | null
          debit?: number
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          customer_id?: string | null
          debit?: number
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_ledger_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          balance: number
          city: string | null
          company_id: string
          company_name: string
          contact_name: string | null
          country: string | null
          created_at: string
          created_by: string | null
          customer_type: string
          email: string | null
          full_name: string | null
          id: string
          is_vip: boolean
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          city?: string | null
          company_id: string
          company_name: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          city?: string | null
          company_id?: string
          company_name?: string
          contact_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          account_name: string
          company_id: string
          created_at: string
          created_by: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_port: number | null
          is_default: boolean
          provider: string
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: boolean
          smtp_username: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_name: string
          company_id: string
          created_at?: string
          created_by?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_default?: boolean
          provider?: string
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean
          smtp_username?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          is_default?: boolean
          provider?: string
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean
          smtp_username?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_attachments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email_message_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email_message_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email_message_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_attachments_email_message_id_fkey"
            columns: ["email_message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_folders: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          folder_key: string
          folder_name: string
          id: string
          sort_order: number
          unread_count: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          folder_key: string
          folder_name: string
          id?: string
          sort_order?: number
          unread_count?: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          folder_key?: string
          folder_name?: string
          id?: string
          sort_order?: number
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_folders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_folders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email_message_id: string | null
          event_type: string
          id: string
          metadata: Json
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email_message_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email_message_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_email_message_id_fkey"
            columns: ["email_message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          account_id: string | null
          bcc: string | null
          body: string | null
          cc: string | null
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          folder: string
          from_email: string | null
          id: string
          is_read: boolean
          provider_message_id: string | null
          received_at: string | null
          recipient: string
          related_customer_id: string | null
          related_invoice_id: string | null
          related_quote_id: string | null
          related_shipment_id: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          bcc?: string | null
          body?: string | null
          cc?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          folder?: string
          from_email?: string | null
          id?: string
          is_read?: boolean
          provider_message_id?: string | null
          received_at?: string | null
          recipient: string
          related_customer_id?: string | null
          related_invoice_id?: string | null
          related_quote_id?: string | null
          related_shipment_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          bcc?: string | null
          body?: string | null
          cc?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          folder?: string
          from_email?: string | null
          id?: string
          is_read?: boolean
          provider_message_id?: string | null
          received_at?: string | null
          recipient?: string
          related_customer_id?: string | null
          related_invoice_id?: string | null
          related_quote_id?: string | null
          related_shipment_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_related_customer_id_fkey"
            columns: ["related_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_related_invoice_id_fkey"
            columns: ["related_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_related_quote_id_fkey"
            columns: ["related_quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_related_shipment_id_fkey"
            columns: ["related_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          module: string | null
          subject: string
          template_name: string
          updated_at: string
        }
        Insert: {
          body: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module?: string | null
          subject: string
          template_name: string
          updated_at?: string
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          module?: string | null
          subject?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          bank_account_id: string | null
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          expense_category_id: string | null
          expense_number: string | null
          id: string
          journal_entry_id: string | null
          paid_at: string | null
          payment_method: string | null
          receipt_url: string | null
          status: string
          supplier_id: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
          vendor: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          bank_account_id?: string | null
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_category_id?: string | null
          expense_number?: string | null
          id?: string
          journal_entry_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vendor: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          bank_account_id?: string | null
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          expense_category_id?: string | null
          expense_number?: string | null
          id?: string
          journal_entry_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          receipt_url?: string | null
          status?: string
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_tokens: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          permissions: Json
          role_id: string | null
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          permissions?: Json
          role_id?: string | null
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          permissions?: Json
          role_id?: string | null
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_tokens_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          tax_rate: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          invoice_id: string
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          bank_details: string | null
          company_id: string
          created_at: string
          created_by: string | null
          default_tax_rate: number
          footer_notes: string | null
          id: string
          invoice_logo_url: string | null
          invoice_prefix: string
          next_invoice_number: number
          payment_receipt_prefix: string
          payment_terms: string | null
          quote_prefix: string
          updated_at: string
        }
        Insert: {
          bank_details?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          default_tax_rate?: number
          footer_notes?: string | null
          id?: string
          invoice_logo_url?: string | null
          invoice_prefix?: string
          next_invoice_number?: number
          payment_receipt_prefix?: string
          payment_terms?: string | null
          quote_prefix?: string
          updated_at?: string
        }
        Update: {
          bank_details?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          default_tax_rate?: number
          footer_notes?: string | null
          id?: string
          invoice_logo_url?: string | null
          invoice_prefix?: string
          next_invoice_number?: number
          payment_receipt_prefix?: string
          payment_terms?: string | null
          quote_prefix?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          balance_due: number
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          journal_entry_id: string | null
          paid_amount: number
          pdf_url: string | null
          posted_at: string | null
          quote_id: string | null
          shipment_id: string | null
          status: string
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount?: number
          balance_due?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          journal_entry_id?: string | null
          paid_amount?: number
          pdf_url?: string | null
          posted_at?: string | null
          quote_id?: string | null
          shipment_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          balance_due?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          journal_entry_id?: string | null
          paid_amount?: number
          pdf_url?: string | null
          posted_at?: string | null
          quote_id?: string | null
          shipment_id?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          id: string
          posted_at: string | null
          reference_id: string | null
          reference_module: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          entry_number: string
          id?: string
          posted_at?: string | null
          reference_id?: string | null
          reference_module?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          posted_at?: string | null
          reference_id?: string | null
          reference_module?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          company_id: string
          created_at: string
          created_by: string | null
          credit: number
          debit: number
          description: string | null
          id: string
          journal_entry_id: string
          updated_at: string
        }
        Insert: {
          account_id: string
          company_id: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          approval_notifications: boolean
          company_id: string
          created_at: string
          created_by: string | null
          email_notifications: boolean
          id: string
          payment_notifications: boolean
          shipment_notifications: boolean
          task_notifications: boolean
          updated_at: string
          whatsapp_notifications: boolean
        }
        Insert: {
          approval_notifications?: boolean
          company_id: string
          created_at?: string
          created_by?: string | null
          email_notifications?: boolean
          id?: string
          payment_notifications?: boolean
          shipment_notifications?: boolean
          task_notifications?: boolean
          updated_at?: string
          whatsapp_notifications?: boolean
        }
        Update: {
          approval_notifications?: boolean
          company_id?: string
          created_at?: string
          created_by?: string | null
          email_notifications?: boolean
          id?: string
          payment_notifications?: boolean
          shipment_notifications?: boolean
          task_notifications?: boolean
          updated_at?: string
          whatsapp_notifications?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          company_id: string
          completed_steps: Json
          created_at: string
          created_by: string | null
          current_step: string
          draft_data: Json
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          completed_steps?: Json
          created_at?: string
          created_by?: string | null
          current_step?: string
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          completed_steps?: Json
          created_at?: string
          created_by?: string | null
          current_step?: string
          draft_data?: Json
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      password_audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocations: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          payment_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          payment_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          payment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_id: string | null
          id: string
          invoice_id: string | null
          journal_entry_id: string | null
          method: string | null
          paid_at: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string | null
          payment_type: string
          reference: string | null
          reversed_at: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          bank_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          method?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string | null
          payment_type?: string
          reference?: string | null
          reversed_at?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_id?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          method?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string | null
          payment_type?: string
          reference?: string | null
          reversed_at?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      petty_cash_transactions: {
        Row: {
          amount: number
          cash_account_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          reconciled_at: string | null
          status: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          cash_account_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reconciled_at?: string | null
          status?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          reconciled_at?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "petty_cash_transactions_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petty_cash_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          features: Json
          id: string
          monthly_price: number
          name: string
          slug: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          features?: Json
          id?: string
          monthly_price?: number
          name: string
          slug: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          features?: Json
          id?: string
          monthly_price?: number
          name?: string
          slug?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_documents: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          quote_request_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          quote_request_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          quote_request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_documents_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          quantity: number
          quote_request_id: string
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          quantity?: number
          quote_request_id: string
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          quantity?: number
          quote_request_id?: string
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          cargo_description: string | null
          cargo_type: string | null
          company_id: string
          converted_shipment_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          destination: string | null
          estimated_pieces: number | null
          estimated_volume: number | null
          estimated_weight: number | null
          id: string
          notes: string | null
          origin: string | null
          quoted_amount: number
          requested_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          cargo_description?: string | null
          cargo_type?: string | null
          company_id: string
          converted_shipment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          destination?: string | null
          estimated_pieces?: number | null
          estimated_volume?: number | null
          estimated_weight?: number | null
          id?: string
          notes?: string | null
          origin?: string | null
          quoted_amount?: number
          requested_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          cargo_description?: string | null
          cargo_type?: string | null
          company_id?: string
          converted_shipment_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          destination?: string | null
          estimated_pieces?: number | null
          estimated_volume?: number | null
          estimated_weight?: number | null
          id?: string
          notes?: string | null
          origin?: string | null
          quoted_amount?: number
          requested_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_converted_shipment_id_fkey"
            columns: ["converted_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_status_logs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          from_status: string | null
          id: string
          notes: string | null
          quote_request_id: string
          to_status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          quote_request_id: string
          to_status: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          quote_request_id?: string
          to_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_status_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_status_logs_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number
          company_id: string
          converted_shipment_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          destination: string | null
          id: string
          origin: string | null
          pdf_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          company_id: string
          converted_shipment_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          destination?: string | null
          id?: string
          origin?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          converted_shipment_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          destination?: string | null
          id?: string
          origin?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_converted_shipment_id_fkey"
            columns: ["converted_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          data: Json
          filters: Json
          id: string
          name: string
          report_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          filters?: Json
          id?: string
          name: string
          report_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          filters?: Json
          id?: string
          name?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          permission_id: string
          role_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          permission_id: string
          role_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          permission_id?: string
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_documents: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          document_type: string
          file_name: string
          file_path: string
          id: string
          is_public: boolean
          mime_type: string | null
          shipment_id: string
          size_bytes: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          document_type: string
          file_name: string
          file_path: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          shipment_id: string
          size_bytes?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          is_public?: boolean
          mime_type?: string | null
          shipment_id?: string
          size_bytes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_documents_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          location: string | null
          notes: string | null
          shipment_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          shipment_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_pricing: {
        Row: {
          chargeable_weight: number
          company_id: string
          cost_amount: number
          created_at: string
          created_by: string | null
          customs_fee: number
          discount: number
          handling_fee: number
          height: number
          id: string
          insurance_fee: number
          length: number
          pieces: number
          profit_margin: number
          rate_per_cbm: number
          rate_per_kg: number
          rate_per_piece: number
          shipment_id: string
          subtotal: number
          tax: number
          total_amount: number
          updated_at: string
          use_balance_weight: boolean
          use_pieces: boolean
          use_volume: boolean
          volume_cbm: number
          volumetric_weight: number
          weight_kg: number
          width: number
        }
        Insert: {
          chargeable_weight?: number
          company_id: string
          cost_amount?: number
          created_at?: string
          created_by?: string | null
          customs_fee?: number
          discount?: number
          handling_fee?: number
          height?: number
          id?: string
          insurance_fee?: number
          length?: number
          pieces?: number
          profit_margin?: number
          rate_per_cbm?: number
          rate_per_kg?: number
          rate_per_piece?: number
          shipment_id: string
          subtotal?: number
          tax?: number
          total_amount?: number
          updated_at?: string
          use_balance_weight?: boolean
          use_pieces?: boolean
          use_volume?: boolean
          volume_cbm?: number
          volumetric_weight?: number
          weight_kg?: number
          width?: number
        }
        Update: {
          chargeable_weight?: number
          company_id?: string
          cost_amount?: number
          created_at?: string
          created_by?: string | null
          customs_fee?: number
          discount?: number
          handling_fee?: number
          height?: number
          id?: string
          insurance_fee?: number
          length?: number
          pieces?: number
          profit_margin?: number
          rate_per_cbm?: number
          rate_per_kg?: number
          rate_per_piece?: number
          shipment_id?: string
          subtotal?: number
          tax?: number
          total_amount?: number
          updated_at?: string
          use_balance_weight?: boolean
          use_pieces?: boolean
          use_volume?: boolean
          volume_cbm?: number
          volumetric_weight?: number
          weight_kg?: number
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_pricing_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_pricing_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_status_logs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          from_status: string | null
          id: string
          location: string | null
          notes: string | null
          public_note: string | null
          shipment_id: string
          to_status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          public_note?: string | null
          shipment_id: string
          to_status: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          public_note?: string | null
          shipment_id?: string
          to_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_status_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_status_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          assigned_driver: string | null
          assigned_staff_id: string | null
          barcode_value: string | null
          cargo_category: string | null
          cargo_description: string | null
          cargo_details: string | null
          cargo_type: string | null
          chargeable_weight: number | null
          company_id: string
          cost_amount: number
          created_at: string
          created_by: string | null
          currency: string
          customer_destination: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customs_fee: number
          deleted_at: string | null
          deleted_by: string | null
          delivery_notes: string | null
          destination: string | null
          dimensions: Json
          discount: number
          documents: Json
          estimated_delivery: string | null
          handling_fee: number
          height: number | null
          id: string
          insurance_fee: number
          last_tracked_at: string | null
          length: number | null
          notes: string | null
          origin: string | null
          pieces: number | null
          price: number
          profit_margin: number
          qr_code_value: string | null
          rate_per_cbm: number
          rate_per_kg: number
          rate_per_piece: number
          receiver_name: string | null
          receiver_signature_url: string | null
          reference_number: string | null
          route: string | null
          status: string
          subtotal: number
          supplier_email: string | null
          supplier_location: string | null
          supplier_name: string | null
          supplier_phone: string | null
          tax: number
          total_amount: number
          tracking_access_count: number
          tracking_number: string
          updated_at: string
          volume_cbm: number | null
          volumetric_weight: number | null
          weight: number | null
          weight_kg: number | null
          width: number | null
        }
        Insert: {
          actual_delivery?: string | null
          assigned_driver?: string | null
          assigned_staff_id?: string | null
          barcode_value?: string | null
          cargo_category?: string | null
          cargo_description?: string | null
          cargo_details?: string | null
          cargo_type?: string | null
          chargeable_weight?: number | null
          company_id: string
          cost_amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_destination?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customs_fee?: number
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_notes?: string | null
          destination?: string | null
          dimensions?: Json
          discount?: number
          documents?: Json
          estimated_delivery?: string | null
          handling_fee?: number
          height?: number | null
          id?: string
          insurance_fee?: number
          last_tracked_at?: string | null
          length?: number | null
          notes?: string | null
          origin?: string | null
          pieces?: number | null
          price?: number
          profit_margin?: number
          qr_code_value?: string | null
          rate_per_cbm?: number
          rate_per_kg?: number
          rate_per_piece?: number
          receiver_name?: string | null
          receiver_signature_url?: string | null
          reference_number?: string | null
          route?: string | null
          status?: string
          subtotal?: number
          supplier_email?: string | null
          supplier_location?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tax?: number
          total_amount?: number
          tracking_access_count?: number
          tracking_number: string
          updated_at?: string
          volume_cbm?: number | null
          volumetric_weight?: number | null
          weight?: number | null
          weight_kg?: number | null
          width?: number | null
        }
        Update: {
          actual_delivery?: string | null
          assigned_driver?: string | null
          assigned_staff_id?: string | null
          barcode_value?: string | null
          cargo_category?: string | null
          cargo_description?: string | null
          cargo_details?: string | null
          cargo_type?: string | null
          chargeable_weight?: number | null
          company_id?: string
          cost_amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_destination?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customs_fee?: number
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_notes?: string | null
          destination?: string | null
          dimensions?: Json
          discount?: number
          documents?: Json
          estimated_delivery?: string | null
          handling_fee?: number
          height?: number | null
          id?: string
          insurance_fee?: number
          last_tracked_at?: string | null
          length?: number | null
          notes?: string | null
          origin?: string | null
          pieces?: number | null
          price?: number
          profit_margin?: number
          qr_code_value?: string | null
          rate_per_cbm?: number
          rate_per_kg?: number
          rate_per_piece?: number
          receiver_name?: string | null
          receiver_signature_url?: string | null
          reference_number?: string | null
          route?: string | null
          status?: string
          subtotal?: number
          supplier_email?: string | null
          supplier_location?: string | null
          supplier_name?: string | null
          supplier_phone?: string | null
          tax?: number
          total_amount?: number
          tracking_access_count?: number
          tracking_number?: string
          updated_at?: string
          volume_cbm?: number | null
          volumetric_weight?: number | null
          weight?: number | null
          weight_kg?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          account_status: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          department: string | null
          email: string | null
          full_name: string
          id: string
          join_date: string | null
          location: string | null
          notes: string | null
          phone: string | null
          position: string | null
          profile_id: string | null
          profile_photo_url: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          role_id: string | null
          staff_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_status?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name: string
          id?: string
          join_date?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          profile_photo_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role_id?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_status?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          email?: string | null
          full_name?: string
          id?: string
          join_date?: string | null
          location?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          profile_id?: string | null
          profile_photo_url?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          role_id?: string | null
          staff_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_permissions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          permission_id: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          permission_id: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          permission_id?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_permissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          current_period_end: string | null
          id: string
          monthly_price: number
          plan_id: string | null
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          id?: string
          monthly_price?: number
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          current_period_end?: string | null
          id?: string
          monthly_price?: number
          plan_id?: string | null
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_bills: {
        Row: {
          balance_due: number
          bill_date: string
          bill_number: string
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          id: string
          journal_entry_id: string | null
          paid_amount: number
          status: string
          subtotal: number
          supplier_id: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          balance_due?: number
          bill_date?: string
          bill_number: string
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          balance_due?: number
          bill_date?: string
          bill_number?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          journal_entry_id?: string | null
          paid_amount?: number
          status?: string
          subtotal?: number
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_bills_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_ledger: {
        Row: {
          balance: number
          company_id: string
          created_at: string
          created_by: string | null
          credit: number
          debit: number
          id: string
          reference_id: string | null
          reference_module: string | null
          supplier_id: string | null
          transaction_date: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          balance?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          supplier_id?: string | null
          transaction_date?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          debit?: number
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          supplier_id?: string | null
          transaction_date?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_ledger_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_ledger_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          phone: string | null
          status: string
          supplier_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          balance?: number
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          supplier_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          balance?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          status?: string
          supplier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          comment: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          comment?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_logs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          from_status: string | null
          id: string
          notes: string | null
          task_id: string
          to_status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          task_id: string
          to_status: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          from_status?: string | null
          id?: string
          notes?: string | null
          task_id?: string
          to_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          attachments: Json
          comments: Json
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          attachments?: Json
          comments?: Json
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          attachments?: Json
          comments?: Json
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          rate: number
          tax_account_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          rate?: number
          tax_account_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
          tax_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_rates_tax_account_id_fkey"
            columns: ["tax_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_transactions: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          reference_id: string | null
          reference_module: string | null
          tax_amount: number
          tax_rate_id: string | null
          taxable_amount: number
          transaction_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          tax_amount?: number
          tax_rate_id?: string | null
          taxable_amount?: number
          transaction_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reference_id?: string | null
          reference_module?: string | null
          tax_amount?: number
          tax_rate_id?: string | null
          taxable_amount?: number
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_transactions_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferences: Json
          profile_photo_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferences?: Json
          profile_photo_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      website_tracking_events: {
        Row: {
          company_id: string | null
          created_at: string
          created_by: string | null
          id: string
          shipment_id: string | null
          tracking_number: string
          updated_at: string
          user_agent: string | null
          visitor_ip: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          shipment_id?: string | null
          tracking_number: string
          updated_at?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          shipment_id?: string | null
          tracking_number?: string
          updated_at?: string
          user_agent?: string | null
          visitor_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_tracking_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_logs: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          metadata: Json
          status: string
          updated_at: string
          whatsapp_message_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          status?: string
          updated_at?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_logs_whatsapp_message_id_fkey"
            columns: ["whatsapp_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          message: string | null
          message_body: string | null
          message_type: string | null
          phone: string
          provider_message_id: string | null
          sent_at: string | null
          sent_by: string | null
          shipment_id: string | null
          status: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          message?: string | null
          message_body?: string | null
          message_type?: string | null
          phone: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          shipment_id?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          message?: string | null
          message_body?: string | null
          message_type?: string | null
          phone?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sent_by?: string | null
          shipment_id?: string | null
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_ready: boolean
          business_phone: string | null
          company_id: string
          configuration: Json
          created_at: string
          created_by: string | null
          default_country_code: string
          id: string
          provider: string
          updated_at: string
        }
        Insert: {
          api_ready?: boolean
          business_phone?: string | null
          company_id: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          default_country_code?: string
          id?: string
          provider?: string
          updated_at?: string
        }
        Update: {
          api_ready?: boolean
          business_phone?: string | null
          company_id?: string
          configuration?: Json
          created_at?: string
          created_by?: string | null
          default_country_code?: string
          id?: string
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          body: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message_type: string
          template_name: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_type: string
          template_name: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_type?: string
          template_name?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_api_rate_limit: {
        Args: {
          maximum_requests: number
          target_key: string
          window_seconds: number
        }
        Returns: boolean
      }
      current_company_ids: { Args: never; Returns: string[] }
      is_company_member: {
        Args: { target_company_id: string }
        Returns: boolean
      }
      post_expense_transaction: {
        Args: { target_expense_id: string }
        Returns: string
      }
      post_invoice_transaction: {
        Args: { target_invoice_id: string }
        Returns: string
      }
      post_journal_entry: {
        Args: { target_entry_id: string }
        Returns: undefined
      }
      post_payment_transaction: {
        Args: {
          target_amount: number
          target_company_id: string
          target_currency: string
          target_invoice_id: string
          target_payment_date: string
          target_payment_method: string
          target_payment_number: string
          target_payment_type: string
          target_reference: string
        }
        Returns: string
      }
      reserve_api_idempotency_key: {
        Args: { target_key: string; ttl_seconds: number }
        Returns: boolean
      }
      update_shipment_status_transaction: {
        Args: {
          target_notes?: string
          target_shipment_id: string
          target_status: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { permission_key: string; target_company_id: string }
        Returns: boolean
      }
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
