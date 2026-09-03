import { DEVISES } from '../data/refs'
import type { Parametres } from '../types'

const INDEX = new Map(DEVISES.map((d) => [d[0], d]))

export const nomDevise = (code: string) => INDEX.get(code)?.[1] ?? code
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
  const sym = symboleDevise(p.deviseBase)
  const dec = Math.abs(v) < 1000 ? decimalesDevise(p.deviseBase) : 0
  if (opts?.court && Math.abs(v) >= 1_000_000) {
    return `${(v / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M ${sym}`
  }
  if (opts?.court && Math.abs(v) >= 10_000) {
    return `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} k ${sym}`
  }
  return `${v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec })} ${sym}`
}

export const pct = (v: number) =>
  `${(v * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
