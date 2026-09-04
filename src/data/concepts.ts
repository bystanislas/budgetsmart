/**
 * Concepts reconnus quelle que soit la langue.
 *
 * Certaines catégories ne sont pas de simples libellés : la dîme est déduite
 * de la dîme due, l'épargne part vers un compte d'épargne, les dons appellent
 * le nom de l'église. Comme un utilisateur peut changer de langue après avoir
 * saisi des mois d'écritures, ces règles doivent reconnaître les libellés de
 * *toutes* les langues, pas seulement celle du moment — sinon un passage au
 * français ferait disparaître les dîmes saisies en anglais.
 */
import {
  CAT_DIME, CAT_DIME_LEGACY, CAT_DON, CAT_EMPRUNT, CAT_EPARGNE, CAT_OFFRANDE,
  CAT_PRET, CAT_REMB_RECU,
} from './refs'
import {
  CAT_DIME_EN, CAT_DON_EN, CAT_EMPRUNT_EN, CAT_EPARGNE_EN, CAT_OFFRANDE_EN,
  CAT_PRET_EN, CAT_REMB_RECU_EN,
} from './refs-en'

/** Seule la dîme éteint la dîme due — jamais l'offrande ni le don. */
export const NOMS_DIME = new Set([CAT_DIME, CAT_DIME_LEGACY, CAT_DIME_EN])

/** Catégories qui appellent le nom de l'église ou du bénéficiaire. */
export const NOMS_SPIRITUEL = new Set([
  CAT_DIME, CAT_DIME_LEGACY, CAT_DIME_EN,
  CAT_OFFRANDE, CAT_OFFRANDE_EN,
  CAT_DON, CAT_DON_EN,
  'Dons & solidarité', 'Charity & solidarity',
])

export const NOMS_EPARGNE = new Set([CAT_EPARGNE, CAT_EPARGNE_EN])
export const NOMS_PRET = new Set([CAT_PRET, CAT_PRET_EN])
export const NOMS_EMPRUNT = new Set([CAT_EMPRUNT, CAT_EMPRUNT_EN])
export const NOMS_REMB_RECU = new Set([CAT_REMB_RECU, CAT_REMB_RECU_EN])

/**
 * Salaire et primes, dans les deux langues. L'assiette de la dîme peut être
 * limitée au salaire : sans cette reconnaissance, elle ne trouvait rien dès
 * que l'utilisateur passait l'application en anglais, et la dîme due tombait
 * silencieusement à zéro.
 */
export const NOMS_SALAIRE = new Set(['Salaire', 'Salary'])
export const NOMS_PRIME = new Set(['Prime / 13e mois', 'Bonus / 13th month'])

export const estSalaire = (categorie: string) => NOMS_SALAIRE.has(categorie)
export const estPrime = (categorie: string) => NOMS_PRIME.has(categorie)

export const estDime = (categorie: string) => NOMS_DIME.has(categorie)
export const estSpirituel = (categorie: string) => NOMS_SPIRITUEL.has(categorie)
export const estEpargne = (categorie: string) => NOMS_EPARGNE.has(categorie)
