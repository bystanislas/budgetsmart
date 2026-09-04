/**
 * Firebase : authentification et sauvegarde en ligne, en complément — jamais
 * en remplacement — du stockage local. L'app reste utilisable et rapide sans
 * connexion ; ceci sert uniquement à retrouver ses données sur un autre
 * appareil après une connexion (voir lib/auth.ts et lib/sync.ts).
 *
 * La clé ci-dessous identifie le projet, elle n'est pas secrète : c'est
 * exactement celle que la console Firebase donne à coller dans le code
 * client. La vraie protection des données est assurée par les règles de
 * sécurité Firestore (chaque utilisateur ne lit/écrit que son propre dossier
 * users/{uid}/…) et par Firebase Authentication.
 */
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator, initializeFirestore, persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

export const firebaseConfig = {
  apiKey: 'AIzaSyCPgEWgl76-2VRgc3sNfEatOoveRWgyhJY',
  authDomain: 'budget-smart-6bf90.firebaseapp.com',
  projectId: 'budget-smart-6bf90',
  storageBucket: 'budget-smart-6bf90.firebasestorage.app',
  messagingSenderId: '322312895693',
  appId: '1:322312895693:web:3df3041597bb9da10e3d84',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Cache persistant (IndexedDB) : Firestore lui-même sait fonctionner hors
// ligne et rejouer les écritures à la reconnexion, en plus de la base Dexie
// locale qui reste la source de vérité immédiate de l'application.
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  // Le modèle comporte beaucoup de champs facultatifs (sous-catégorie,
  // descriptif, tiers, compte…). Sans ceci, Firestore refuse tout document
  // dont un champ vaut `undefined` ; ils sont simplement omis, et relus comme
  // absents — exactement ce que le modèle attend.
  ignoreUndefinedProperties: true,
})

// Développement et tests : `VITE_FIREBASE_EMULATEURS=1 npm run build` branche
// l'application sur les émulateurs locaux, sans jamais toucher au vrai projet.
if (import.meta.env.VITE_FIREBASE_EMULATEURS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
}
