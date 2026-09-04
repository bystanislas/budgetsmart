/** Référentiels partagés avec le classeur Excel : mêmes libellés, mêmes catégories. */
import type { ModuleId, TypeOp } from '../types'

export const APP_NAME = 'Budget Smart'
export const APP_BRAND = 'by APEX AFRICA'
export const APP_SIGNATURE = 'APEX AFRICA — African Premium Experience · Abidjan, Côte d’Ivoire'
export const APP_CONTACT = 'contact@apxafrica.com · www.apxafrica.com'

/** Adresse publique de l'application — celle que l'on partage. */
export const APP_URL = 'https://budgetsmart.apxafrica.com'

export const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
export const MOIS_COURT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export const MODULES: { id: ModuleId; label: string; court: string; couleur: string }[] = [
  { id: 'general', label: 'Général', court: 'Général', couleur: '#2E5480' },
  { id: 'mariage', label: 'Mariage', court: 'Mariage', couleur: '#9C3A5F' },
  { id: 'immobilier', label: 'Immobilier & terrain', court: 'Immo', couleur: '#1E6B3C' },
  { id: 'business', label: 'Business & projets', court: 'Projet', couleur: '#E07B22' },
]

export const TYPES: { id: TypeOp; label: string; sens: 'entree' | 'sortie' | 'neutre' }[] = [
  { id: 'revenu', label: 'Revenu', sens: 'entree' },
  { id: 'depense', label: 'Dépense', sens: 'sortie' },
  { id: 'epargne', label: 'Épargne', sens: 'sortie' },
  { id: 'investissement', label: 'Investissement', sens: 'sortie' },
  { id: 'remboursement', label: 'Remboursement crédit', sens: 'sortie' },
  { id: 'pret', label: 'Prêt accordé (argent prêté)', sens: 'sortie' },
  { id: 'emprunt', label: 'Emprunt reçu (argent emprunté)', sens: 'entree' },
  { id: 'remboursement_recu', label: 'Remboursement reçu', sens: 'entree' },
  { id: 'transfert', label: 'Transfert entre mes comptes', sens: 'neutre' },
]

/** Les trois types qui engagent un tiers : on note toujours à qui, ou de qui. */
export const TYPES_TIERS: TypeOp[] = ['pret', 'emprunt', 'remboursement_recu']

export const sensDe = (t: TypeOp) => TYPES.find((x) => x.id === t)?.sens ?? 'sortie'
export const labelType = (t: TypeOp) => TYPES.find((x) => x.id === t)?.label ?? t
export const labelModule = (m: ModuleId) => MODULES.find((x) => x.id === m)?.label ?? m
export const couleurModule = (m: ModuleId) => MODULES.find((x) => x.id === m)?.couleur ?? '#2E5480'

export const NATURES = [
  { id: 'fixe', label: 'Fixe' },
  { id: 'variable', label: 'Variable' },
  { id: 'exceptionnelle', label: 'Exceptionnelle' },
] as const

export const STATUTS = [
  { id: 'paye', label: 'Payé' },
  { id: 'prevu', label: 'Prévu' },
  { id: 'attente', label: 'En attente' },
  { id: 'annule', label: 'Annulé' },
] as const

export const MOYENS = ['Espèces', 'Mobile Money', 'Wave', 'Orange Money', 'MTN MoMo',
  'Moov Money', 'Virement bancaire', 'Carte bancaire', 'Chèque', 'Prélèvement',
  'PayPal', 'Autre']

export const FREQUENCES = [
  { id: 'hebdo', label: 'Hebdomadaire', parMois: 52 / 12 },
  { id: 'mensuel', label: 'Mensuelle', parMois: 1 },
  { id: 'bimestriel', label: 'Bimestrielle', parMois: 1 / 2 },
  { id: 'trimestriel', label: 'Trimestrielle', parMois: 1 / 3 },
  { id: 'semestriel', label: 'Semestrielle', parMois: 1 / 6 },
  { id: 'annuel', label: 'Annuelle', parMois: 1 / 12 },
] as const

/** La dîme est comptée à part : c'est elle, et elle seule, que le calcul suit. */
export const CAT_DIME = 'Dîme'
/** Ancien libellé, conservé pour que les saisies déjà faites restent comptées. */
export const CAT_DIME_LEGACY = 'Dîme / Offrandes'
export const CAT_OFFRANDE = 'Offrande'
export const CAT_DON = 'Don / Donation'
/** Catégories qui appellent le nom de l'église ou du bénéficiaire. */
export const CAT_SPIRITUEL = [CAT_DIME, CAT_DIME_LEGACY, CAT_OFFRANDE, CAT_DON,
  'Dons & solidarité']
