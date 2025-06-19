export interface Address {
  id: number;
  user_id: number;
  is_default: boolean;
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  created_at?: string;
  updated_at?: string;
}
