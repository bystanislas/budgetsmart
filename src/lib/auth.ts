/**
 * Connexion sans mot de passe : lien reçu par email, ou code reçu par SMS.
 * Les deux mènent au même compte Firebase, utilisé comme identifiant pour
 * retrouver ses données sur n'importe quel appareil (voir lib/sync.ts).
 */
import { useEffect, useState } from 'react'
import {
  type ConfirmationResult, type User,
  RecaptchaVerifier, isSignInWithEmailLink, onAuthStateChanged, sendSignInLinkToEmail,
  signInWithEmailLink, signInWithPhoneNumber, signOut,
} from 'firebase/auth'
import { auth, firebaseConfig } from './firebase'

const CLE_EMAIL_ATTENTE = 'budget-smart:email-connexion'

/** `undefined` tant que Firebase n'a pas encore répondu, `null` si déconnecté. */
export function useUtilisateur() {
  const [utilisateur, setUtilisateur] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUtilisateur), [])
  return utilisateur
}

/**
 * Vrai quand l'application tourne depuis l'icône de l'écran d'accueil, et non
 * dans un onglet du navigateur. C'est le cas qui casse la connexion par lien :
 * le lien s'ouvre forcément dans le navigateur, et sur iPhone une application
 * installée possède son propre stockage, séparé de celui de Safari. La session
 * créée dans Safari n'atteint donc jamais l'application, qui reste déconnectée.
 * On propose alors de coller le lien directement ici.
 */
export const estAppInstallee = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as { standalone?: boolean }).standalone === true

export async function envoyerLienConnexion(email: string) {
  const url = `${window.location.origin}${window.location.pathname}`
  await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true })
  localStorage.setItem(CLE_EMAIL_ATTENTE, email)
}

export const lienDeConnexionRecu = () => isSignInWithEmailLink(auth, window.location.href)

export const emailMemorise = () => localStorage.getItem(CLE_EMAIL_ATTENTE)

/**
 * Retrouve le code de vérification dans ce que l'utilisateur a collé.
 *
 * Un lien copié depuis un email arrive rarement intact : les messageries le
 * coupent en plusieurs lignes, l'enveloppent dans une redirection maison
 * (google.com/url?q=…, safelinks…), ou il se retrouve noyé dans le texte du
 * message. Plutôt que d'espérer une adresse exacte, on va chercher le seul
 * élément qui compte — le code — et on rebâtit nous-mêmes le lien attendu :
 * la clé du projet, elle, nous appartient.
 */
export function codeDepuisSaisie(saisie: string): string | undefined {
  const compact = saisie.replace(/\s+/g, '')
  // « oobCode=… » en clair, ou « oobCode%3D… » dans une redirection encodée.
  const dansLien = compact.match(/oobCode(?:=|%3D)([A-Za-z0-9_-]+)/i)?.[1]
  if (dansLien) return dansLien
  // Sinon, l'utilisateur peut avoir collé le code seul. Un vrai code est long
  // et contient toujours des chiffres : la condition écarte une phrase saisie
  // à la place, qui serait sinon envoyée à Firebase comme un code.
  const codeSeul = /^[A-Za-z0-9_-]{20,}$/.test(compact) && /\d/.test(compact)
  return codeSeul ? compact : undefined
}

/** Le lien canonique que Firebase sait lire, reconstruit à partir du code. */
export function lienDepuisSaisie(saisie: string): string {
  const code = codeDepuisSaisie(saisie)
  if (!code) return saisie.trim()
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey, mode: 'signIn', oobCode: code,
  })
  return `https://${firebaseConfig.authDomain}/__/auth/action?${params}`
}

/** Vrai si la saisie contient un code de connexion exploitable. */
export const saisieEstUnLien = (saisie: string) =>
  Boolean(codeDepuisSaisie(saisie)) && isSignInWithEmailLink(auth, lienDepuisSaisie(saisie))

export type CauseEchecLien = 'illisible' | 'expire' | 'email' | 'reseau' | 'autre'

/**
 * Traduit l'échec de Firebase en cause compréhensible. Sans cela, un lien
 * parfaitement valide mais déjà utilisé serait annoncé comme « invalide », et
 * l'utilisateur recommencerait indéfiniment la même manipulation.
 */
export function causeEchecLien(erreur: unknown): CauseEchecLien {
  const code = (erreur as { code?: string })?.code ?? ''
  if (code.includes('invalid-action-code') || code.includes('expired-action-code')) return 'expire'
  if (code.includes('invalid-email') || code.includes('user-disabled')) return 'email'
  if (code.includes('network-request-failed')) return 'reseau'
  if (code.includes('argument-error')) return 'illisible'
  return 'autre'
}

/**
 * Termine la connexion après un clic sur le lien reçu par email — ou à partir
 * d'un lien collé à la main, quand l'application installée ne peut pas
 * recevoir l'ouverture du lien elle-même.
 */
export async function terminerConnexionParEmail(
  emailSaisi?: string, lienColle?: string,
): Promise<User> {
  const email = emailSaisi || emailMemorise()
  if (!email) throw new Error('Email manquant pour terminer la connexion.')
  const lien = lienColle ? lienDepuisSaisie(lienColle) : window.location.href
  const resultat = await signInWithEmailLink(auth, email, lien)
  localStorage.removeItem(CLE_EMAIL_ATTENTE)
  // Nettoie les paramètres techniques Firebase (oobCode, apiKey…) de l'URL.
  window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  return resultat.user
}

let verificateur: RecaptchaVerifier | undefined

/**
 * Envoie un code par SMS ; `conteneurId` doit être un élément vide présent
 * dans la page. Un reCAPTCHA déjà consommé ou en erreur ne peut pas resservir :
 * on le jette à chaque échec, sinon la deuxième tentative échoue toujours.
 */
export async function envoyerCodeSms(
  numero: string, conteneurId: string,
): Promise<ConfirmationResult> {
  verificateur ??= new RecaptchaVerifier(auth, conteneurId, { size: 'invisible' })
  try {
    return await signInWithPhoneNumber(auth, numero, verificateur)
  } catch (erreur) {
    try { verificateur.clear() } catch { /* déjà détruit */ }
    verificateur = undefined
    throw erreur
  }
}

export const seDeconnecter = () => signOut(auth)
