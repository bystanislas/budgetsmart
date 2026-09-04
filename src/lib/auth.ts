/**
 * Connexion sans mot de passe : lien reçu par email, ou code reçu par SMS.
 * Les deux mènent au même compte Firebase, utilisé comme identifiant pour
 * retrouver ses données sur n'importe quel appareil (voir lib/sync.ts).
 */
import { useEffect, useState } from 'react'
import {
  type ConfirmationResult, type User,
  GoogleAuthProvider, RecaptchaVerifier, getRedirectResult, isSignInWithEmailLink,
  onAuthStateChanged, sendSignInLinkToEmail, signInWithEmailLink, signInWithPhoneNumber,
  signInWithPopup, signInWithRedirect, signOut,
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

/* ------------------------------------------------------ compte Google */

/**
 * Connexion en un geste pour qui possède une adresse Gmail — c'est-à-dire la
 * plupart des gens. Rien à recopier, rien à attendre dans une boîte mail :
 * c'est le chemin le plus sûr, et de loin, depuis une application installée
 * sur l'écran d'accueil.
 *
 * La fenêtre surgissante est privilégiée : elle garde la session dans la
 * page qui l'a ouverte. Quand le navigateur la refuse — ce qui arrive sur
 * iPhone en mode application installée —, on bascule sur une redirection de
 * la page elle-même, dont le résultat est relu au démarrage suivant.
 */
export async function connexionGoogle(): Promise<User | null> {
  const fournisseur = new GoogleAuthProvider()
  // Redemande le choix du compte : sur un téléphone partagé, enchaîner sur le
  // compte précédent sans rien demander serait une mauvaise surprise.
  fournisseur.setCustomParameters({ prompt: 'select_account' })
  try {
    const resultat = await signInWithPopup(auth, fournisseur)
    return resultat.user
  } catch (erreur) {
    const code = (erreur as { code?: string })?.code ?? ''
    const fenetreRefusee = code.includes('popup-blocked')
      || code.includes('popup-closed-by-user')
      || code.includes('operation-not-supported-in-this-environment')
      || code.includes('cancelled-popup-request')
    if (!fenetreRefusee) throw erreur
    if (code.includes('popup-closed-by-user')) return null
    await signInWithRedirect(auth, fournisseur)
    return null // la page part vers Google ; la suite se joue au retour
  }
}

/** Relit le retour d'une connexion par redirection. Sans effet dans les autres cas. */
export async function finaliserRedirection(): Promise<User | null> {
  try {
    return (await getRedirectResult(auth))?.user ?? null
  } catch {
    return null
  }
}

/** Vrai lorsque le fournisseur Google n'est pas activé côté projet Firebase. */
export const googleIndisponible = (erreur: unknown) =>
  ((erreur as { code?: string })?.code ?? '').includes('operation-not-allowed')

export const seDeconnecter = () => signOut(auth)
