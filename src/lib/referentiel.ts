/**
 * Référentiel effectif : celui des paramètres, pas celui du code.
 *
 * Les listes livrées ne sont qu'un point de départ, et existent dans chaque
 * langue. Au premier lancement, celle de la langue détectée est recopiée dans
 * les paramètres ; c'est cette copie que l'application lit partout — pour
 * qu'un utilisateur de Dakar, de Douala, de Lagos ou de Paris puisse tout
 * renommer sans toucher au code.
 */
import {
  CATEGORIES, CAT_DIME, CAT_EMPRUNT, CAT_EPARGNE, CAT_PRET, CAT_REMB_RECU,
  CAT_REVENUS, ETABLISSEMENTS, FAMILLES_MARIAGE, MOYENS, SOUS_CATEGORIES,
} from '../data/refs'
import {
  CATEGORIES_EN, CAT_EMPRUNT_EN, CAT_EPARGNE_EN, CAT_PRET_EN, CAT_REMB_RECU_EN,
  CAT_REVENUS_EN, ETABLISSEMENTS_EN, FAMILLES_MARIAGE_EN, MOYENS_EN, SOUS_CATEGORIES_EN,
} from '../data/refs-en'
import { LANGUE_DEFAUT, type Langue } from '../i18n/langues'
import type { ModuleId, Parametres, TypeOp } from '../types'

export interface ReferentielLivre {
  categories: Record<ModuleId, string[]>
  sousCategories: Record<string, string[]>
  moyens: string[]
  etablissements: string[]
  famillesMariage: [string, number[]][]
  revenus: Set<string>
  epargne: string
  investissement: string
  remboursement: string
  pret: string
  emprunt: string
  remboursementRecu: string
}

const LIVRES: Record<Langue, ReferentielLivre> = {
  fr: {
    categories: CATEGORIES,
    sousCategories: SOUS_CATEGORIES,
    moyens: MOYENS,
    etablissements: ETABLISSEMENTS,
    famillesMariage: FAMILLES_MARIAGE,
    revenus: CAT_REVENUS,
    epargne: CAT_EPARGNE,
    investissement: 'Investissement',
    remboursement: 'Remboursement de crédit',
    pret: CAT_PRET,
    emprunt: CAT_EMPRUNT,
    remboursementRecu: CAT_REMB_RECU,
  },
  en: {
    categories: CATEGORIES_EN,
    sousCategories: SOUS_CATEGORIES_EN,
    moyens: MOYENS_EN,
    etablissements: ETABLISSEMENTS_EN,
    famillesMariage: FAMILLES_MARIAGE_EN,
    revenus: CAT_REVENUS_EN,
    epargne: CAT_EPARGNE_EN,
    investissement: 'Investment',
    remboursement: 'Loan repayment',
    pret: CAT_PRET_EN,
    emprunt: CAT_EMPRUNT_EN,
    remboursementRecu: CAT_REMB_RECU_EN,
  },
}

export const referentielLivre = (langue: string): ReferentielLivre =>
  LIVRES[langue as Langue] ?? LIVRES[LANGUE_DEFAUT]

const livreDe = (p: Parametres) => referentielLivre(p.langue)

/** Toutes les catégories d'un module, dans l'ordre choisi par l'utilisateur. */
export const categoriesDe = (p: Parametres, module: ModuleId): string[] =>
  p.categories?.[module] ?? livreDe(p).categories[module]

/** Catégories proposées en priorité selon le type : la saisie va plus vite. */
export function categoriesPour(p: Parametres, module: ModuleId, type: TypeOp): string[] {
  const all = categoriesDe(p, module)
  if (module !== 'general') return all
  const livre = livreDe(p)
  const tete = (c: string) => (all.includes(c) ? [c] : [])
  if (type === 'revenu') return all.filter((c) => livre.revenus.has(c))
  if (type === 'epargne') return [...tete(livre.epargne), ...all]
  if (type === 'investissement') return [...tete(livre.investissement), ...all]
  if (type === 'remboursement') return [...tete(livre.remboursement), ...all]
  if (type === 'pret') return [...tete(livre.pret), ...all]
  if (type === 'emprunt') return [...tete(livre.emprunt), ...all]
  if (type === 'remboursement_recu') return [...tete(livre.remboursementRecu), ...all]
  return all.filter((c) => !livre.revenus.has(c))
}

export const sousCategoriesDe = (p: Parametres, categorie: string): string[] =>
  p.sousCategories?.[categorie] ?? livreDe(p).sousCategories[categorie] ?? []

export const moyensDe = (p: Parametres): string[] => p.moyens ?? livreDe(p).moyens

export const etablissementsDe = (p: Parametres): string[] =>
  livreDe(p).etablissements

/**
 * Le référentiel enregistré est-il encore celui livré, à l'identique ?
 * Si oui, un changement de langue peut le traduire sans rien détruire ; sinon
 * l'utilisateur l'a personnalisé, et ses libellés sont conservés tels quels.
 */
export function referentielIntact(p: Parametres, langue: string): boolean {
  const livre = referentielLivre(langue)
  const memeListe = (a: string[] = [], b: string[] = []) =>
    a.length === b.length && a.every((v, i) => v === b[i])
  return (Object.keys(livre.categories) as ModuleId[])
    .every((m) => memeListe(p.categories?.[m], livre.categories[m]))
}

export const DIME = CAT_DIME
