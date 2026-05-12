export type Allergen = 'dairy' | 'gluten' | 'nuts' | 'eggs' | 'shellfish' | 'fish' | 'soy';
export type DietaryTag = 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free' | 'low-carb';
export type DietGoal = 'none' | 'weight_loss' | 'muscle_gain' | 'keto' | 'low_carb';
export type DietType = 'none' | 'vegan' | 'vegetarian';

export interface MenuItem {
  name: string;
  description: string;
  section: string;
  price: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  allergens: Allergen[];
  dietary_tags: DietaryTag[];
  is_spicy: boolean;
  confidence: 'high' | 'medium' | 'low';
  fit_score?: number;
  fit_reason?: string;
}

export interface MenuAnalysis {
  scan_id: string;
  restaurant_name: string | null;
  cuisine_type: string | null;
  items: MenuItem[];
  scan_notes: string;
}

export interface DietaryProfile {
  goal: DietGoal;
  diet_type: DietType;
  allergens: Allergen[];
}

export interface ScanHistoryItem {
  id: string;
  restaurant_name: string | null;
  cuisine_type: string | null;
  items_count: number;
  created_at: string;
}

export interface PendingImage {
  base64: string;
  mediaType: string;
}
