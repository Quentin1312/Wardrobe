import type { Locale } from '@/lib/i18n';
import type { CompanionKind } from './art';

export type { CompanionKind } from './art';
export { COMPANION_ART } from './art';

export const COMPANION_KINDS: CompanionKind[] = ['dylan', 'miso', 'rio'];

export const COMPANION_NAMES: Record<CompanionKind, string> = {
  dylan: 'Dylan',
  miso: 'Miso',
  rio: 'Rio',
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
  // A parrot: loves colour, repeats itself.
  rio: {
    hello: {
      fr: ['{hi} {name} ! {hi} ! {hi} !', 'Rio est là ! {hi} {name} !', 'Coucou {name} ! Coucou coucou !'],
      en: ['{hi} {name}! {hi}! {hi}!', 'Rio is here! {hi} {name}!', 'Hello {name}! Hello hello!'],
    },
    idle: {
      fr: [
        'Jolie tenue ! Jolie tenue !',
        'Rio adore les couleurs. Ose la couleur ! La couleur !',
        'Un rouge, un bleu, un jaune… comme mes plumes ! Comme mes plumes !',
      ],
      en: [
        'Nice outfit! Nice outfit!',
        'Rio loves colour. Dare the colour! The colour!',
        'Red, blue, yellow… like my feathers! Like my feathers!',
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
    lines.push(fr ? 'Il pleut aujourd’hui : évite le daim et prends une veste.' : 'Rain today: skip the suede, grab a jacket.');
  } else if (ctx.weatherMain === 'Snow') {
    lines.push(fr ? 'Il neige ! Couches chaudes et bonnes semelles.' : 'Snow! Warm layers and good soles.');
  } else if (ctx.temp !== null && ctx.temp <= 8) {
    lines.push(fr ? `${ctx.temp}°, ça caille. Pense à une bonne couche.` : `${ctx.temp}°, it’s cold. Layer up.`);
  } else if (ctx.temp !== null && ctx.temp >= 25) {
    lines.push(fr ? `${ctx.temp}° dehors : léger et respirant aujourd’hui.` : `${ctx.temp}° out: keep it light today.`);
  } else if (ctx.temp !== null) {
    lines.push(fr ? `${ctx.temp}°, parfait pour une tenue mi-saison.` : `${ctx.temp}°, perfect for an in-between look.`);
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
  const prefix = kind === 'dylan' ? (fr ? 'Ouaf ! ' : 'Woof! ') : kind === 'miso' ? (fr ? 'Miaou. ' : 'Meow. ') : 'Rrrio ! ';
  return prefix + pick(bank[moment][fr ? 'fr' : 'en']);
}
