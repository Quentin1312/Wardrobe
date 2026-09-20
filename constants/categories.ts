import type { Ionicons } from '@expo/vector-icons';
import type { ClothingCategory } from '@/lib/types';

export const CATEGORIES: {
  key: ClothingCategory;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'top', icon: 'shirt-outline' },
  { key: 'bottom', icon: 'walk-outline' },
  { key: 'shoes', icon: 'footsteps-outline' },
  { key: 'jacket', icon: 'body-outline' },
  { key: 'accessory', icon: 'watch-outline' },
];

/** i18n key for a category (falls back to category.other). */
export function categoryKey(cat: string | null): string {
  const known = CATEGORIES.some((c) => c.key === cat);
  return known ? `category.${cat}` : 'category.other';
}
