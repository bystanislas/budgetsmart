/**
 * Langues de l'application.
 *
 * Ajouter une langue tient en trois gestes : ajouter son code ici, écrire son
 * dictionnaire dans src/i18n/<code>.ts, et le référencer dans src/i18n/index.ts.
 * Rien d'autre dans le code n'a besoin de changer.
 */
export const LANGUES = [
  { code: 'fr', nom: 'Français', drapeau: '🇫🇷', locale: 'fr-FR' },
  { code: 'en', nom: 'English', drapeau: '🇬🇧', locale: 'en-GB' },
] as const

export type Langue = (typeof LANGUES)[number]['code']

export const LANGUE_DEFAUT: Langue = 'fr'

/**
 * Locale à passer aux fonctions `toLocaleString` : c'est elle qui décide du
 * séparateur de milliers et de la virgule décimale. « 1 250 000,50 » en
 * français, « 1,250,000.50 » en anglais.
 */
export function localeDe(langue: unknown): string {
  return LANGUES.find((l) => l.code === langue)?.locale
    ?? LANGUES.find((l) => l.code === LANGUE_DEFAUT)!.locale
}

const codes = LANGUES.map((l) => l.code) as readonly string[]
export const estLangue = (v: unknown): v is Langue =>
  typeof v === 'string' && codes.includes(v)

/** Langue du navigateur si elle est proposée, français sinon. */
export function langueDuNavigateur(): Langue {
  for (const demandee of navigator.languages ?? [navigator.language]) {
    const base = (demandee ?? '').slice(0, 2).toLowerCase()
    if (estLangue(base)) return base
  }
  return LANGUE_DEFAUT
}
