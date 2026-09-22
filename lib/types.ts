// Mirrors the Supabase schema in supabase/schema.sql

export type ClothingCategory =
  | 'top'
  | 'bottom'
  | 'shoes'
  | 'mid'
  | 'jacket'
  | 'accessory';

export interface Profile {
  id: string; // = auth.users.id
  email: string | null;
  first_name: string | null;
  profile_photo_url: string | null;
  profile_photo_clean_url: string | null; // after SAM
  location_city: string | null;
  onboarded: boolean;
  created_at: string;
}

export interface Clothing {
  id: string;
  user_id: string;
  name: string | null;
  favorite: boolean;
  /** In the laundry basket — excluded from outfit suggestions. */
  dirty: boolean;
  photo_url: string;
  photo_clean_url: string | null; // after SAM
  category: ClothingCategory | null;
  dominant_color: string | null; // hex
  style_tags: string[] | null;
  created_at: string;
}

export interface Outfit {
  id: string;
  user_id: string;
  clothes_ids: string[];
  generated_at: string;
  weather_context: string | null; // temp + condition at generation time
  liked: boolean | null; // true / false / null
  planned_for: string | null; // YYYY-MM-DD when this look belongs to a weekly plan
  plan_scope: 'day' | 'week';
  rationale: string | null;
}

export interface TryonResult {
  id: string;
  user_id: string;
  outfit_id: string;
  result_image_url: string;
  generated_at: string;
}
