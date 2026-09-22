import { colorName } from '@/lib/color';
import type { Clothing } from '@/lib/types';

export const COLOR_CHOICES = [
  { name: 'noir', hex: '#171717', en: 'black' },
  { name: 'anthracite', hex: '#444447', en: 'charcoal' },
  { name: 'gris', hex: '#898989', en: 'grey' },
  { name: 'gris clair', hex: '#cacaca', en: 'light grey' },
  { name: 'blanc', hex: '#f4f4f2', en: 'white' },
  { name: 'beige', hex: '#d9cbb3', en: 'beige' },
  { name: 'camel', hex: '#ae7d4c', en: 'camel' },
  { name: 'marron', hex: '#68432e', en: 'brown' },
  { name: 'bordeaux', hex: '#742438', en: 'burgundy' },
  { name: 'rouge', hex: '#cf3435', en: 'red' },
  { name: 'orange', hex: '#df7c35', en: 'orange' },
  { name: 'jaune', hex: '#e5c536', en: 'yellow' },
  { name: 'kaki', hex: '#777b46', en: 'khaki' },
  { name: 'vert foncé', hex: '#1d4d3a', en: 'dark green' },
  { name: 'vert', hex: '#38845a', en: 'green' },
  { name: 'bleu canard', hex: '#287781', en: 'teal' },
  { name: 'bleu marine', hex: '#273c60', en: 'navy' },
  { name: 'bleu jean', hex: '#6685ad', en: 'denim blue' },
  { name: 'bleu clair', hex: '#a4cbe5', en: 'light blue' },
  { name: 'bleu', hex: '#3569bf', en: 'blue' },
  { name: 'violet', hex: '#704992', en: 'purple' },
  { name: 'rose', hex: '#db8aa8', en: 'pink' },
] as const;

export type GarmentColor = (typeof COLOR_CHOICES)[number]['name'];

export function colorsFromHexes(hexes: string[]): GarmentColor[] {
  return [...new Set(hexes.map((hex) => colorName(hex, 'fr')))]
    .filter((name): name is GarmentColor => COLOR_CHOICES.some((choice) => choice.name === name))
    .slice(0, 3);
}

export function readGarmentMeta(item: Pick<Clothing, 'style_tags' | 'dominant_color'>): {
  colors: GarmentColor[];
  description: string;
} {
  const tags = item.style_tags ?? [];
  const colorTag = tags.find((tag) => tag.startsWith('couleurs:'));
  const colors = colorTag
    ? colorTag.slice('couleurs:'.length).split(' + ').filter((name): name is GarmentColor =>
        COLOR_CHOICES.some((choice) => choice.name === name))
    : colorsFromHexes(item.dominant_color ? [item.dominant_color] : []);
  return {
    colors,
    description: tags.find((tag) => tag.startsWith('description:'))?.slice('description:'.length) ?? '',
  };
}

export function writeGarmentMeta(
  existing: string[] | null,
  colors: GarmentColor[],
  description: string
): string[] {
  const preserved = (existing ?? []).filter((tag) =>
    !tag.startsWith('couleurs:') && !tag.startsWith('description:'));
  if (colors.length) preserved.push(`couleurs:${colors.join(' + ')}`);
  const detail = description.trim().replace(/\s+/g, ' ').slice(0, 280);
  if (detail) preserved.push(`description:${detail}`);
  return preserved;
}

export function primaryColorHex(colors: GarmentColor[]): string | null {
  return COLOR_CHOICES.find((choice) => choice.name === colors[0])?.hex ?? null;
}
