import type { Locale } from '@/lib/i18n';
import type { CompanionKind } from './art';

export type { CompanionKind } from './art';
export { COMPANION_ART } from './art';

export const COMPANION_KINDS: CompanionKind[] = ['dylan', 'miso', 'noisette'];

export const COMPANION_NAMES: Record<CompanionKind, string> = {
  dylan: 'Dylan',
  miso: 'Miso',
  noisette: 'Noisette',
};

/** What the companion knows about the user's day. */
export interface CompanionContext {
  firstName: string | null;
  temp: number | null;
  /** OpenWeather "main" group, e.g. "Rain", "Clear". */
  weatherMain: string | null;
  dirtyCount: number;
  lookValidated: boolean;
  hour: number;
  /** The piece left in the closet the longest (days = null: never worn). */
  forgotten?: { label: string; days: number | null } | null;
}

type Lines = { fr: string[]; en: string[] };

/** Each companion has its own voice. */
const VOICE: Record<CompanionKind, { hello: Lines; idle: Lines }> = {
  dylan: {
    hello: {
      fr: ['Ouaf ! {hi} {name} !', '{hi} {name} ! J’ai gardé la maison.', '{hi} {name} ! On sort aujourd’hui ?'],
      en: ['Woof! {hi} {name}!', '{hi} {name}! I kept an eye on the place.', '{hi} {name}! Are we going out today?'],
    },
    idle: {
      fr: [
        'Si on sortait faire une balade après ?',
        'J’ai un œil bleu et un œil marron. Toi t’as le style, on est quittes.',
        'Une caresse et je te trouve la tenue parfaite.',
      ],
      en: [
        'Walk later? Please?',
        'One blue eye, one brown. You bring the style, we’re even.',
        'One pat and I’ll find you the perfect outfit.',
      ],
    },
  },
  miso: {
    hello: {
      fr: ['{hi} {name}. Tu es enfin réveillé·e.', 'Miaou. {hi} {name}.', '{hi} {name}. J’ai dormi sur ton pull, désolée.'],
      en: ['{hi} {name}. You’re finally up.', 'Meow. {hi} {name}.', '{hi} {name}. I napped on your sweater. Sorry.'],
    },
    idle: {
      fr: [
        'Je juge tes tenues. Discrètement.',
        'Le beige te va bien. Presque autant qu’à moi.',
        'Un peu de noir, beaucoup d’élégance. Crois-moi.',
      ],
      en: [
        'I judge your outfits. Quietly.',
        'Beige suits you. Almost as much as it suits me.',
        'A little black, a lot of elegance. Trust me.',
      ],
    },
  },
  // A rabbit: soft, gentle, a little bouncy.
  noisette: {
    hello: {
      fr: ['Hop hop ! {hi} {name} !', '{hi} {name} ! J’ai gardé une carotte pour toi.', '{hi} {name}, prêt·e à sautiller ?'],
      en: ['Hop hop! {hi} {name}!', '{hi} {name}! I saved you a carrot.', '{hi} {name}, ready to hop into the day?'],
    },
    idle: {
      fr: [
        'Doux et confortable, c’est mon style. Et le tien ?',
        'Un petit saut et on trouve ta tenue !',
        'Mes oreilles me disent que tu vas être superbe aujourd’hui.',
      ],
      en: [
        'Soft and comfy, that’s my style. What’s yours?',
        'One little hop and we’ll find your outfit!',
        'My ears tell me you’ll look great today.',
      ],
    },
  },
};

const HI: Record<Locale, (h: number) => string> = {
  fr: (h) => (h < 12 ? 'Bonjour' : h < 18 ? 'Salut' : 'Bonsoir'),
  en: (h) => (h < 12 ? 'Good morning' : h < 18 ? 'Hi' : 'Good evening'),
};

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Candidate lines for the moment, most relevant first. The UI speaks the
 * first one on arrival and cycles through the rest when the pet is tapped.
 */
