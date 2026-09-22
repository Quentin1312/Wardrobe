import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image as NativeImage, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Clothing } from '@/lib/types';

const DISPLAY_MAX_EDGE = 900;
const optimizedThisSession = new Set<string>();

export function clothingImageUri(item: Clothing): string {
  return item.photo_clean_url ?? item.photo_url;
}

/** Warm the shared image cache without delaying the screen render. */
export function prefetchClothingImages(items: Clothing[], limit = 18): void {
  const urls = [...new Set(items.slice(0, limit).map(clothingImageUri).filter(Boolean))];
  if (urls.length === 0) return;
  void ExpoImage.prefetch(urls, 'memory-disk').catch(() => false);
}

function imageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    NativeImage.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function localUri(uri: string, key: string): Promise<string> {
  if (Platform.OS === 'web' || /^(file|data|blob|content|ph|assets-library):/.test(uri)) return uri;
  const target = `${FileSystem.cacheDirectory}wardrobe-display-${key}`;
  const result = await FileSystem.downloadAsync(uri, target);
  return result.uri;
}

/**
 * Re-encodes old full-resolution transparent PNGs once as compact WebP files.
 * New background removals already arrive in this format, so this is a silent
 * one-time migration for clothes that predate the optimisation.
 */
export async function optimizeLegacyCleanPhotos(
  items: Clothing[],
  onOptimized?: (id: string, url: string) => void
): Promise<void> {
  for (const item of items) {
    const source = item.photo_clean_url;
    // Studio renders are already compact WebP files with their own unique name.
    if (!source || /-(?:clean|display|studio-\d+)\.webp(?:\?|$)/i.test(source) || optimizedThisSession.has(item.id)) {
      continue;
    }
    optimizedThisSession.add(item.id);

    try {
      const [{ width, height }, src] = await Promise.all([
        imageSize(source),
        localUri(source, item.id),
      ]);
      const largestEdge = Math.max(width, height);
      const action = largestEdge > DISPLAY_MAX_EDGE
        ? width >= height
          ? { resize: { width: DISPLAY_MAX_EDGE } }
          : { resize: { height: DISPLAY_MAX_EDGE } }
        : null;
      const display = await ImageManipulator.manipulateAsync(
        src,
        action ? [action] : [],
        {
          base64: true,
          compress: 0.78,
          format: ImageManipulator.SaveFormat.WEBP,
        }
      );
      if (!display.base64) continue;

      const path = `${item.user_id}/${item.id}-display.webp`;
      const { error: uploadError } = await supabase.storage
        .from('clothes')
        .upload(path, decode(display.base64), {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        });
      if (uploadError) continue;

      const { data } = supabase.storage.from('clothes').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('clothes')
        .update({ photo_clean_url: data.publicUrl })
        .eq('id', item.id)
        .eq('user_id', item.user_id);
      if (updateError) continue;

      void ExpoImage.prefetch(data.publicUrl, 'memory-disk').catch(() => false);
      onOptimized?.(item.id, data.publicUrl);
    } catch {
      // Optimisation is best-effort; the original photo remains valid.
    }
  }
}
