import type { Ionicons } from '@expo/vector-icons';
import type { ClothingCategory } from '@/lib/types';

export const CATEGORIES: {
  key: ClothingCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'top', label: 'Top', icon: 'shirt-outline' },
  { key: 'bottom', label: 'Bas', icon: 'walk-outline' },
  { key: 'shoes', label: 'Chaussures', icon: 'footsteps-outline' },
  { key: 'jacket', label: 'Veste', icon: 'body-outline' },
  { key: 'accessory', label: 'Accessoire', icon: 'watch-outline' },
];

export function categoryLabel(key: string | null): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? 'Autre';
}