export const EGLISE_DEFAUT = 'Église Impact Centre Chrétien (ICC) — Riviera 2'
export const CAT_PRET = 'Prêt accordé à un tiers'
export const CAT_EMPRUNT = 'Emprunt reçu d’un tiers'
export const CAT_REMB_RECU = 'Remboursement reçu d’un tiers'
export const CAT_EPARGNE = 'Épargne (versement)'

/** Devises : code, nom, symbole, cours indicatif (1 unité = X XOF), décimales. */
export const DEVISES: [string, string, string, number, number][] = [
  ['XOF', 'Franc CFA — UEMOA', 'FCFA', 1, 0],
  ['XAF', 'Franc CFA — CEMAC', 'FCFA', 1, 0],
  ['EUR', 'Euro', '€', 655.957, 2],
  ['USD', 'Dollar américain', '$', 600, 2],
  ['GBP', 'Livre sterling', '£', 765, 2],
  ['CAD', 'Dollar canadien', 'C$', 440, 2],
  ['CHF', 'Franc suisse', 'CHF', 685, 2],
  ['MAD', 'Dirham marocain', 'DH', 60, 2],
  ['TND', 'Dinar tunisien', 'DT', 192, 3],
  ['DZD', 'Dinar algérien', 'DA', 4.45, 2],
  ['EGP', 'Livre égyptienne', 'E£', 12.5, 2],
  ['NGN', 'Naira nigérian', '₦', 0.4, 2],
  ['GHS', 'Cedi ghanéen', '₵', 50, 2],
  ['GNF', 'Franc guinéen', 'FG', 0.07, 0],
  ['CDF', 'Franc congolais', 'FC', 0.21, 0],
  ['MRU', 'Ouguiya mauritanien', 'UM', 15, 2],
  ['RWF', 'Franc rwandais', 'FRw', 0.46, 0],
  ['KES', 'Shilling kényan', 'KSh', 4.6, 2],
  ['UGX', 'Shilling ougandais', 'USh', 0.16, 0],
  ['TZS', 'Shilling tanzanien', 'TSh', 0.23, 0],
  ['ZAR', 'Rand sud-africain', 'R', 33, 2],
  ['AED', 'Dirham des Émirats', 'AED', 163, 2],
  ['SAR', 'Riyal saoudien', 'SR', 160, 2],
  ['CNY', 'Yuan chinois', '¥', 83, 2],
  ['TRY', 'Livre turque', '₺', 17, 2],
]

const REVENUS_GENERAL = ['Salaire', 'Prime / 13e mois', 'Freelance / Consulting',
  'Commerce / Ventes', 'Loyers perçus', 'Dividendes', 'Intérêts perçus',
  'Aide familiale', 'Remboursement reçu', 'Vente d’actifs', 'Autre revenu']

const DEPENSES_GENERAL = ['Loyer', 'Électricité', 'Eau', 'Gaz / Bouteille',
  'Internet / Box', 'Téléphone', 'Charges de copropriété', 'Entretien & réparations',
  'Alimentation / Courses', 'Restaurants / Déjeuners', 'Transport en commun',
  'Carburant', 'Taxi / VTC', 'Entretien véhicule', 'Assurance véhicule',
  'Santé / Pharmacie', 'Assurance santé / Mutuelle', 'Habillement', 'Coiffure & soins',
  'Scolarité / Éducation', 'Garde d’enfants', 'Sport / Fitness', 'Loisirs & sorties',
  'Abonnements (streaming, apps)', CAT_DIME, CAT_OFFRANDE, CAT_DON,
  'Dons & solidarité', 'Cadeaux',
  'Voyages / Vacances', 'Impôts & taxes', 'Frais bancaires', 'Assurance habitation',
  'Aide à la famille élargie', 'Frais administratifs', 'Imprévus / Divers']

export const CAT_MARIAGE = ['Dot & coutume', 'Mairie / État civil', 'Cérémonie religieuse',
  'Tenue de la mariée', 'Tenue du marié', 'Tenues des cortèges',
  'Beauté, coiffure & maquillage', 'Alliances & bijoux', 'Salle & mobilier',
  'Décoration', 'Traiteur & repas', 'Boissons', 'Gâteau / pièce montée',
  'Photographe', 'Vidéaste / Drone', 'DJ & animation', 'Orchestre / Chorale',
  'Transport & location de voitures', 'Faire-parts & papeterie', 'Cadeaux invités',
  'Hébergement invités', 'Wedding planner', 'Sécurité & service d’ordre',
  'Sonorisation & éclairage', 'Location de vaisselle', 'Lune de miel',
  'Frais de visa / voyage', 'Pourboires & extras', 'Imprévus mariage']

