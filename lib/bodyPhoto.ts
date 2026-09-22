import type { ImagePickerAsset } from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';

/** Problems the AI can report on the try-on photo (see check-body-photo). */
export type BodyAiIssue =
  | 'no_person'
  | 'several_people'
  | 'not_full_body'
  | 'not_facing_front'
  | 'face_hidden'
  | 'mirror_selfie'
  | 'arms_covering_body'
  | 'bulky_clothes'
  | 'too_dark'
  | 'blurry';

/**
 * Stores the try-on photo and makes it the profile photo. Each upload gets its
 * own file name: storage objects are cached for a year, so overwriting one
 * would keep showing (and sending to the AI) the previous picture.
 */
export async function saveBodyPhoto(
  userId: string,
  email: string | null | undefined,
  asset: ImagePickerAsset,
  extra: Record<string, unknown> = {}
): Promise<string> {
  const url = await uploadImage('profiles', `${userId}/body-${Date.now()}.jpg`, asset);
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email: email ?? null,
    profile_photo_url: url,
    // The old cut-out belongs to the old photo.
    profile_photo_clean_url: null,
    ...extra,
  });
  if (error) throw error;
  return url;
}

/** AI check of the stored photo. Null when the check is unavailable. */
export async function aiCheckBodyPhoto(): Promise<BodyAiIssue[] | null> {
  const { data, error } = await supabase.functions.invoke('check-body-photo', { body: {} });
  if (error || data?.error || !Array.isArray(data?.issues)) return null;
  return data.issues as BodyAiIssue[];
}
