/**
 * Mode d'emploi — le contenu, séparé de sa mise en page.
 *
 * Écrit pour quelqu'un qui ouvre Budget Smart pour la première fois et qui
 * n'a jamais tenu de budget : des phrases courtes, des exemples concrets,
 * aucun vocabulaire de comptable. Chaque texte existe dans les deux langues
 * de l'application.
 */
export interface Bilingue { fr: string; en: string }

export type IconeGuide =
  | 'depart' | 'identite' | 'estimation' | 'saisie' | 'types'
  | 'suivi' | 'dime' | 'modules' | 'rapports' | 'donnees' | 'langue' | 'questions'

export interface SectionGuide {
  id: string
  icone: IconeGuide
  titre: Bilingue
  intro: Bilingue
  points: Bilingue[]
}

export const GUIDE: SectionGuide[] = [
  {
    id: 'depart',
    icone: 'depart',
    titre: { fr: 'À quoi sert Budget Smart', en: 'What Budget Smart is for' },
    intro: {
      fr: 'Savoir où passe votre argent, sans y passer vos soirées. Vous notez chaque dépense en quelques secondes ; l’application fait les calculs à votre place.',
      en: 'Know where your money goes, without spending your evenings on it. You jot down each expense in seconds; the app does the maths for you.',
    },
    points: [
      {
        fr: 'Tout fonctionne sans connexion internet. Vous pouvez saisir une dépense au marché, dans un Gbaka, partout.',
        en: 'Everything works without an internet connection. You can record an expense at the market, on a bus, anywhere.',
      },
      {
        fr: 'Vos données restent sur votre téléphone. Rien n’est envoyé nulle part tant que vous ne créez pas un compte.',
        en: 'Your data stays on your phone. Nothing is sent anywhere unless you create an account.',
      },
      {
        fr: 'Comptez trois minutes pour la configuration, puis dix secondes par dépense.',
        en: 'Allow three minutes to set up, then ten seconds per expense.',
      },
    ],
  },
  {
    id: 'identite',
    icone: 'identite',
    titre: { fr: '① Renseignez vos informations', en: '① Fill in your details' },
    intro: {
      fr: 'Première étape, dans Paramètres. C’est le seul endroit où l’on modifie quelque chose : vous ne pouvez pas vous perdre.',
      en: 'First step, in Settings. It is the only place where anything is edited, so you cannot get lost.',
    },
    points: [
      {
        fr: 'Votre nom ou celui de votre famille, votre ville et votre pays. L’indicatif téléphonique se remplit tout seul.',
        en: 'Your name or your family’s, your city and your country. The phone prefix fills in by itself.',
      },
      {
        fr: 'Votre devise : le franc CFA par défaut, mais l’euro, le dollar et une vingtaine d’autres sont disponibles.',
        en: 'Your currency: CFA franc by default, but euro, dollar and about twenty others are available.',
      },
      {
        fr: 'Vos comptes : compte courant, Mobile Money, espèces, épargne. Indiquez le solde de départ de chacun.',
        en: 'Your accounts: current account, Mobile Money, cash, savings. Enter the starting balance of each.',
      },
      {
        fr: 'Vos catégories sont déjà prêtes. Vous pouvez les renommer, en ajouter ou en supprimer — l’application respectera toujours vos choix.',
        en: 'Your categories are already set up. Rename, add or delete them — the app will always respect your choices.',
      },
    ],
  },
  {
    id: 'estimation',
    icone: 'estimation',
    titre: { fr: '② Estimez votre année', en: '② Plan your year' },
    intro: {
      fr: 'Posez ce que vous prévoyez de dépenser, mois par mois. C’est ce qui permettra plus tard de comparer le prévu et le réel.',
      en: 'Set out what you expect to spend, month by month. This is what later lets you compare planned against actual.',
    },
    points: [
      {
        fr: 'Commencez par vos charges fixes : loyer, électricité, école, transport, abonnements.',
        en: 'Start with your fixed costs: rent, electricity, school fees, transport, subscriptions.',
      },
      {
        fr: 'Le bouton « Répartir sur l’année » recopie un montant sur les douze mois d’un seul geste.',
        en: 'The “Spread over the year” button copies one amount across all twelve months in a single tap.',
      },
      {
        fr: 'Cette étape est facultative. Sans estimation, l’application fonctionne ; vous perdez seulement la comparaison prévu / réel.',
        en: 'This step is optional. The app works without a plan; you only lose the planned-versus-actual comparison.',
      },
    ],
  },
  {
    id: 'saisie',
    icone: 'saisie',
    titre: { fr: '③ Saisissez au quotidien', en: '③ Record your day-to-day' },
    intro: {
      fr: 'C’est le cœur de l’application, dans l’onglet Journal. La saisie rapide tient en un écran : montant, catégorie, descriptif, c’est enregistré.',
      en: 'This is the heart of the app, in the Entries tab. Quick entry fits on one screen: amount, category, description — saved.',
    },
    points: [
      {
        fr: 'Le descriptif est ce qui rend votre budget vérifiable des mois plus tard. Écrivez « maison → académie » plutôt que « transport ».',
        en: 'The description is what makes your budget verifiable months later. Write “home → academy” rather than “transport”.',
      },
      {
        fr: 'La sous-catégorie précise le détail : Yango, Gbaka, woro-woro, taxi, location.',
        en: 'The sub-category adds the detail: Yango, minibus, shared taxi, taxi, car hire.',
      },
      {
        fr: 'Pour la nourriture, dites ce que vous avez acheté. Pour un achat, dites quoi. C’est ce qui distingue un budget utile d’une liste de chiffres.',
        en: 'For food, say what you bought. For a purchase, say what it was. That is what separates a useful budget from a list of numbers.',
      },
      {
        fr: 'Tout le reste — tableau de bord, récapitulatifs, dîme — se recalcule tout seul. Vous n’avez jamais à additionner quoi que ce soit.',
        en: 'Everything else — overview, summaries, tithe — recalculates on its own. You never have to add anything up.',
      },
    ],
  },
  {
    id: 'types',
    icone: 'types',
    titre: { fr: 'Choisir le bon type d’opération', en: 'Choosing the right entry type' },
    intro: {
      fr: 'C’est le seul point qui demande un peu d’attention. Le type décide si l’argent entre, sort, ou change simplement de place.',
      en: 'This is the one point that needs a little care. The type decides whether money comes in, goes out, or merely moves.',
    },
    points: [
      {
        fr: 'Revenu : de l’argent qui entre — salaire, prime, vente, aide familiale.',
        en: 'Income: money coming in — salary, bonus, a sale, family support.',
      },
      {
        fr: 'Dépense : de l’argent qui sort et ne revient pas — nourriture, transport, loyer.',
        en: 'Expense: money going out that does not come back — food, transport, rent.',
      },
      {
        fr: 'Épargne : l’argent sort de votre poche mais reste à vous. Précisez sur quel compte il part, et si ce compte est ouvert ou bloqué.',
        en: 'Savings: the money leaves your pocket but stays yours. Say which account it goes to, and whether that account is open or locked.',
      },
      {
        fr: 'Prêt accordé : vous avez prêté à quelqu’un. Emprunt reçu : quelqu’un vous a prêté. Indiquez toujours le nom de la personne.',
        en: 'Loan given: you lent to someone. Loan received: someone lent to you. Always name the person.',
      },
      {
        fr: 'Transfert : vous déplacez de l’argent entre vos propres comptes. Ce n’est ni une dépense ni un revenu, et ça ne change pas votre solde.',
        en: 'Transfer: you move money between your own accounts. It is neither an expense nor income, and it does not change your balance.',
      },
    ],
  },
  {
    id: 'suivi',
    icone: 'suivi',
    titre: { fr: 'Voir où vous en êtes', en: 'See where you stand' },
    intro: {
      fr: 'L’onglet Tableau répond en un coup d’œil : ai-je dépensé plus que je n’ai gagné ce mois-ci ?',
      en: 'The Overview tab answers at a glance: did I spend more than I earned this month?',
    },
    points: [
      {
        fr: 'Le solde du mois en vert, c’est bon. En rouge, vous avez dépensé plus que vous n’avez reçu.',
        en: 'A green monthly balance is good. Red means you spent more than you took in.',
      },
      {
        fr: 'Le graphique « Où part l’argent » montre vos plus gros postes. C’est souvent une surprise le premier mois.',
        en: 'The “Where the money goes” chart shows your biggest items. It is often a surprise in the first month.',
      },
      {
        fr: 'Les alertes vous préviennent quand une catégorie dépasse ce que vous aviez prévu.',
        en: 'Alerts warn you when a category goes beyond what you had planned.',
      },
    ],
  },
  {
    id: 'dime',
    icone: 'dime',
    titre: { fr: 'Dîme, offrandes et dons', en: 'Tithe, offerings and donations' },
    intro: {
      fr: 'Si vous activez la dîme dans les Paramètres, elle est calculée automatiquement sur vos revenus, au taux que vous choisissez.',
      en: 'If you switch on the tithe in Settings, it is worked out automatically from your income, at the rate you choose.',
    },
    points: [
      {
        fr: 'Vous décidez de l’assiette : tous les revenus, le salaire seul, ou le salaire et les primes.',
        en: 'You decide the base: all income, salary only, or salary and bonuses.',
      },
      {
        fr: 'L’application vous montre la dîme due, ce que vous avez déjà versé, et ce qu’il reste.',
        en: 'The app shows the tithe owed, what you have already given, and what remains.',
      },
      {
        fr: 'Pour la dîme et l’offrande, indiquez la date et l’église dans le descriptif. Une église est proposée par défaut ; elle reste modifiable.',
        en: 'For tithe and offerings, put the date and the church in the description. A default church is suggested and stays editable.',
      },
      {
        fr: 'Les dons suivent la même logique : notez à qui, pour quoi. Rien n’est jamais imposé.',
        en: 'Donations follow the same logic: note to whom and what for. Nothing is ever forced on you.',
      },
    ],
  },
  {
    id: 'modules',
    icone: 'modules',
    titre: { fr: 'Mariage, immobilier, projets', en: 'Wedding, property, projects' },
    intro: {
      fr: 'Un budget exceptionnel ne doit pas polluer votre budget de tous les jours. Chacun a donc sa page, entièrement séparée.',
      en: 'A one-off budget should not pollute your everyday one. Each therefore gets its own page, fully separate.',
    },
    points: [
      {
        fr: 'Mariage : vos postes, plusieurs devis par poste, celui que vous retenez, ce qui est déjà payé.',
        en: 'Wedding: your items, several quotes per item, the one you pick, what is already paid.',
      },
      {
        fr: 'Immobilier & terrain : terrain, travaux, frais annexes, loyers perçus.',
        en: 'Property & land: land, works, extra costs, rent received.',
      },
      {
        fr: 'Business & projets : chiffre d’affaires prévu, dépenses, marge réalisée.',
        en: 'Business & projects: expected revenue, costs, actual margin.',
      },
    ],
  },
  {
    id: 'rapports',
    icone: 'rapports',
    titre: { fr: 'Vos rapports Excel et PDF', en: 'Your Excel and PDF reports' },
    intro: {
      fr: 'Depuis l’onglet Plus, vous sortez un rapport complet pour la période de votre choix : un jour, un mois, un trimestre ou l’année.',
      en: 'From the More tab you can produce a full report for any period: a day, a month, a quarter or the year.',
    },
    points: [
      {
        fr: 'Le fichier Excel contient une feuille par sujet : synthèse, journal, catégories, épargne, prêts, dîme, paramètres.',
        en: 'The Excel file holds one sheet per topic: summary, entries, categories, savings, loans, tithe, settings.',
      },
      {
        fr: 'Le PDF est fait pour être imprimé ou envoyé tel quel — à un conjoint, un associé, une banque.',
        en: 'The PDF is made to be printed or sent as is — to a spouse, a partner, a bank.',
      },
      {
        fr: 'Les deux sortent dans la langue de l’application.',
        en: 'Both come out in the app’s language.',
      },
    ],
  },
  {
    id: 'donnees',
    icone: 'donnees',
    titre: { fr: 'Ne jamais perdre vos données', en: 'Never lose your data' },
    intro: {
      fr: 'Vos saisies vivent sur votre téléphone. Cela les rend rapides et privées, mais aussi liées à cet appareil.',
      en: 'Your entries live on your phone. That makes them fast and private, but also tied to that device.',
    },
    points: [
      {
        fr: 'Créez un compte avec votre email : vos budgets vous suivront sur un nouveau téléphone, après une réinstallation ou un effacement.',
        en: 'Create an account with your email: your budgets will follow you to a new phone, after a reinstall or a wipe.',
      },
      {
        fr: 'Sans compte, faites de temps en temps une sauvegarde en fichier depuis l’onglet Plus, et gardez-la ailleurs.',
        en: 'Without an account, export a backup file from the More tab now and then, and keep it somewhere else.',
      },
      {
        fr: 'Le compte est facultatif : l’application fonctionne exactement pareil sans lui.',
        en: 'The account is optional: the app works exactly the same without it.',
      },
    ],
  },
  {
    id: 'langue',
    icone: 'langue',
    titre: { fr: 'Changer de langue', en: 'Change the language' },
    intro: {
      fr: 'Paramètres → Langue. Le changement s’applique immédiatement partout, y compris aux rapports Excel et PDF.',
      en: 'Settings → Language. The change applies immediately everywhere, Excel and PDF reports included.',
    },
    points: [
      {
        fr: 'Les catégories que vous avez renommées vous-même ne sont jamais retraduites : vos mots restent vos mots.',
        en: 'Categories you renamed yourself are never re-translated: your words stay your words.',
      },
      {
        fr: 'Vos anciennes saisies restent correctement calculées après un changement de langue.',
        en: 'Your past entries keep being calculated correctly after a language change.',
      },
    ],
  },
  {
    id: 'questions',
    icone: 'questions',
    titre: { fr: 'Questions fréquentes', en: 'Common questions' },
    intro: {
      fr: 'Les trois questions que tout le monde se pose au début.',
      en: 'The three questions everyone asks at the start.',
    },
    points: [
      {
        fr: 'J’ai oublié de noter une dépense d’hier — saisissez-la normalement et changez simplement la date.',
        en: 'I forgot to record yesterday’s expense — enter it as usual and just change the date.',
      },
      {
        fr: 'Je me suis trompé — ouvrez la ligne dans le Journal, corrigez ou supprimez. Tout se recalcule.',
        en: 'I made a mistake — open the line in Entries, correct or delete it. Everything recalculates.',
      },
      {
        fr: 'Dois-je tout noter ? Oui, surtout les petites dépenses : ce sont elles qui expliquent l’argent qui disparaît.',
        en: 'Must I record everything? Yes, small expenses above all: they are what explains money that vanishes.',
      },
    ],
  },
]
