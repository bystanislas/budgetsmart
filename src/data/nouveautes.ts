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
