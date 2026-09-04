/**
 * Mise à jour des cours depuis une source publique.
 *
 * L'application reste utilisable hors ligne : ceci est une commodité, jamais
 * une dépendance. En cas d'échec — pas de réseau, source indisponible — les
 * cours déjà enregistrés restent en place et l'utilisateur est prévenu.
 *
 * La table interne est référencée sur le franc CFA : `cours[X]` vaut le
 * nombre de francs CFA pour une unité de X. La source, elle, publie
 * l'inverse (combien de X pour un franc CFA) ; c'est la seule conversion à
 * faire, et elle est testée séparément de tout appel réseau.
 */
const PIVOT = 'xof'

/** Deux adresses pour la même donnée : si l'une tombe, l'autre répond. */
const SOURCES = [
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${PIVOT}.json`,
  `https://latest.currency-api.pages.dev/v1/currencies/${PIVOT}.json`,
]

export interface ReponseCours {
  date?: string
  [devise: string]: unknown
}

export interface CoursRecuperes {
  /** Cours prêts à être enregistrés, exprimés en francs CFA par unité. */
  cours: Record<string, number>
  /** Date publiée par la source, telle quelle. */
  date: string
  /** Devises demandées que la source ne connaît pas. */
  manquantes: string[]
}

/**
 * Transforme la réponse de la source en cours utilisables. Séparée de l'appel
 * réseau pour être vérifiable sans connexion.
 */
export function lireReponse(corps: ReponseCours, codes: string[]): CoursRecuperes {
  const table = corps[PIVOT]
  if (!table || typeof table !== 'object') {
    throw new Error('Réponse inattendue de la source des cours.')
  }
  const parUniteDePivot = table as Record<string, number>
  const cours: Record<string, number> = {}
  const manquantes: string[] = []

  for (const code of codes) {
    const bas = code.toLowerCase()
    if (bas === PIVOT) { cours[code] = 1; continue }
    const valeur = parUniteDePivot[bas]
    // Une valeur absente, nulle ou aberrante ne doit pas produire un cours :
    // mieux vaut la signaler que d'enregistrer un nombre faux.
    if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur <= 0) {
      manquantes.push(code)
      continue
    }
    cours[code] = Math.round((1 / valeur) * 1e6) / 1e6
  }

  return { cours, date: typeof corps.date === 'string' ? corps.date : '', manquantes }
}

/** Va chercher les cours en ligne. Lève une erreur si aucune source ne répond. */
export async function telechargerCours(codes: string[]): Promise<CoursRecuperes> {
  let derniere: unknown
  for (const source of SOURCES) {
    try {
      const reponse = await fetch(source, { cache: 'no-store' })
      if (!reponse.ok) throw new Error(`Réponse ${reponse.status}`)
      return lireReponse(await reponse.json() as ReponseCours, codes)
    } catch (erreur) {
      derniere = erreur
    }
  }
  throw derniere instanceof Error ? derniere : new Error('Sources injoignables.')
}
