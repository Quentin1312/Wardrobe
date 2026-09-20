import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

/**
 * Uploads a local image (from camera / picker) to a Supabase storage bucket.
 * Returns the public URL.
 */
export async function uploadImage(
  bucket: string,
  path: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  if (!asset.base64) {
    throw new Error('Image asset has no base64 data. Request base64 in the picker options.');
  }

  const contentType = asset.mimeType ?? 'image/jpeg';
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(asset.base64), { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
