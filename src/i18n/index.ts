/**
 * Traduction de l'application.
 *
 * La langue est stockée dans les paramètres, comme la devise : elle suit donc
 * l'utilisateur, y compris dans la sauvegarde en ligne et d'un appareil à
 * l'autre. `t` lit le dictionnaire par chemin pointé et remplace les
 * marqueurs {nom} par les valeurs fournies.
 */
import { useLiveQuery } from 'dexie-react-hooks'
import { getParametres } from '../db'
import { LANGUE_DEFAUT, type Langue, estLangue, langueDuNavigateur } from './langues'
import { fr } from './fr'
import { en } from './en'
import type { Dictionnaire } from './fr'

export { LANGUES, type Langue, langueDuNavigateur } from './langues'
export type { Dictionnaire } from './fr'

const DICTIONNAIRES: Record<Langue, Dictionnaire> = { fr, en }

export const dictionnaire = (langue: Langue): Dictionnaire =>
  DICTIONNAIRES[langue] ?? DICTIONNAIRES[LANGUE_DEFAUT]

/**
 * Chemins valides du dictionnaire, du type « journal.saisieRapide ».
 * Le groupe `mois` en est exclu : ce sont des tableaux, lus par `useMois`.
 */
type GroupeTexte = Exclude<keyof Dictionnaire, 'mois'>
export type CleTraduction = {
  [G in GroupeTexte]: `${G & string}.${keyof Dictionnaire[G] & string}`
}[GroupeTexte]

export type Traducteur = (cle: CleTraduction, valeurs?: Record<string, string | number>) => string

export function traducteurPour(langue: Langue): Traducteur {
  const dico = dictionnaire(langue)
  const secours = dictionnaire(LANGUE_DEFAUT)
  return (cle, valeurs) => {
    const [groupe, entree] = cle.split('.') as [keyof Dictionnaire, string]
    const table = (dico[groupe] ?? secours[groupe]) as Record<string, string>
    const texte = table?.[entree]
      ?? (secours[groupe] as Record<string, string>)?.[entree]
      ?? cle
    return valeurs
      ? texte.replace(/\{(\w+)\}/g, (_, nom) => String(valeurs[nom] ?? `{${nom}}`))
      : texte
  }
}

/** Langue courante, lue dans les paramètres — donc réactive à leur modification. */
export function useLangue(): Langue {
  const langue = useLiveQuery(async () => (await getParametres()).langue, [])
  return estLangue(langue) ? langue : LANGUE_DEFAUT
}

/** Noms des mois dans la langue courante — longs et abrégés. */
export function useMois(): { long: string[]; court: string[] } {
  return dictionnaire(useLangue()).mois
}

/**
 * Hook de traduction. `t('journal.saisieRapide')`, ou avec des valeurs :
 * `t('plus.recurrentAjoute', { libelle, date })`.
 */
export function useT(): Traducteur {
  return traducteurPour(useLangue())
}

export { LANGUE_DEFAUT, estLangue }

/* ------------------------------------------------- libellés d'énumération */
import type { ModuleId, TypeOp } from '../types'

export const labelModule = (t: Traducteur, m: ModuleId) =>
  t(`modules.${m}` as CleTraduction)
export const labelModuleCourt = (t: Traducteur, m: ModuleId) =>
  t(`modules.${m}Court` as CleTraduction)
export const labelType = (t: Traducteur, type: TypeOp) =>
  t(`types.${type}` as CleTraduction)
export const labelNature = (t: Traducteur, n: string) =>
  t(`natures.${n}` as CleTraduction)
export const labelStatut = (t: Traducteur, s: string) =>
  t(`statuts.${s}` as CleTraduction)
export const labelFrequence = (t: Traducteur, f: string) =>
  t(`frequences.${f}` as CleTraduction)
