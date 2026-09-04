/**
 * Notification de mise à jour.
 *
 * L'utilisateur n'est prévenu que lorsque l'application qu'il utilise est
 * réellement plus récente que la dernière version qu'il a lue. La marque est
 * gardée sur l'appareil, et non dans les paramètres synchronisés : c'est bien
 * cet appareil-ci qui vient d'être mis à jour, pas le compte.
 */
import { useEffect, useState } from 'react'
import { JOURNAL, type Version } from '../data/nouveautes'

const CLE = 'budget-smart:nouveautes-lues'

export const VERSION_ACTUELLE = JOURNAL[0]?.version ?? '0.0.0'

/** Compare deux numéros de version « 1.10.2 » — retourne >0 si a est plus récent. */
function comparer(a: string, b: string): number {
  const ma = a.split('.').map(Number)
  const mb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(ma.length, mb.length); i += 1) {
    const d = (ma[i] ?? 0) - (mb[i] ?? 0)
    if (d !== 0) return d
  }
  return 0
}

const lire = (): string | null => {
  try { return localStorage.getItem(CLE) } catch { return null }
}

/**
 * Les versions à annoncer. Sans repère enregistré, on ne déroule pas tout
 * l'historique : seule la version en cours est signalée — c'est le cas d'une
 * application déjà installée avant l'arrivée de cet écran.
 */
export function nouveautesNonLues(): Version[] {
  const lues = lire()
  if (!lues) return JOURNAL.slice(0, 1)
  return JOURNAL.filter((v) => comparer(v.version, lues) > 0)
}

const abonnes = new Set<() => void>()

function ecrire(version: string) {
  try { localStorage.setItem(CLE, version) } catch { /* stockage refusé */ }
  abonnes.forEach((f) => f())
}

/** Après lecture de l'écran : plus rien à signaler jusqu'à la prochaine version. */
export const marquerLues = () => ecrire(VERSION_ACTUELLE)

/**
 * Première installation : on pose le repère sans rien annoncer. Un nouvel
 * utilisateur n'a pas à recevoir l'historique des corrections d'un logiciel
 * qu'il découvre.
 */
export function initialiserSiPremiereInstallation() {
  if (!lire()) ecrire(VERSION_ACTUELLE)
}

/** Nombre de versions non lues, réactif : la cloche s'éteint dès la lecture. */
export function useNouveautes(): Version[] {
  const [versions, setVersions] = useState<Version[]>(nouveautesNonLues)
  useEffect(() => {
    const majliste = () => setVersions(nouveautesNonLues())
    abonnes.add(majliste)
    return () => { abonnes.delete(majliste) }
  }, [])
  return versions
}
