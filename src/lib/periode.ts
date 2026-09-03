/** Périodes de rapport : journalière, mensuelle, trimestrielle, annuelle. */
import { MOIS } from '../data/refs'

export type TypePeriode = 'jour' | 'mois' | 'trimestre' | 'annee'

export interface Periode {
  type: TypePeriode
  annee: number
  mois?: number        // 1..12, pour « mois »
  trimestre?: number   // 1..4, pour « trimestre »
  date?: string        // ISO court, pour « jour »
}

export const TYPES_PERIODE: { id: TypePeriode; label: string }[] = [
  { id: 'jour', label: 'Journalier' },
  { id: 'mois', label: 'Mensuel' },
  { id: 'trimestre', label: 'Trimestriel' },
  { id: 'annee', label: 'Annuel' },
]

export const TRIMESTRES = [
  { id: 1, label: 'T1 — janvier à mars' },
  { id: 2, label: 'T2 — avril à juin' },
  { id: 3, label: 'T3 — juillet à septembre' },
  { id: 4, label: 'T4 — octobre à décembre' },
]

const iso = (a: number, m: number, j: number) =>
  `${a}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`

const finDeMois = (a: number, m: number) => new Date(a, m, 0).getDate()

export interface Bornes {
  debut: string
  fin: string
  libelle: string
  /** Suffixe de nom de fichier, sans espace ni accent. */
  cle: string
}

export function bornes(p: Periode): Bornes {
  switch (p.type) {
    case 'jour': {
      const d = p.date ?? iso(p.annee, 1, 1)
      const [a, m, j] = d.split('-')
      return {
        debut: d, fin: d,
        libelle: `Journée du ${j}/${m}/${a}`,
        cle: `jour-${d}`,
      }
    }
    case 'mois': {
      const m = p.mois ?? 1
      return {
        debut: iso(p.annee, m, 1),
        fin: iso(p.annee, m, finDeMois(p.annee, m)),
        libelle: `${MOIS[m - 1]} ${p.annee}`,
        cle: `${p.annee}-${String(m).padStart(2, '0')}`,
      }
    }
    case 'trimestre': {
      const t = p.trimestre ?? 1
      const premier = (t - 1) * 3 + 1
      const dernier = premier + 2
      return {
        debut: iso(p.annee, premier, 1),
        fin: iso(p.annee, dernier, finDeMois(p.annee, dernier)),
        libelle: `${t}ᵉ trimestre ${p.annee}`,
        cle: `${p.annee}-T${t}`,
      }
    }
    default:
      return {
        debut: iso(p.annee, 1, 1),
        fin: iso(p.annee, 12, 31),
        libelle: `Année ${p.annee}`,
        cle: `${p.annee}`,
      }
  }
}

/** Les mois couverts par la période, pour les tableaux et graphiques mensuels. */
export function moisCouverts(p: Periode): number[] {
  if (p.type === 'annee') return Array.from({ length: 12 }, (_, i) => i + 1)
  if (p.type === 'trimestre') {
    const t = p.trimestre ?? 1
    return [(t - 1) * 3 + 1, (t - 1) * 3 + 2, (t - 1) * 3 + 3]
  }
  if (p.type === 'mois') return [p.mois ?? 1]
  return [Number((p.date ?? '2000-01-01').slice(5, 7))]
}

export const dansPeriode = (date: string, b: Bornes) => date >= b.debut && date <= b.fin
