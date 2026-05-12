import { Allergen, DietGoal, DietType } from '@/lib/types';

export const GOALS: { id: DietGoal; label: string; icon: string; description: string }[] = [
  { id: 'none', label: 'No Goal', icon: 'restaurant-outline', description: 'Just browsing the menu' },
  { id: 'weight_loss', label: 'Weight Loss', icon: 'trending-down-outline', description: 'Low calorie, balanced macros' },
  { id: 'muscle_gain', label: 'Muscle Gain', icon: 'barbell-outline', description: 'High protein, sufficient calories' },
  { id: 'keto', label: 'Keto', icon: 'flame-outline', description: 'High fat, very low carbs (<20g)' },
  { id: 'low_carb', label: 'Low Carb', icon: 'leaf-outline', description: 'Reduced carbohydrates (<50g)' },
];

export const DIET_TYPES: { id: DietType; label: string; icon: string }[] = [
  { id: 'none', label: 'No Restriction', icon: 'restaurant-outline' },
  { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf-outline' },
  { id: 'vegan', label: 'Vegan', icon: 'flower-outline' },
];

export const ALLERGENS: { id: Allergen; label: string; emoji: string }[] = [
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'nuts', label: 'Nuts', emoji: '🥜' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
];