export function companionLines(kind: CompanionKind, ctx: CompanionContext, locale: Locale): string[] {
  const fr = locale === 'fr';
  const voice = VOICE[kind];
  const name = ctx.firstName ?? (fr ? 'toi' : 'you');
  const lines: string[] = [];

  lines.push(pick(voice.hello[locale]).replace('{hi}', HI[locale](ctx.hour)).replace('{name}', name));

  // Weather advice
  if (ctx.weatherMain === 'Rain' || ctx.weatherMain === 'Drizzle' || ctx.weatherMain === 'Thunderstorm') {
    lines.push(fr ? 'Il pleut : j’ai sorti mon parapluie. Évite le daim et prends une veste.' : 'Rain today: I’ve got my umbrella. Skip the suede, grab a jacket.');
  } else if (ctx.weatherMain === 'Snow') {
    lines.push(fr ? 'Il neige ! J’ai mis mon bonnet. Couches chaudes et bonnes semelles.' : 'Snow! Beanie on. Warm layers and good soles.');
  } else if (ctx.temp !== null && ctx.temp <= 8) {
    lines.push(fr ? `${ctx.temp}°, ça caille : bonnet et écharpe pour moi. Pense à une bonne couche.` : `${ctx.temp}°, it’s cold: beanie and scarf for me. Layer up.`);
  } else if (ctx.temp !== null && ctx.temp <= 13) {
    lines.push(fr ? `${ctx.temp}°, un peu frais : j’ai pris mon écharpe. Une veste légère ?` : `${ctx.temp}°, a bit chilly: scarf on. A light jacket?`);
  } else if (ctx.temp !== null && ctx.temp >= 22 && ctx.weatherMain === 'Clear') {
    lines.push(fr ? `${ctx.temp}° et grand soleil : lunettes de soleil de rigueur. Léger et respirant.` : `${ctx.temp}° and sunny: shades on. Keep it light.`);
  } else if (ctx.temp !== null && ctx.temp >= 25) {
    lines.push(fr ? `${ctx.temp}° dehors : léger et respirant aujourd’hui.` : `${ctx.temp}° out: keep it light today.`);
  } else if (ctx.temp !== null) {
    lines.push(fr ? `${ctx.temp}°, parfait pour une tenue mi-saison.` : `${ctx.temp}°, perfect for an in-between look.`);
  }

  // A forgotten piece deserves a comeback (only while the look is still open).
  if (ctx.forgotten && !ctx.lookValidated) {
    const { label, days } = ctx.forgotten;
    lines.push(
      days === null
        ? fr
          ? `« ${label} » n’a encore jamais quitté ton placard. C’est le jour ?`
          : `“${label}” has never left your closet. Today’s the day?`
        : fr
          ? `Ça fait ${days} jours que « ${label} » attend dans ton placard. Une sortie aujourd’hui ?`
          : `“${label}” has been waiting ${days} days in your closet. Take it out today?`
    );
  }

  // Today's look
  lines.push(
    ctx.lookValidated
      ? fr
        ? 'Ta tenue du jour est validée. Tu vas faire tourner des têtes.'
        : 'Today’s look is locked in. Heads will turn.'
      : fr
        ? 'On compose ta tenue ? Appuie sur « Faire ma tenue ».'
        : 'Shall we build your look? Tap “Style my outfit”.'
  );

  // Laundry nudges
  if (ctx.dirtyCount >= 5) {
    lines.push(fr ? `${ctx.dirtyCount} pièces au sale… une lessive s’impose.` : `${ctx.dirtyCount} pieces in the laundry… wash day?`);
  } else if (ctx.dirtyCount > 0) {
    lines.push(fr ? `${ctx.dirtyCount} pièce(s) t’attendent au linge sale.` : `${ctx.dirtyCount} piece(s) waiting in the laundry.`);
  }

  lines.push(...voice.idle[locale].sort(() => Math.random() - 0.5));
  return lines;
}

/** Short reactions for key moments. */
export function companionReaction(
  kind: CompanionKind,
  moment: 'thinking' | 'validated' | 'washed',
  locale: Locale
): string {
  const fr = locale === 'fr';
  const bank: Record<typeof moment, Lines> = {
    thinking: {
      fr: ['Laisse-moi réfléchir…', 'Je fouille ta garde-robe…', 'Hmm, je vois quelque chose…'],
      en: ['Let me think…', 'Digging through your wardrobe…', 'Hmm, I see something…'],
    },
    validated: {
      fr: ['Magnifique ! Bonne journée.', 'Validé. Tu es superbe.', 'Parfait, on y va !'],
      en: ['Gorgeous! Have a great day.', 'Locked in. You look great.', 'Perfect, let’s go!'],
    },
    washed: {
      fr: ['Tout propre, ça sent bon !', 'Lessive terminée. Mission accomplie.'],
      en: ['All clean, smells great!', 'Laundry done. Mission accomplished.'],
    },
  };
  const prefix = kind === 'dylan' ? (fr ? 'Ouaf ! ' : 'Woof! ') : kind === 'miso' ? (fr ? 'Miaou. ' : 'Meow. ') : fr ? 'Hop ! ' : 'Hop! ';
  return prefix + pick(bank[moment][fr ? 'fr' : 'en']);
}
