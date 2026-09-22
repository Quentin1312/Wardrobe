import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const MAX_UPLOAD_EDGE = 1600;

/**
 * Uploads a local image (from camera / picker) to a Supabase storage bucket.
 * Returns the public URL.
 */
export async function uploadImage(
  bucket: string,
  path: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  // Phone photos can easily weigh 5-15 MB. The app never displays them at that
  // resolution, so normalise them before sending anything over the network.
  const largestEdge = Math.max(asset.width ?? 0, asset.height ?? 0);
  const resize = largestEdge > MAX_UPLOAD_EDGE
    ? asset.width >= asset.height
      ? { resize: { width: MAX_UPLOAD_EDGE } }
      : { resize: { height: MAX_UPLOAD_EDGE } }
    : null;
  const prepared = await ImageManipulator.manipulateAsync(
    asset.uri,
    resize ? [resize] : [],
    {
      base64: true,
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  if (!prepared.base64) throw new Error('Unable to prepare image for upload.');

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(prepared.base64), {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
