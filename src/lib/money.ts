import { DEVISES } from '../data/refs'
import { LANGUE_DEFAUT, localeDe } from '../i18n/langues'
import type { Parametres } from '../types'

const INDEX = new Map(DEVISES.map((d) => [d[0], d]))

/**
 * Nom de la devise dans la langue demandée. `Intl.DisplayNames` les connaît
 * toutes ; le tableau maison reste la référence en français, où il distingue
 * le franc CFA de l'UEMOA de celui de la CEMAC — ce que la norme ne fait pas.
 */
export function nomDevise(code: string, langue?: string): string {
  const maison = INDEX.get(code)?.[1] ?? code
  if (!langue || langue === LANGUE_DEFAUT) return maison
  try {
    return new Intl.DisplayNames([localeDe(langue)], { type: 'currency' }).of(code) ?? maison
  } catch {
    return maison
  }
}
export const symboleDevise = (code: string) => INDEX.get(code)?.[2] ?? code
export const decimalesDevise = (code: string) => INDEX.get(code)?.[4] ?? 0

/** Taux d'une devise vers la devise de base, dérivé des cours saisis. */
export function taux(p: Parametres, code?: string): number {
  const from = code || p.deviseBase
  if (from === p.deviseBase) return 1
  const a = p.cours[from]
  const b = p.cours[p.deviseBase]
  if (!a || !b) return 1
  return a / b
}

export function convertir(p: Parametres, montant: number, code?: string): number {
  return Math.round(montant * taux(p, code) * 100) / 100
}

/** Formatage court : « 1 250 000 FCFA ». Le symbole suit la devise de base. */
export function fmt(p: Parametres, v: number | null | undefined, opts?: { court?: boolean }): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  // Le séparateur de milliers suit la langue choisie, pas le pays du navigateur.
  const loc = localeDe(p.langue)
  const sym = symboleDevise(p.deviseBase)
  const dec = Math.abs(v) < 1000 ? decimalesDevise(p.deviseBase) : 0
  if (opts?.court && Math.abs(v) >= 1_000_000) {
    return `${(v / 1_000_000).toLocaleString(loc, { maximumFractionDigits: 1 })} M ${sym}`
  }
  if (opts?.court && Math.abs(v) >= 10_000) {
    return `${(v / 1000).toLocaleString(loc, { maximumFractionDigits: 0 })} k ${sym}`
  }
  return `${v.toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec })} ${sym}`
}

export const pct = (v: number, langue?: string) =>
  `${(v * 100).toLocaleString(localeDe(langue), { maximumFractionDigits: 1 })} %`
