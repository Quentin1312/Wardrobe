import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { analyzeClothing, generateStudioPhoto, removeBackground, setClothingCleanPhoto } from '@/lib/clothes';
import { useLocale } from '@/context/LocaleContext';

/**
 * Every new piece gets a studio render, without making the user wait: adding a
 * garment only uploads the photo, then this queue cleans it up in the
 * background (background removal, then the AI packshot) one piece at a time.
 * New additions are also catalogued for the stylist in parallel.
 */
interface StudioQueue {
  /** Pieces still being processed. */
  pending: number;
  /** Name of the piece being worked on, for the little badge. */
  current: string | null;
  enqueue: (job: Job) => void;
}

const Context = createContext<StudioQueue>({ pending: 0, current: null, enqueue: () => {} });

export function useStudioQueue() {
  return useContext(Context);
}

type Job = { id: string; name?: string | null; needsCutout?: boolean; analyze?: boolean };

export function StudioQueueProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocale();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const running = useRef(false);

  const enqueue = useCallback((job: Job) => {
    setJobs((previous) => (previous.some((j) => j.id === job.id) ? previous : [...previous, job]));
  }, []);

  useEffect(() => {
    if (running.current || jobs.length === 0) return;
    running.current = true;
    const job = jobs[0];
    setCurrent(job.name ?? null);

    (async () => {
      const analysis = job.analyze
        ? analyzeClothing(job.id, locale).catch((error) => ({ error: String(error) }))
        : null;
      try {
        // A quick cut-out first: the wardrobe shows something clean right away.
        if (job.needsCutout !== false) await removeBackground(job.id);
        const studio = await generateStudioPhoto(job.id);
        if (studio.url) await setClothingCleanPhoto(job.id, studio.url);
      } catch {
        // Best effort: the piece keeps the photo it already has.
      } finally {
        if (analysis) {
          const result = await analysis;
          if (result.error) console.warn('Garment analysis failed:', result.error);
        }
        running.current = false;
        setCurrent(null);
        setJobs((previous) => previous.filter((j) => j.id !== job.id));
      }
    })();
  }, [jobs, locale]);

  return <Context.Provider value={{ pending: jobs.length, current, enqueue }}>{children}</Context.Provider>;
}
