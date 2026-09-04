/**
 * Journal des versions — ce qui est annoncé à l'utilisateur.
 *
 * Une entrée par version publiée, la plus récente en tête. C'est ce fichier,
 * et lui seul, qui déclenche la notification : tant qu'aucune version n'est
 * ajoutée ici, l'utilisateur ne voit rien. On n'y écrit donc que ce qui a
 * vraiment changé pour lui, jamais les travaux internes.
 */
export type GenreChangement = 'nouveau' | 'amelioration' | 'correction'

export interface Changement {
  genre: GenreChangement
  fr: string
  en: string
}

export interface Version {
  version: string
  /** Date de publication, au format ISO court. */
  date: string
  changements: Changement[]
}

export const JOURNAL: Version[] = [
  {
    version: '1.9.2',
    date: '2026-09-04',
    changements: [
      {
        genre: 'correction',
        fr: 'Dans la fiche complète, le champ Montant était écrasé par le sélecteur de devise, au point de ne plus laisser la place à un seul chiffre. Les largeurs demandées sont désormais respectées partout : montant, devise, sélecteurs de mois et d’année du tableau de bord.',
        en: 'In the full entry sheet, the Amount field was crushed by the currency selector, leaving no room for a single digit. Requested widths are now respected everywhere: amount, currency, and the overview’s month and year selectors.',
      },
    ],
  },
  {
    version: '1.9.1',
    date: '2026-09-04',
    changements: [
      {
        genre: 'correction',
        fr: 'Les cadres de saisie des cours partaient en escalier : leur largeur dépendait de la longueur du nom de la devise. Ils sont maintenant alignés.',
        en: 'The rate fields were staggered: their width depended on the length of the currency name. They are now aligned.',
      },
      {
        genre: 'amelioration',
        fr: 'La devise de votre budget est rappelée en tête de la liste des cours, sur fond doré. La première ligne de la liste est simplement la première des autres devises, jamais la vôtre.',
        en: 'Your budget currency is now shown at the top of the rates list, on a gold background. The first row of the list is just the first of the other currencies, never yours.',
      },
      {
        genre: 'nouveau',
        fr: 'Un convertisseur dans les paramètres : tapez un montant, choisissez deux devises, le résultat s’affiche à mesure que vous tapez.',
        en: 'A converter in settings: type an amount, pick two currencies, the result appears as you type.',
      },
    ],
  },
  {
    version: '1.9.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Un bouton « Mettre à jour les cours » va chercher les taux du jour en ligne, dans Paramètres → Cours des devises. Sans connexion, vos cours enregistrés restent en place et l’application vous le dit.',
        en: 'An “Update rates” button fetches today’s rates online, under Settings → Exchange rates. With no connection your saved rates stay put and the app tells you so.',
      },
      {
        genre: 'correction',
        fr: 'Le menu du bas ne flotte plus au-dessus du contenu et ne saute plus quand la barre du navigateur apparaît : le menu et l’en-tête sont fixes, seul le contenu défile.',
        en: 'The bottom menu no longer floats over the content or jumps when the browser bar appears: menu and header are fixed, only the content scrolls.',
      },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'La saisie rapide accepte enfin une autre devise : choisissez-la à côté du montant, la conversion s’affiche aussitôt. Elle est retenue pour les saisies suivantes.',
        en: 'Quick entry now accepts another currency: pick it next to the amount and the conversion appears at once. It is remembered for your next entries.',
      },
      {
        genre: 'nouveau',
        fr: 'Choisir son pays fixe la devise du budget — franc CFA en Côte d’Ivoire, cedi au Ghana, euro en France. Les 73 pays sont couverts, et la devise reste modifiable.',
        en: 'Choosing your country sets the budget currency — CFA franc in Côte d’Ivoire, cedi in Ghana, euro in France. All 73 countries are covered, and the currency stays editable.',
      },
      {
        genre: 'amelioration',
        fr: 'Trente devises africaines et internationales s’ajoutent à la liste. Leur cours est à renseigner : tant qu’il ne l’est pas, l’application le dit clairement au lieu de compter un pour un en silence.',
        en: 'Thirty more African and international currencies are available. Their rate is yours to enter: until it is, the app says so plainly instead of silently counting one for one.',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'correction',
        fr: 'Sur un nouveau téléphone, vos réglages ne revenaient pas : nom, devise, cours, catégories et dîme restaient aux valeurs d’usine, et les comptes apparaissaient en double. Tout est désormais restauré fidèlement.',
        en: 'On a new phone your settings did not come back: name, currency, rates, categories and tithe stayed at factory values, and accounts appeared twice. Everything is now restored faithfully.',
      },
    ],
  },
  {
    version: '1.6.1',
    date: '2026-09-04',
    changements: [
      {
        genre: 'correction',
        fr: 'Le cours des devises ne se laissait pas saisir : la virgule était effacée à l’instant où on la tapait, et « 655,957 » devenait 655957. Les décimales fonctionnent enfin, au point comme à la virgule — dans tous les champs de montant de l’application.',
        en: 'Exchange rates could not be typed: the decimal separator was erased the moment you typed it, turning “655.957” into 655957. Decimals now work, with a dot or a comma — in every amount field in the app.',
      },
      {
        genre: 'correction',
        fr: 'Les 24 devises sont désormais toutes modifiables ; seules 8 l’étaient, et la liste ignorait votre devise de base.',
        en: 'All 24 currencies can now be edited; only 8 could be, and the list ignored your base currency.',
      },
      {
        genre: 'amelioration',
        fr: 'Chaque cours est affiché dans votre devise de base : « 1 EUR = tant ». Changer de devise de base réexprime les taux sans jamais abîmer la table.',
        en: 'Each rate is shown in your base currency: “1 EUR = so much”. Changing your base currency re-expresses the rates without ever damaging the table.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Connexion « Continuer avec Google » : si vous avez une adresse Gmail, un seul geste suffit — plus de lien à attendre, à copier ni à coller.',
        en: '“Continue with Google” sign-in: if you have a Gmail address, one tap is enough — no more link to wait for, copy or paste.',
      },
    ],
  },
  {
    version: '1.5.1',
    date: '2026-09-04',
    changements: [
      {
        genre: 'correction',
        fr: 'Le lien de connexion collé depuis un email était refusé à tort : les messageries l’enveloppent dans une redirection et le coupent en plusieurs lignes. Il est désormais accepté sous toutes ses formes, y compris le code seul.',
        en: 'A sign-in link pasted from an email was wrongly rejected: mail apps wrap it in a redirect and break it across lines. It is now accepted in every shape, including the code on its own.',
      },
      {
        genre: 'amelioration',
        fr: 'Quand une connexion échoue, l’application dit enfin laquelle des causes s’applique : lien déjà utilisé, mauvaise adresse email, ou absence de réseau.',
        en: 'When sign-in fails, the app now says which cause applies: link already used, wrong email address, or no network.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Partagez l’application à vos proches : par WhatsApp, par n’importe quelle messagerie, ou en faisant scanner un code QR affiché à l’écran. Dans Plus → Partager Budget Smart.',
        en: 'Share the app with the people around you: on WhatsApp, through any messaging app, or by having them scan a QR code on your screen. Under More → Share Budget Smart.',
      },
      {
        genre: 'nouveau',
        fr: 'Le mode d’emploi se télécharge en PDF, à imprimer ou à envoyer à quelqu’un qui débute.',
        en: 'The user guide can be downloaded as a PDF, to print or to send to someone starting out.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Un mode d’emploi complet pour bien démarrer : à quoi sert chaque écran, comment choisir le bon type d’opération, et les questions que tout le monde se pose au début. Dans Plus → Mode d’emploi.',
        en: 'A complete user guide to get started: what each screen is for, how to pick the right entry type, and the questions everyone asks at the start. Under More → User guide.',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Cet écran : à chaque mise à jour, vous êtes prévenu et vous voyez exactement ce qui a changé.',
        en: 'This screen: on every update you are notified and see exactly what changed.',
      },
      {
        genre: 'correction',
        fr: 'La connexion par email fonctionne enfin depuis l’application installée sur l’écran d’accueil : copiez le lien reçu et collez-le dans l’application.',
        en: 'Email sign-in now works from the app installed on your home screen: copy the link you received and paste it into the app.',
      },
      {
        genre: 'correction',
        fr: 'Un envoi de SMS échoué n’empêche plus les tentatives suivantes.',
        en: 'A failed SMS no longer blocks every later attempt.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-09-04',
    changements: [
      {
        genre: 'nouveau',
        fr: 'L’application existe en français et en anglais. Le choix se fait dans Paramètres → Langue et s’applique partout, y compris aux rapports Excel et PDF.',
        en: 'The app is available in French and English. Choose in Settings → Language; it applies everywhere, Excel and PDF reports included.',
      },
      {
        genre: 'amelioration',
        fr: 'Les noms de pays, les noms de devises et le séparateur des milliers suivent la langue choisie.',
        en: 'Country names, currency names and the thousands separator follow the chosen language.',
      },
      {
        genre: 'amelioration',
        fr: 'Changer de langue ne touche pas aux catégories que vous avez renommées vous-même.',
        en: 'Switching language leaves the categories you renamed yourself untouched.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-03',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Compte en ligne facultatif : vos budgets vous suivent d’un téléphone à l’autre, même après une réinstallation.',
        en: 'Optional online account: your budgets follow you from one phone to another, even after a reinstall.',
      },
      {
        genre: 'nouveau',
        fr: 'Pays à choisir dans une liste, avec l’indicatif téléphonique rempli automatiquement.',
        en: 'Pick your country from a list, with the phone prefix filled in automatically.',
      },
      {
        genre: 'correction',
        fr: 'Les saisies faites avant la création du compte sont désormais envoyées dans la sauvegarde en ligne.',
        en: 'Entries made before the account was created are now sent to the online backup.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-01',
    changements: [
      {
        genre: 'nouveau',
        fr: 'Première version : budget général, mariage, immobilier et projets, dîme, offrandes et dons, prêts et emprunts, exports Excel et PDF.',
        en: 'First release: general budget, wedding, property and projects, tithe, offerings and donations, loans and borrowings, Excel and PDF exports.',
      },
    ],
  },
]
