import Dexie, { type Table } from 'dexie'
import {
  CATEGORIES, DEVISES, EGLISE_DEFAUT, MOYENS, SOUS_CATEGORIES,
} from './data/refs'
import type {
  Compte, Dette, Ecriture, LignePlan, Objectif, Parametres, Poste, Recurrent,
} from './types'

/** Base locale de Budget Smart, distincte de celle de Cybastion Hub. */
export class BudgetDB extends Dexie {
  ecritures!: Table<Ecriture, string>
  comptes!: Table<Compte, string>
  plan!: Table<LignePlan, string>
  postes!: Table<Poste, string>
  objectifs!: Table<Objectif, string>
  dettes!: Table<Dette, string>
  recurrents!: Table<Recurrent, string>
  parametres!: Table<Parametres, string>

  constructor() {
    super('budget-smart')
    this.version(1).stores({
      ecritures: 'id, date, type, module, categorie, statut, rattachement, compteId, updatedAt',
      comptes: 'id, nom, nature, updatedAt',
      plan: 'id, annee, module, type, categorie, updatedAt',
      postes: 'id, module, nom, updatedAt',
      objectifs: 'id, nom, module, updatedAt',
      dettes: 'id, nom, updatedAt',
      recurrents: 'id, libelle, module, actif, prochaineEcheance, updatedAt',
      parametres: 'id',
    })
  }
}

export const db = new BudgetDB()

export const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

export const now = () => new Date().toISOString()

export function stamp<T extends object>(v: T): T & { createdAt: string; updatedAt: string } {
  const t = now()
  return { createdAt: t, updatedAt: t, ...(v as object) } as T & {
    createdAt: string; updatedAt: string
  }
}

const COURS_DEFAUT = Object.fromEntries(DEVISES.map(([code, , , taux]) => [code, taux]))

export const PARAMS_DEFAUT: Parametres = {
  id: 'app',
  raisonSociale: '', responsable: '', activite: '',
  adresse: '', ville: '', pays: '', telephone: '', email: '', siteWeb: '',
  identifiant: '',
  deviseBase: 'XOF',
  cours: COURS_DEFAUT,
  anneeTravail: new Date().getFullYear(),
  moisSuivi: new Date().getMonth() + 1,
  tresorerieInitiale: 0,
  tauxEpargneCible: 0.2,
  seuilAlerte: 0.9,
  dimeActive: false,
  dimeTaux: 0.1,
  dimeAssiette: 'tous',
  perimetre: 'general',
  dimeEglise: EGLISE_DEFAUT,
  // Le référentiel livré n'est qu'un point de départ : il est recopié ici,
  // puis chacun le modifie depuis les paramètres.
  categories: structuredClone(CATEGORIES),
  sousCategories: structuredClone(SOUS_CATEGORIES),
  moyens: [...MOYENS],
  updatedAt: now(),
}

export async function getParametres(): Promise<Parametres> {
  const p = await db.parametres.get('app')
  if (p) {
    return {
      ...PARAMS_DEFAUT,
      ...p,
      cours: { ...COURS_DEFAUT, ...p.cours },
      // Un référentiel absent (base créée avant cette version) est réamorcé ;
      // un référentiel présent est respecté tel quel, y compris les suppressions.
      categories: p.categories ?? PARAMS_DEFAUT.categories,
      sousCategories: p.sousCategories ?? PARAMS_DEFAUT.sousCategories,
      moyens: p.moyens ?? PARAMS_DEFAUT.moyens,
    }
  }
  await db.parametres.put(PARAMS_DEFAUT)
  return PARAMS_DEFAUT
}

export async function majParametres(patch: Partial<Parametres>) {
  const p = await getParametres()
  const next = { ...p, ...patch, updatedAt: now() }
  await db.parametres.put(next)
  return next
}

/** Comptes proposés au premier lancement : on peut démarrer sans rien configurer. */
export async function amorcer() {
  await getParametres()
  if ((await db.comptes.count()) === 0) {
    const base = [
      { nom: 'Compte courant', nature: 'courant' as const },
      { nom: 'Mobile Money', nature: 'mobile' as const },
      { nom: 'Espèces', nature: 'especes' as const },
      { nom: 'Épargne', nature: 'epargne' as const },
    ]
    await db.comptes.bulkPut(
      base.map((c) => stamp({ id: uid(), soldeOuverture: 0, ...c })),
    )
  }
}
