export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      receipts: {
        Row: {
          id: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_type: 'image' | 'pdf';
          file_size: number | null;
          amount: number | null;
          amount_net: number | null;
          amount_tax: number | null;
          amount_gross: number | null;
          tax_rate: number | null;
          receipt_date: string | null;
          category: string | null;
          vendor: string | null;
          raw_ocr_text: string | null;
          created_at: string;
          updated_at: string;
          processed: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_url: string;
          file_name: string;
          file_type: 'image' | 'pdf';
          file_size?: number | null;
          amount?: number | null;
          amount_net?: number | null;
          amount_tax?: number | null;
          amount_gross?: number | null;
          tax_rate?: number | null;
          receipt_date?: string | null;
          category?: string | null;
          vendor?: string | null;
          raw_ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
          processed?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_url?: string;
          file_name?: string;
          file_type?: 'image' | 'pdf';
          file_size?: number | null;
          amount?: number | null;
          amount_net?: number | null;
          amount_tax?: number | null;
          amount_gross?: number | null;
          tax_rate?: number | null;
          receipt_date?: string | null;
          category?: string | null;
          vendor?: string | null;
          raw_ocr_text?: string | null;
          created_at?: string;
          updated_at?: string;
          processed?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type Receipt = Database['public']['Tables']['receipts']['Row'];
export type ReceiptInsert = Database['public']['Tables']['receipts']['Insert'];
export type ReceiptUpdate = Database['public']['Tables']['receipts']['Update'];
