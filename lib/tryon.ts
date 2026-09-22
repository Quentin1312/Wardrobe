import { supabase } from '@/lib/supabase';

export interface TryOnResponse {
  url?: string;
  error?: string;
  /** Every garment and the face passed the automatic check. */
  verified?: boolean;
  /** The automatic check ran (false: it was unavailable). */
  checked?: boolean;
  /** Remaining differences spotted by the check, in French. */
  warnings?: string[];
  /** Accessories left out of the render (too small to look right). */
  skipped?: string[];
  attempts?: number;
}

export async function generateTryOn(outfitId: string): Promise<TryOnResponse> {
  const { data, error } = await supabase.functions.invoke<TryOnResponse>('generate-tryon', {
    body: { outfitId },
  });

  if (error) {
    let detail = error.message;
    try {
      const body = await (error as { context?: { json?: () => Promise<TryOnResponse> } }).context?.json?.();
      if (body?.error) detail = body.error;
    } catch {
      // Keep the function invocation error when the response has no JSON body.
    }
    return { error: detail };
  }

  return data ?? { error: 'tryon_empty_response' };
}