export const FAMILLES_MARIAGE: [string, number[]][] = [
  ['Cérémonies & coutume', [0, 1, 2, 7]],
  ['Tenues & beauté', [3, 4, 5, 6]],
  ['Réception', [8, 9, 10, 11, 12, 23, 24]],
  ['Prestataires', [13, 14, 15, 16, 21, 22]],
  ['Invités & logistique', [17, 18, 19, 20]],
  ['Voyage & divers', [25, 26, 27, 28]],
]

export const CAT_IMMOBILIER = ['Apport personnel', 'Prix d’achat terrain',
  'Prix d’achat bien bâti', 'Frais de notaire', 'Droits d’enregistrement',
  'Commission d’agence', 'Bornage & topographie', 'ACD / Titre foncier',
  'Permis de construire', 'Étude de sol', 'Architecte & études',
  'Fondations & gros œuvre', 'Maçonnerie', 'Charpente & toiture', 'Menuiserie',
  'Électricité (travaux)', 'Plomberie & sanitaires', 'Carrelage & revêtements',
  'Peinture & finitions', 'Clôture & portail', 'Aménagement extérieur',
  'Main d’œuvre', 'Matériaux de construction', 'Raccordements', 'Loyers perçus',
  'Charges locatives', 'Taxe foncière', 'Assurance habitation / PNO',
  'Frais de gérance', 'Entretien & réparations', 'Mensualité crédit immobilier',
  'Divers immobilier']

export const CAT_BUSINESS = ['Apport en capital', 'Chiffre d’affaires',
  'Prestation de service', 'Vente de produits', 'Subvention / Financement',
  'Achats de marchandises', 'Matières premières', 'Sous-traitance',
  'Salaires & charges', 'Honoraires', 'Loyer professionnel',
  'Électricité & eau (pro)', 'Internet & téléphonie (pro)', 'Marketing & publicité',
  'Community management', 'Site web & hébergement', 'Logiciels & abonnements',
  'Équipement & matériel', 'Transport & logistique', 'Carburant (pro)',
  'Frais de mission & déplacement', 'Frais bancaires pro', 'Impôts & taxes pro',
  'Formation', 'Conseil juridique & comptable', 'Assurances pro', 'Divers business']

export const CATEGORIES: Record<ModuleId, string[]> = {
  general: [...REVENUS_GENERAL, ...DEPENSES_GENERAL, CAT_EPARGNE,
    'Investissement', 'Remboursement de crédit',
    CAT_PRET, CAT_EMPRUNT, CAT_REMB_RECU],
  mariage: CAT_MARIAGE,
  immobilier: CAT_IMMOBILIER,
  business: CAT_BUSINESS,
}

export const CAT_REVENUS = new Set([...REVENUS_GENERAL, 'Chiffre d’affaires',
  'Prestation de service', 'Vente de produits', 'Loyers perçus'])

/** Catégories proposées en priorité selon le type choisi : la saisie va plus vite. */
export function categoriesPour(module: ModuleId, type: TypeOp): string[] {
  const all = CATEGORIES[module]
  if (module !== 'general') return all
  if (type === 'revenu') return all.filter((c) => CAT_REVENUS.has(c))
  if (type === 'epargne') return [CAT_EPARGNE, ...all]
  if (type === 'investissement') return ['Investissement', ...all]
  if (type === 'remboursement') return ['Remboursement de crédit', ...all]
  if (type === 'pret') return [CAT_PRET, ...all]
  if (type === 'emprunt') return [CAT_EMPRUNT, ...all]
  if (type === 'remboursement_recu') return [CAT_REMB_RECU, ...all]
  return all.filter((c) => !CAT_REVENUS.has(c))
}

export const LOTS_CONSTRUCTION = ['Études & autorisations', 'Terrassement', 'Fondations',
  'Élévation / Maçonnerie', 'Charpente & toiture', 'Menuiserie', 'Électricité',
  'Plomberie', 'Carrelage & revêtements', 'Peinture & finitions', 'Clôture & portail',
  'Aménagement extérieur', 'Raccordements', 'Imprévus travaux']

/**
 * Sous-catégories : le second niveau de la saisie.
 *
 * Le but est la traçabilité : « Transport 3 000 » ne dit rien, « Transport ›
 * Yango › maison → académie » se vérifie des mois plus tard. Le vocabulaire est
 * celui d'Abidjan ; la liste reste ouverte (« Autre » et le descriptif libre).
 */
