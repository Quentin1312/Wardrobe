// TEMPORARY visual test: three layers with long names. Delete after checking.
import { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { OutfitStudio } from '@/components/OutfitStudio';
import type { Clothing, ClothingCategory } from '@/lib/types';

function draw(w: number, h: number, color: string, fn: (x: CanvasRenderingContext2D) => void): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = color;
  fn(x);
  return c.toDataURL('image/png');
}
const piece = (id: string, category: ClothingCategory, name: string, url: string) =>
  ({ id, category, name, photo_url: url, photo_clean_url: url }) as Clothing;

export default function StudioPreview() {
  const items = useMemo(() => {
    const tee = draw(900, 900, '#1F4B43', (x) => { x.fillRect(300, 280, 300, 380); x.fillRect(200, 300, 100, 140); x.fillRect(600, 300, 100, 140); });
    const hoodie = draw(800, 800, '#E8E2D6', (x) => { x.fillRect(220, 200, 360, 440); x.beginPath(); x.arc(400, 210, 120, Math.PI, 0); x.fill(); });
    const coat = draw(700, 900, '#4B5A36', (x) => { x.fillRect(90, 90, 520, 760); x.beginPath(); x.arc(350, 120, 150, Math.PI, 0); x.fill(); });
    const jean = draw(420, 950, '#23262B', (x) => { x.fillRect(20, 10, 380, 930); });
    const shoes = draw(800, 360, '#FFFFFF', (x) => { x.fillRect(60, 170, 300, 120); x.fillRect(430, 160, 320, 130); });
    return {
      top: [piece('t', 'top', 'T-shirt vert burger', tee)],
      mid: [piece('m', 'mid', 'Sweat Jordan beige capuche', hoodie)],
      jacket: [piece('j', 'jacket', 'Manteau Napa', coat)],
      bottom: [piece('b', 'bottom', 'Jean noir Fendi', jean)],
      shoes: [piece('s', 'shoes', 'Campus adidas', shoes)],
      accessory: [],
    } as Record<ClothingCategory, Clothing[]>;
  }, []);

  const [hidden, setHidden] = useState<ClothingCategory[]>([]);
  const current = (c: ClothingCategory) => (hidden.includes(c) ? null : items[c][0] ?? null);
  const counts = Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.length])) as Record<ClothingCategory, number>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0B0B0C' }} contentContainerStyle={{ padding: 20, maxWidth: 420, alignSelf: 'center', width: '100%' }}>
      <OutfitStudio
        current={current}
        counts={counts}
        onPrevious={(c) => setHidden((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]))}
        onNext={(c) => setHidden((h) => (h.includes(c) ? h.filter((x) => x !== c) : [...h, c]))}
      />
    </ScrollView>
  );
}
