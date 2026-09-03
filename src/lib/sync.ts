/**
 * Synchronisation Firestore — locale d'abord.
 *
 * IndexedDB (via Dexie) reste la source de vérité immédiate : chaque page lit
 * et écrit dedans directement, hors ligne comme en ligne, sans attendre le
 * réseau. Ceci ne fait qu'y ajouter une sauvegarde miroir dans Firestore,
 * sous users/{uid}/…, pour la retrouver sur un autre appareil.
 *
 * Pas de résolution de conflit fine : l'app est pensée pour un utilisateur à
 * la fois sur un appareil à la fois. En cas de double écriture, la ligne la
 * plus récente (`updatedAt`) l'emporte, aussi bien à l'envoi qu'au rapatriement.
 */
import type { Table } from 'dexie'
import {
  type DocumentData, collection, doc, getDocs, writeBatch,
} from 'firebase/firestore'
import { firestore } from './firebase'
import { db } from '../db'
import type { Parametres } from '../types'

const TABLES = [
  'ecritures', 'comptes', 'plan', 'postes', 'objectifs', 'dettes', 'recurrents',
] as const

/**
 * Vue générique sur les tables : leurs schémas diffèrent, mais la
 * synchronisation ne s'appuie que sur `id` et `updatedAt`, communs à toutes.
 */
type LigneSync = { id: string; updatedAt?: string }
const tableSync = (nom: (typeof TABLES)[number]) =>
  db[nom] as unknown as Table<LigneSync, string>

let uidActif: string | null = null
let minuteur: ReturnType<typeof setTimeout> | undefined

export const definirUtilisateurSync = (uid: string | null) => { uidActif = uid }
export const syncActive = () => uidActif !== null

/** À appeler après toute écriture locale : envoie tout, groupé, avec un léger délai. */
export function programmerEnvoi() {
  if (!uidActif) return
  clearTimeout(minuteur)
  const uid = uidActif
  minuteur = setTimeout(() => { void pousserTout(uid) }, 1500)
}

async function ecrireParLots(
  chemin: (ligne: DocumentData & { id: string }) => ReturnType<typeof doc>,
  lignes: (DocumentData & { id: string })[],
) {
  const TAILLE_LOT = 450 // marge sous la limite Firestore de 500 opérations par lot
  for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
    const lot = writeBatch(firestore)
    for (const ligne of lignes.slice(i, i + TAILLE_LOT)) lot.set(chemin(ligne), ligne)
    await lot.commit()
  }
}

/** Envoie l'intégralité des données locales vers le dossier cloud de l'utilisateur. */
export async function pousserTout(uid: string) {
  for (const nom of TABLES) {
    const lignes = await tableSync(nom).toArray()
    await ecrireParLots((l) => doc(firestore, 'users', uid, nom, l.id), lignes)
  }
  const parametres = await db.parametres.get('app')
  if (parametres) {
    await ecrireParLots(
      (l) => doc(firestore, 'users', uid, 'parametres', l.id), [parametres as LigneSync],
    )
  }
}

const plusRecente = (a?: { updatedAt?: string }, b?: { updatedAt?: string }) =>
  (a?.updatedAt ?? '') >= (b?.updatedAt ?? '')

/**
 * Rapatrie les données du cloud vers l'appareil, typiquement à la connexion.
 * Ne remplace une ligne locale que si la version cloud est au moins aussi
 * récente — un nouvel appareil, local vide, récupère donc tout tel quel.
 */
export async function tirerTout(uid: string) {
  for (const nom of TABLES) {
    const instantane = await getDocs(collection(firestore, 'users', uid, nom))
    if (instantane.empty) continue
    const table = tableSync(nom)
    const locales = new Map((await table.toArray()).map((l) => [l.id, l]))
    const aEcrire: LigneSync[] = []
    instantane.forEach((document) => {
      const distante = document.data() as LigneSync
      if (plusRecente(distante, locales.get(document.id))) aEcrire.push(distante)
    })
    if (aEcrire.length) await table.bulkPut(aEcrire)
  }

  const instantaneParams = await getDocs(collection(firestore, 'users', uid, 'parametres'))
  const documentParams = instantaneParams.docs.find((d) => d.id === 'app')
  if (documentParams) {
    const distante = documentParams.data() as Parametres
    const locale = await db.parametres.get('app')
    if (plusRecente(distante, locale)) await db.parametres.put(distante)
  }
}
