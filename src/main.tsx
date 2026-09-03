import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { amorcer } from './db'
import { activerSyncSurEcriture } from './lib/sync-hooks'
import './index.css'

/** Amorçage : référentiel de base puis stockage persistant, pour ne rien perdre hors ligne. */
async function demarrer() {
  // Sans compte connecté, ces crochets ne déclenchent rien : la sauvegarde en
  // ligne ne démarre qu'une fois un utilisateur identifié (voir lib/sync.ts).
  activerSyncSurEcriture()
  await amorcer()
  try {
    if (navigator.storage?.persist) await navigator.storage.persist()
  } catch {
    /* le navigateur peut refuser : ce n'est pas bloquant */
  }
}

void demarrer().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>,
  )
})
