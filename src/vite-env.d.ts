/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** « 1 » branche l'application sur les émulateurs Firebase locaux. */
  readonly VITE_FIREBASE_EMULATEURS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
