/**
 * Référentiel effectif : celui des paramètres, pas celui du code.
 *
 * Les listes livrées ne sont qu'un point de départ. Dès le premier lancement
 * elles sont recopiées dans les paramètres, et c'est cette copie que
 * l'application lit partout — pour qu'un utilisateur de Dakar, de Douala ou de
 * Paris puisse tout renommer sans toucher au code.
 */
import {
  CATEGORIES, CAT_REVENUS, MOYENS, SOUS_CATEGORIES, CAT_DIME, CAT_EMPRUNT, CAT_EPARGNE,
  CAT_PRET, CAT_REMB_RECU,
} from '../data/refs'
import type { ModuleId, Parametres, TypeOp } from '../types'

export const CATEGORIES_DEFAUT = CATEGORIES
export const SOUS_CATEGORIES_DEFAUT = SOUS_CATEGORIES
export const MOYENS_DEFAUT = MOYENS

/** Toutes les catégories d'un module, dans l'ordre choisi par l'utilisateur. */
export const categoriesDe = (p: Parametres, module: ModuleId): string[] =>
  p.categories?.[module] ?? CATEGORIES[module]

/** Catégories proposées en priorité selon le type : la saisie va plus vite. */
export function categoriesPour(p: Parametres, module: ModuleId, type: TypeOp): string[] {
  const all = categoriesDe(p, module)
  if (module !== 'general') return all
  const tete = (c: string) => (all.includes(c) ? [c] : [])
  if (type === 'revenu') return all.filter((c) => CAT_REVENUS.has(c))
  if (type === 'epargne') return [...tete(CAT_EPARGNE), ...all]
  if (type === 'investissement') return [...tete('Investissement'), ...all]
  if (type === 'remboursement') return [...tete('Remboursement de crédit'), ...all]
  if (type === 'pret') return [...tete(CAT_PRET), ...all]
  if (type === 'emprunt') return [...tete(CAT_EMPRUNT), ...all]
  if (type === 'remboursement_recu') return [...tete(CAT_REMB_RECU), ...all]
  return all.filter((c) => !CAT_REVENUS.has(c))
}

export const sousCategoriesDe = (p: Parametres, categorie: string): string[] =>
  p.sousCategories?.[categorie] ?? SOUS_CATEGORIES[categorie] ?? []

export const moyensDe = (p: Parametres): string[] => p.moyens ?? MOYENS

export const DIME = CAT_DIME
