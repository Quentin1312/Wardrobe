export type Locale = 'fr' | 'en';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
];

type Dict = Record<string, string>;

const en: Dict = {
  'brand.tagline': 'Your personal styling assistant.',

  'common.email': 'Email',
  'common.password': 'Password',
  'common.retry': 'Tap to retry',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.error': 'Error',

  'auth.signInTitle': 'Wardrobe',
  'auth.signIn': 'Sign in',
  'auth.noAccount': 'No account?',
  'auth.createOne': 'Create one',
  'auth.signUpTitle': 'Create account',
  'auth.signUpSubtitle': 'Start building your virtual wardrobe.',
  'auth.signUp': 'Sign up',
  'auth.haveAccount': 'Already have an account?',
  'auth.missingInfo': 'Missing info',
  'auth.enterCredentials': 'Enter your email and password.',
  'auth.signInFailed': 'Sign in failed',
  'auth.signUpFailed': 'Sign up failed',
  'auth.weakPassword': 'Weak password',
  'auth.weakPasswordMsg': 'Use at least 6 characters.',
  'auth.almostThere': 'Almost there',
  'auth.confirmEmailMsg':
    'Check your inbox to confirm your email, then sign in.',

  'onboarding.name': 'First name',
  'onboarding.namePlaceholder': 'Your name',
  'onboarding.photoTitle': 'Add a profile photo',
  'onboarding.photoSubtitle':
    'A clear portrait on a neutral background. We use it later to show you wearing outfits.',
  'onboarding.takePhoto': 'Take photo',
  'onboarding.choose': 'Choose',
  'onboarding.saveContinue': 'Save & continue',
  'onboarding.uploadFailed': 'Upload failed',
  'onboarding.uploadFailedMsg': 'Could not save your photo.',

  'tabs.today': 'Today',
  'tabs.outfit': 'Outfit',
  'tabs.wardrobe': 'Wardrobe',
  'tabs.profile': 'Profile',

  'outfitDay.title': 'Today’s fit',
  'outfitDay.subtitle': 'Build it, refine it, make it yours.',
  'outfitDay.studioLabel': 'LOOK BUILDER',
  'outfitDay.studioHint': 'Change each piece',
  'outfitDay.validate': 'Wear it',
  'outfitDay.skip': 'Shuffle',
  'outfitDay.validated': 'Outfit saved for today',
  'outfitDay.needMoreTitle': 'Not enough clothes',
  'outfitDay.needMoreBody': 'Add at least a top, a bottom and shoes to build outfits.',
  'outfitDay.none': 'None',
  'outfitDay.jacketOptional': 'Jacket (optional)',

  'tryon.cta': 'Try it on with AI',
  'tryon.title': 'See it on you',
  'tryon.pieces': '{count} compatible piece(s) will be applied.',
  'tryon.privacy': 'With your consent, your profile photo and selected clothes are securely sent to our AI try-on partner. The final image is copied to your private space.',
  'tryon.consent': 'I agree · Generate',
  'tryon.generating': 'Your fitting is being rendered…',
  'tryon.generatingHint': 'Usually 10 to 30 seconds. Keep this screen open.',
  'tryon.ready': 'Your AI fitting is ready',
  'tryon.needPhoto': 'Add a profile photo before using AI try-on.',
  'tryon.error': 'The AI fitting could not be generated.',

  'today.greetingMorning': 'Good morning',
  'today.greetingAfternoon': 'Good afternoon',
  'today.greetingEvening': 'Good evening',
  'today.outfits': "Today's outfits",
  'today.generate': 'Generate',
  'today.generating': 'Generating…',
  'today.weatherUnavailable': 'Weather unavailable',
  'today.noOutfitsTitle': 'No outfits yet',
  'today.noOutfitsBody':
    'Tap “Generate” for weather-appropriate outfits, or fill your wardrobe first.',
  'today.myWardrobe': 'My wardrobe',
  'today.tooFewTitle': 'Wardrobe too small',
  'today.tooFewBody': 'Add at least 2 items to generate outfits.',
  'today.lookEyebrow': "TODAY'S LOOK",
  'today.lookTitle': 'Build your outfit',
  'today.lookBody': 'Pick each piece and save the look you will wear today.',
  'today.lookCta': 'Open the fitting room',

  'wardrobe.rename': 'Rename',
  'wardrobe.favorite': 'Favourite',
  'wardrobe.unfavorite': 'Remove favourite',
  'wardrobe.favorites': 'Favourites',
  'wardrobe.namePlaceholder': 'e.g. Black denim jacket',
  'common.save': 'Save',

  'today.noOutfitTitle': 'No outfit found',
  'today.noOutfitBody': 'Could not build an outfit from your wardrobe. Add more variety and try again.',
  'today.feelsLike': 'Feels like',
  'today.min': 'Min',
  'today.max': 'Max',

  'wardrobe.title': 'Wardrobe',
  'wardrobe.subtitle': 'Your wardrobe',
  'wardrobe.count': '{count} item(s)',
  'wardrobe.emptyTitle': 'Wardrobe is empty',
  'wardrobe.emptyBody': 'Photograph your clothes to get started.',
  'wardrobe.all': 'All',
  'wardrobe.deleteTitle': 'Delete this item?',
  'wardrobe.deleteBody': 'This cannot be undone.',
  'wardrobe.removeBg': 'Remove background',
  'common.delete': 'Delete',

  'add.title': 'Add an item',
  'add.takePhoto': 'Take a photo',
  'add.photoHint': 'Flat, light background, good lighting',
  'add.chooseGallery': 'Choose from gallery',
  'add.category': 'Category',
  'add.save': 'Add to my wardrobe',
  'add.failed': 'Failed',
  'add.failedMsg': 'Could not add the item.',
  'add.processing': 'Removing background…',

  'outfit.skip': 'Skip',
  'outfit.like': 'Like',

  'profile.title': 'Profile',
  'profile.signOut': 'Sign out',
  'profile.noPhoto': 'No photo',
  'profile.language': 'Language',
  'profile.theme': 'Theme',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  'category.top': 'Top',
  'category.bottom': 'Bottom',
  'category.shoes': 'Shoes',
  'category.jacket': 'Jacket',
  'category.accessory': 'Accessory',
  'category.other': 'Other',
};