export const SOUS_CATEGORIES: Record<string, string[]> = {
  /* --- déplacements ----------------------------------------------------- */
  'Transport en commun': ['Gbaka', 'Woro-woro', 'Bus SOTRA', 'Bateau-bus',
    'Car interurbain', 'Moto-taxi', 'Train', 'Autre transport'],
  'Taxi / VTC': ['Yango', 'inDrive', 'Uber', 'Heetch', 'Taxi compteur',
    'Taxi communal', 'Moto-taxi', 'Course de nuit', 'Autre VTC'],
  Carburant: ['Essence', 'Gasoil', 'Recharge électrique', 'Bidon de secours'],
  'Entretien véhicule': ['Vidange', 'Pneus', 'Batterie', 'Lavage', 'Garage / mécanicien',
    'Pièces détachées', 'Visite technique', 'Stationnement', 'Péage', 'Amende'],
  'Voyages / Vacances': ['Billet d’avion', 'Hôtel', 'Location', 'Visa', 'Transport sur place',
    'Restauration', 'Excursions', 'Assurance voyage'],

  /* --- vie quotidienne --------------------------------------------------- */
  'Alimentation / Courses': ['Marché (vivriers)', 'Supermarché', 'Épicerie de quartier',
    'Boucherie / Poissonnerie', 'Boulangerie', 'Fruits & légumes', 'Eau & boissons',
    'Produits d’entretien', 'Hygiène & beauté', 'Livraison', 'Provisions du mois'],
  'Restaurants / Déjeuners': ['Maquis', 'Restaurant', 'Fast-food', 'Garba / rue',
    'Cantine / bureau', 'Livraison', 'Café / pâtisserie', 'Sortie entre amis'],
  'Gaz / Bouteille': ['Recharge 6 kg', 'Recharge 12 kg', 'Bouteille neuve', 'Détendeur / tuyau'],
  Habillement: ['Vêtements', 'Chaussures', 'Pagne & tissus', 'Couture / retouche',
    'Sacs & accessoires', 'Vêtements enfants', 'Uniformes'],
  'Coiffure & soins': ['Coiffure', 'Barbier', 'Manucure / pédicure', 'Institut / spa',
    'Produits capillaires', 'Cosmétiques'],
  'Santé / Pharmacie': ['Consultation', 'Pharmacie', 'Analyses / laboratoire',
    'Imagerie', 'Dentiste', 'Optique', 'Hospitalisation', 'Kinésithérapie', 'Urgence'],

  /* --- logement ---------------------------------------------------------- */
  Loyer: ['Loyer du mois', 'Avance / caution', 'Arriéré', 'Commission d’agence'],
  Électricité: ['Facture CIE', 'Recharge prépayée', 'Groupe électrogène', 'Branchement'],
  Eau: ['Facture SODECI', 'Bidons / citerne', 'Branchement'],
  'Internet / Box': ['Abonnement fibre', 'Clé / box 4G', 'Installation', 'Réparation'],
  Téléphone: ['Crédit d’appel', 'Forfait', 'Pass internet', 'Téléphone / appareil', 'Réparation'],
  'Entretien & réparations': ['Plomberie', 'Électricité', 'Peinture', 'Menuiserie',
    'Climatisation', 'Électroménager', 'Ménage', 'Jardinage', 'Désinsectisation'],

  /* --- famille & obligations --------------------------------------------- */
  'Scolarité / Éducation': ['Frais de scolarité', 'Inscription', 'Fournitures', 'Uniforme',
    'Cours de soutien', 'Cantine', 'Transport scolaire', 'Formation / certification',
    'Livres', 'Examen / concours'],
  'Garde d’enfants': ['Nounou', 'Crèche', 'Garde ponctuelle'],
  'Aide à la famille élargie': ['Parents', 'Fratrie', 'Village', 'Cérémonie familiale',
    'Santé d’un proche', 'Scolarité d’un proche', 'Funérailles'],
  [CAT_DIME]: ['Dîme du mois', 'Dîme sur prime', 'Dîme sur revenu exceptionnel',
    'Rattrapage de dîme'],
  [CAT_OFFRANDE]: ['Offrande du culte', 'Action de grâce', 'Prémices', 'Vœu / promesse',
    'Projet de l’église', 'Mission / évangélisation', 'Offrande spéciale', 'Semence'],
  [CAT_DON]: ['Association', 'Orphelinat', 'Hôpital / malade', 'Personne dans le besoin',
    'École / bourse', 'Catastrophe / urgence', 'Cotisation', 'Quête'],
  'Dons & solidarité': ['Association', 'Église / mosquée', 'Quête', 'Personne dans le besoin',
    'Catastrophe / urgence'],
  Cadeaux: ['Anniversaire', 'Mariage', 'Naissance', 'Fête de fin d’année', 'Remerciement'],

  /* --- argent ------------------------------------------------------------ */
  [CAT_EPARGNE]: ['Épargne de précaution', 'Projet immobilier', 'Mariage', 'Études',
    'Voyage', 'Retraite', 'Tontine', 'Épargne bloquée', 'Achat véhicule', 'Santé'],
  Investissement: ['Terrain', 'Immobilier locatif', 'Commerce', 'Actions / bourse',
    'Obligations / bons', 'Agriculture / élevage', 'Cryptomonnaie', 'Matériel productif'],
  'Remboursement de crédit': ['Crédit bancaire', 'Crédit véhicule', 'Crédit immobilier',
    'Microcrédit', 'Découvert', 'Dette familiale', 'Fournisseur'],
  [CAT_PRET]: ['Famille', 'Ami', 'Collègue', 'Employé', 'Partenaire d’affaires', 'Tontine'],
  [CAT_EMPRUNT]: ['Famille', 'Ami', 'Collègue', 'Banque', 'Microfinance', 'Tontine',
    'Partenaire d’affaires'],
  [CAT_REMB_RECU]: ['Famille', 'Ami', 'Collègue', 'Employé', 'Partenaire d’affaires', 'Tontine'],
  'Frais bancaires': ['Tenue de compte', 'Retrait', 'Virement', 'Carte bancaire',
    'Agios / découvert', 'Frais mobile money', 'Change'],
  'Impôts & taxes': ['Impôt sur le revenu', 'Taxe foncière', 'Patente', 'TVA',
    'Vignette', 'Taxe communale'],
  'Frais administratifs': ['Pièce d’identité', 'Passeport', 'Permis de conduire',
    'Légalisation', 'Timbre fiscal', 'Notaire', 'Avocat', 'Traduction'],

  /* --- loisirs ----------------------------------------------------------- */
  'Loisirs & sorties': ['Cinéma', 'Concert', 'Sport / match', 'Sortie en famille',
    'Plage / piscine', 'Jeux', 'Bar / soirée'],
  'Abonnements (streaming, apps)': ['Netflix', 'Canal+', 'Spotify / musique', 'YouTube Premium',
    'Stockage cloud', 'Logiciel', 'Salle de sport', 'Presse'],
  'Sport / Fitness': ['Abonnement salle', 'Coach', 'Équipement', 'Compétition / inscription'],

  /* --- revenus ------------------------------------------------------------ */
  Salaire: ['Salaire net du mois', 'Heures supplémentaires', 'Rappel de salaire',
    'Indemnité de transport', 'Indemnité de logement', 'Avance sur salaire'],
  'Prime / 13e mois': ['13e mois', 'Prime de rendement', 'Prime de fin d’année',
    'Bonus exceptionnel', 'Intéressement'],
  'Freelance / Consulting': ['Mission ponctuelle', 'Contrat récurrent', 'Acompte',
    'Solde de facture', 'Formation dispensée'],
  'Commerce / Ventes': ['Vente en boutique', 'Vente en ligne', 'Vente en gros',
    'Marché / foire', 'Commission'],
  'Loyers perçus': ['Loyer résidentiel', 'Loyer commercial', 'Caution encaissée', 'Arriéré perçu'],
  'Aide familiale': ['Parents', 'Conjoint', 'Fratrie', 'Diaspora'],
}

/** Sous-catégories proposées, toujours suivies d'une entrée libre. */
export function sousCategoriesPour(categorie: string): string[] {
  return SOUS_CATEGORIES[categorie] ?? []
}

/** Établissements les plus courants : banques et mobile money d'Afrique de l'Ouest. */
export const ETABLISSEMENTS = ['Wave', 'Orange Money', 'MTN MoMo', 'Moov Money',
  'Djamo', 'Ecobank', 'SGCI — Société Générale', 'NSIA Banque', 'BACI', 'BICICI',
  'BNI', 'Bridge Bank', 'Coris Bank', 'UBA', 'Bank of Africa', 'Versus Bank',
  'Caisse d’épargne', 'Microfinance / COOPEC', 'Tontine', 'Coffre / domicile', 'Autre']
