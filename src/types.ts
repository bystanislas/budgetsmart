/** Modèle de données de Budget Smart. Tout vit dans IndexedDB, hors ligne d'abord. */

export type ModuleId = 'general' | 'mariage' | 'immobilier' | 'business'
export type TypeOp =
  | 'revenu' | 'depense' | 'epargne' | 'investissement' | 'remboursement' | 'transfert'
  | 'pret' | 'emprunt' | 'remboursement_recu'
export type Nature = 'fixe' | 'variable' | 'exceptionnelle'
export type Statut = 'paye' | 'prevu' | 'attente' | 'annule'

export interface Base {
  id: string
  createdAt: string
  updatedAt: string
}

/** Une écriture du journal. Le montant est toujours POSITIF ; le sens vient du type. */
export interface Ecriture extends Base {
  date: string                // ISO court : 2026-01-05
  type: TypeOp
  module: ModuleId
  categorie: string
  sousCategorie?: string      // « Yango », « Gbaka », « Riz & condiments »…
  libelle: string
  /** À quoi cette opération a servi : la ligne doit être vérifiable des mois plus tard. */
  descriptif?: string
  /** Prêts et emprunts : à qui, ou de qui. */
  tiers?: string
  montant: number             // dans la devise saisie
  devise: string              // code ISO ; vide = devise de base
  montantBase: number         // converti dans la devise de base, figé à la saisie
  compteId?: string
  /** Épargne et transferts : le compte qui reçoit l'argent. */
  compteCibleId?: string
  moyen?: string
  rattachement?: string       // id d'un bien, projet, objectif ou crédit
  nature?: Nature
  statut: Statut
  note?: string
}

export interface Compte extends Base {
  nom: string
  nature: 'courant' | 'epargne' | 'bloque' | 'mobile' | 'especes' | 'business' | 'autre'
  soldeOuverture: number
  /** Où l'argent dort vraiment : banque, opérateur mobile, coffre… */
  etablissement?: string
  /** Référence partielle du compte ou du numéro — jamais le numéro complet. */
  reference?: string
  /** Épargne bloquée : date de déblocage prévue. */
  blocageJusqu?: string
  titulaire?: string
}

/** Une ligne d'estimation annuelle : une catégorie, douze mois. */
export interface LignePlan extends Base {
  annee: number
  module: ModuleId
  type: TypeOp
  categorie: string
  mois: number[]              // 12 valeurs
  commentaire?: string
}

export interface Poste extends Base {
  module: Exclude<ModuleId, 'general'>
  nom: string
  categorie?: string
  estimation: number
  devis: number[]             // jusqu'à 3 devis
  devisRetenu: number         // -1 = estimation, 0..2 = index du devis
  prestataire?: string
  echeance?: string
  /** Champs libres selon le module (surface, prix au m², CA prévu…). */
  extra?: Record<string, string | number>
}

export interface Objectif extends Base {
  nom: string
  module: ModuleId
  cible: number
  echeance?: string
  compteId?: string
}

export interface Dette extends Base {
  nom: string
  organisme?: string
  capital: number
  tauxAnnuel: number
  dureeMois: number
  premiereEcheance?: string
}

export interface Recurrent extends Base {
  libelle: string
  module: ModuleId
  categorie: string
  montant: number
  devise: string
  frequence: 'hebdo' | 'mensuel' | 'bimestriel' | 'trimestriel' | 'semestriel' | 'annuel'
  prochaineEcheance?: string
  compteId?: string
  actif: boolean
}

export interface Parametres {
  id: 'app'
  raisonSociale: string
  responsable: string
  activite: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email: string
  siteWeb: string
  identifiant: string
  deviseBase: string
  /** Cours de chaque devise, exprimé en unités de la devise de référence interne (XOF). */
  cours: Record<string, number>
  /** Date publiée par la source lors de la dernière mise à jour en ligne. */
  coursMaj?: string
  anneeTravail: number
  moisSuivi: number           // 1..12
  tresorerieInitiale: number
  tauxEpargneCible: number    // 0..1
  seuilAlerte: number         // 0..1
  dimeActive: boolean
  dimeTaux: number            // 0..1
  dimeAssiette: 'salaire' | 'salaire_primes' | 'tous'
  perimetre: 'general' | 'tout' | ModuleId
  /** Langue de l'interface, des listes et des rapports. */
  langue: string
  /** Église ou organisation bénéficiaire, reprise dans le descriptif des dons. */
  dimeEglise: string
  /**
   * Référentiel de l'utilisateur. Amorcé avec les listes livrées, puis
   * entièrement modifiable depuis les paramètres : chacun adapte l'application
   * à son pays, sa langue et sa façon de compter.
   */
  categories: Record<ModuleId, string[]>
  sousCategories: Record<string, string[]>
  moyens: string[]
  updatedAt: string
}