const fr: Dict = {
  'brand.tagline': 'Ton assistant style personnel.',

  'common.email': 'Email',
  'common.password': 'Mot de passe',
  'common.retry': 'Toucher pour réessayer',
  'common.cancel': 'Annuler',
  'common.close': 'Fermer',
  'common.error': 'Erreur',

  'auth.signInTitle': 'Wardrobe',
  'auth.signIn': 'Se connecter',
  'auth.noAccount': 'Pas de compte ?',
  'auth.createOne': 'Créer',
  'auth.signUpTitle': 'Créer un compte',
  'auth.signUpSubtitle': 'Commence à construire ta garde-robe virtuelle.',
  'auth.signUp': "S'inscrire",
  'auth.haveAccount': 'Déjà un compte ?',
  'auth.missingInfo': 'Champs manquants',
  'auth.enterCredentials': 'Saisis ton email et ton mot de passe.',
  'auth.signInFailed': 'Connexion échouée',
  'auth.signUpFailed': 'Inscription échouée',
  'auth.weakPassword': 'Mot de passe faible',
  'auth.weakPasswordMsg': 'Utilise au moins 6 caractères.',
  'auth.almostThere': 'Presque fini',
  'auth.confirmEmailMsg':
    'Vérifie ta boîte mail pour confirmer ton email, puis connecte-toi.',

  'onboarding.name': 'Prénom',
  'onboarding.namePlaceholder': 'Ton prénom',
  'onboarding.photoTitle': 'Ajoute une photo de profil',
  'onboarding.photoSubtitle':
    'Un portrait net sur fond neutre. On l’utilise ensuite pour te montrer portant les tenues.',
  'onboarding.takePhoto': 'Prendre une photo',
  'onboarding.choose': 'Choisir',
  'onboarding.saveContinue': 'Enregistrer & continuer',
  'onboarding.uploadFailed': 'Échec de l’envoi',
  'onboarding.uploadFailedMsg': 'Impossible d’enregistrer ta photo.',

  'tabs.today': 'Aujourd’hui',
  'tabs.outfit': 'Tenue',
  'tabs.wardrobe': 'Garde-robe',
  'tabs.profile': 'Profil',

  'outfitDay.title': 'Le fit du jour',
  'outfitDay.subtitle': 'Compose-le, ajuste-le, fais-en le tien.',
  'outfitDay.studioLabel': 'COMPOSEUR',
  'outfitDay.studioHint': 'Change chaque pièce',
  'outfitDay.validate': 'Je la porte',
  'outfitDay.skip': 'Mélanger',
  'outfitDay.validated': 'Tenue enregistrée pour aujourd’hui',
  'outfitDay.needMoreTitle': 'Pas assez de vêtements',
  'outfitDay.needMoreBody': 'Ajoute au moins un haut, un bas et des chaussures pour composer des tenues.',
  'outfitDay.none': 'Aucune',
  'outfitDay.jacketOptional': 'Veste (optionnel)',

  'tryon.cta': 'Essayer sur moi avec l’IA',
  'tryon.title': 'Vois la tenue sur toi',
  'tryon.pieces': '{count} pièce(s) compatible(s) seront appliquées.',
  'tryon.privacy': 'Avec ton accord, ta photo de profil et les vêtements choisis sont envoyés de façon sécurisée à notre partenaire d’essayage IA. Le résultat est ensuite copié dans ton espace privé.',
  'tryon.consent': 'J’accepte · Générer',
  'tryon.generating': 'Ton essayage est en cours…',
  'tryon.generatingHint': 'Environ 10 à 30 secondes. Garde cet écran ouvert.',
  'tryon.ready': 'Ton essayage IA est prêt',
  'tryon.needPhoto': 'Ajoute une photo de profil avant de lancer l’essayage IA.',
  'tryon.error': 'Impossible de générer l’essayage IA.',

  'today.greetingMorning': 'Bonjour',
  'today.greetingAfternoon': 'Bon après-midi',
  'today.greetingEvening': 'Bonsoir',
  'today.outfits': 'Tenues du jour',
  'today.generate': 'Générer',
  'today.generating': 'Génération…',
  'today.weatherUnavailable': 'Météo indisponible',
  'today.noOutfitsTitle': 'Aucune tenue pour l’instant',
  'today.noOutfitsBody':
    'Touche « Générer » pour des tenues adaptées à la météo, ou remplis d’abord ta garde-robe.',
  'today.myWardrobe': 'Ma garde-robe',
  'today.tooFewTitle': 'Garde-robe trop petite',
  'today.tooFewBody': 'Ajoute au moins 2 vêtements pour générer des tenues.',
  'today.lookEyebrow': 'TA TENUE DU JOUR',
  'today.lookTitle': 'Compose ta tenue',
  'today.lookBody': 'Choisis chaque pièce et enregistre la tenue que tu portes aujourd’hui.',
  'today.lookCta': 'Ouvrir le dressing',

  'wardrobe.rename': 'Renommer',
  'wardrobe.favorite': 'Favori',
  'wardrobe.unfavorite': 'Retirer des favoris',
  'wardrobe.favorites': 'Favoris',
  'wardrobe.namePlaceholder': 'ex. Veste en jean noire',
  'common.save': 'Enregistrer',

  'today.noOutfitTitle': 'Aucune tenue trouvée',
  'today.noOutfitBody': 'Impossible de composer une tenue avec ta garde-robe. Ajoute plus de variété et réessaie.',
  'today.feelsLike': 'Ressenti',
  'today.min': 'Min',
  'today.max': 'Max',

  'wardrobe.title': 'Garde-robe',
  'wardrobe.subtitle': 'Ta garde-robe',
  'wardrobe.count': '{count} pièce(s)',
  'wardrobe.emptyTitle': 'Garde-robe vide',
  'wardrobe.emptyBody': 'Photographie tes vêtements pour commencer.',
  'wardrobe.all': 'Tout',
  'wardrobe.deleteTitle': 'Supprimer cette pièce ?',
  'wardrobe.deleteBody': 'Action irréversible.',
  'wardrobe.removeBg': 'Détourer',
  'common.delete': 'Supprimer',

  'add.title': 'Ajouter une pièce',
  'add.takePhoto': 'Prendre une photo',
  'add.photoHint': 'À plat, fond clair, bonne lumière',
  'add.chooseGallery': 'Choisir depuis la galerie',
  'add.category': 'Catégorie',
  'add.save': 'Ajouter à ma garde-robe',
  'add.failed': 'Échec',
  'add.failedMsg': 'Impossible d’ajouter la pièce.',
  'add.processing': 'Détourage en cours…',

  'outfit.skip': 'Passer',
  'outfit.like': "J'aime",

  'profile.title': 'Profil',
  'profile.signOut': 'Se déconnecter',
  'profile.noPhoto': 'Pas de photo',
  'profile.language': 'Langue',
  'profile.theme': 'Thème',
  'theme.system': 'Système',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',

  'category.top': 'Haut',
  'category.bottom': 'Bas',
  'category.shoes': 'Chaussures',
  'category.jacket': 'Veste',
  'category.accessory': 'Accessoire',
  'category.other': 'Autre',
};

const dictionaries: Record<Locale, Dict> = { en, fr };

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  let str = dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
