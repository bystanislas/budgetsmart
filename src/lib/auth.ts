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
import { auth } from './firebase'

const CLE_EMAIL_ATTENTE = 'budget-smart:email-connexion'

/** `undefined` tant que Firebase n'a pas encore répondu, `null` si déconnecté. */
export function useUtilisateur() {
  const [utilisateur, setUtilisateur] = useState<User | null | undefined>(undefined)
  useEffect(() => onAuthStateChanged(auth, setUtilisateur), [])
  return utilisateur
}

export async function envoyerLienConnexion(email: string) {
  const url = `${window.location.origin}${window.location.pathname}`
  await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true })
  localStorage.setItem(CLE_EMAIL_ATTENTE, email)
}

export const lienDeConnexionRecu = () => isSignInWithEmailLink(auth, window.location.href)

export const emailMemorise = () => localStorage.getItem(CLE_EMAIL_ATTENTE)

/** Termine la connexion après un clic sur le lien reçu par email. */
export async function terminerConnexionParEmail(emailSaisi?: string): Promise<User> {
  const email = emailSaisi || emailMemorise()
  if (!email) throw new Error('Email manquant pour terminer la connexion.')
  const resultat = await signInWithEmailLink(auth, email, window.location.href)
  localStorage.removeItem(CLE_EMAIL_ATTENTE)
  // Nettoie les paramètres techniques Firebase (oobCode, apiKey…) de l'URL.
  window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  return resultat.user
}

let verificateur: RecaptchaVerifier | undefined

/** Envoie un code par SMS ; `conteneurId` doit être un élément vide présent dans la page. */
export function envoyerCodeSms(numero: string, conteneurId: string): Promise<ConfirmationResult> {
  verificateur ??= new RecaptchaVerifier(auth, conteneurId, { size: 'invisible' })
  return signInWithPhoneNumber(auth, numero, verificateur)
}

export const seDeconnecter = () => signOut(auth)
