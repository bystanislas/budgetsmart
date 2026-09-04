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
 * Normalise ce que l'utilisateur colle : soit le lien complet copié depuis
 * l'email, soit le seul code de vérification qu'il contient. Dans ce second
 * cas on reconstitue le lien attendu par Firebase.
 */
export function lienDepuisSaisie(saisie: string): string {
  const v = saisie.trim()
  if (/^https?:\/\//i.test(v)) return v
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey, mode: 'signIn', oobCode: v,
  })
  return `https://${firebaseConfig.authDomain}/__/auth/action?${params}`
}

/** Vrai si la saisie est bien un lien de connexion exploitable. */
export const saisieEstUnLien = (saisie: string) =>
  isSignInWithEmailLink(auth, lienDepuisSaisie(saisie))

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
