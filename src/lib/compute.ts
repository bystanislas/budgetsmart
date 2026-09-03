/**
 * Moteur de calcul — l'équivalent de la feuille « Calculs » du classeur.
 * Tout part des écritures ; rien n'est saisi deux fois.
 */
import { sensDe } from '../data/refs'
import { estDime } from '../data/concepts'
import type { Compte, Ecriture, LignePlan, ModuleId, Parametres, TypeOp } from '../types'

/** Une écriture compte dans le réalisé si elle n'est ni annulée ni seulement prévue. */
export const estRealisee = (e: Ecriture) => e.statut !== 'annule' && e.statut !== 'prevu'

export const moisDe = (e: Ecriture) => Number(e.date.slice(5, 7))
export const anneeDe = (e: Ecriture) => Number(e.date.slice(0, 4))

/** Filtre de périmètre : « général seul » par défaut, pour ne pas mélanger les modules. */
export function dansPerimetre(p: Parametres, e: Ecriture): boolean {
  if (p.perimetre === 'tout') return true
  if (p.perimetre === 'general') return e.module === 'general'
  return e.module === p.perimetre
}

export interface MoisAgrege {
  mois: number
  nom: string
  revenus: number
  emprunts: number
  remboursementsRecus: number
  entrees: number
  depenses: number
  epargne: number
  investissement: number
  remboursement: number
  prets: number
  sorties: number
  solde: number
  cumul: number
  tauxEpargne: number
  prevuDepenses: number
  ecartBudget: number
}

/**
 * Repère technique : l'agrégat porte un indice de mois, jamais un libellé.
 * Le nom affiché vient de la langue courante, côté interface.
 */
const INDICE_MOIS = Array.from({ length: 12 }, (_, i) => String(i + 1))

export function agregerAnnee(
  p: Parametres, ecritures: Ecriture[], plan: LignePlan[], annee = p.anneeTravail,
): MoisAgrege[] {
  const vide = () => ({
    revenu: 0, depense: 0, epargne: 0, investissement: 0, remboursement: 0,
    pret: 0, emprunt: 0, remboursement_recu: 0,
  })
  const parMois = Array.from({ length: 12 }, vide)

  for (const e of ecritures) {
    if (anneeDe(e) !== annee || !estRealisee(e) || !dansPerimetre(p, e)) continue
    const bucket = parMois[moisDe(e) - 1]
    if (!bucket || e.type === 'transfert') continue
    bucket[e.type] += e.montantBase
  }

  const prevu = Array.from({ length: 12 }, () => 0)
  for (const l of plan) {
    if (l.annee !== annee || l.type !== 'depense') continue
    if (p.perimetre === 'general' && l.module !== 'general') continue
    if (p.perimetre !== 'general' && p.perimetre !== 'tout' && l.module !== p.perimetre) continue
    l.mois.forEach((v, i) => { prevu[i] += v || 0 })
  }

  let cumul = p.tresorerieInitiale
  return parMois.map((b, i) => {
    // Un emprunt reçu n'est pas un revenu, mais il entre bien en caisse ;
    // un prêt accordé n'est pas une dépense, mais il en sort. On distingue les deux.
    const entrees = b.revenu + b.emprunt + b.remboursement_recu
    const sorties = b.depense + b.epargne + b.investissement + b.remboursement + b.pret
    const solde = entrees - sorties
    cumul += solde
    return {
      mois: i + 1,
      nom: INDICE_MOIS[i],
      revenus: b.revenu,
      emprunts: b.emprunt,
      remboursementsRecus: b.remboursement_recu,
      entrees,
      depenses: b.depense,
      epargne: b.epargne,
      investissement: b.investissement,
      remboursement: b.remboursement,
      prets: b.pret,
      sorties,
      solde,
      cumul,
      tauxEpargne: b.revenu ? (b.epargne + b.investissement) / b.revenu : 0,
      prevuDepenses: prevu[i],
      ecartBudget: prevu[i] - b.depense,
    }
  })
}

/** Sorties par module et par mois — sert aux graphiques de chaque module. */
export function parModule(ecritures: Ecriture[], annee: number): Record<ModuleId, number[]> {
  const out: Record<ModuleId, number[]> = {
    general: Array(12).fill(0), mariage: Array(12).fill(0),
    immobilier: Array(12).fill(0), business: Array(12).fill(0),
  }
  for (const e of ecritures) {
    if (anneeDe(e) !== annee || !estRealisee(e)) continue
    if (sensDe(e.type) !== 'sortie') continue
    out[e.module][moisDe(e) - 1] += e.montantBase
  }
  return out
}

export interface LigneCategorie { categorie: string; module: ModuleId; montant: number }

export function parCategorie(
  p: Parametres, ecritures: Ecriture[], annee: number, mois?: number,
): LigneCategorie[] {
  const map = new Map<string, LigneCategorie>()
  for (const e of ecritures) {
    if (anneeDe(e) !== annee || !estRealisee(e) || !dansPerimetre(p, e)) continue
    if (mois && moisDe(e) !== mois) continue
    if (sensDe(e.type) !== 'sortie') continue
    const cle = `${e.module}|${e.categorie}`
    const cur = map.get(cle) ?? { categorie: e.categorie, module: e.module, montant: 0 }
    cur.montant += e.montantBase
    map.set(cle, cur)
  }
  return [...map.values()].sort((a, b) => b.montant - a.montant)
}

export interface Dime { assiette: number; due: number; versee: number; reste: number }

export function calculerDime(
  p: Parametres, ecritures: Ecriture[], annee: number, mois: number,
): Dime {
  if (!p.dimeActive) return { assiette: 0, due: 0, versee: 0, reste: 0 }
  let assiette = 0
  let versee = 0
  for (const e of ecritures) {
    if (anneeDe(e) !== annee || moisDe(e) !== mois || !estRealisee(e)) continue
    if (e.type === 'revenu') {
      const ok =
        p.dimeAssiette === 'tous' ||
        (p.dimeAssiette === 'salaire' && e.categorie === 'Salaire') ||
        (p.dimeAssiette === 'salaire_primes' &&
          (e.categorie === 'Salaire' || e.categorie === 'Prime / 13e mois'))
      if (ok) assiette += e.montantBase
    }
    // L'offrande n'est pas la dîme : seule la dîme éteint la dîme due,
    // quelle que soit la langue dans laquelle elle a été saisie.
    if (e.type === 'depense' && estDime(e.categorie)) versee += e.montantBase
  }
  const due = Math.round(assiette * p.dimeTaux)
  return { assiette, due, versee, reste: Math.max(0, due - versee) }
}

/** Solde d'un compte : ouverture + entrées − sorties. Les transferts sont neutres. */
export function soldeCompte(compteId: string, ouverture: number, ecritures: Ecriture[]): number {
  let s = ouverture
  for (const e of ecritures) {
    if (e.compteId !== compteId || !estRealisee(e)) continue
    const sens = sensDe(e.type)
    if (sens === 'entree') s += e.montantBase
    else if (sens === 'sortie') s -= e.montantBase
  }
  return s
}

/** Total réalisé rattaché à un élément (bien, projet, objectif, crédit). */
export function totalRattache(
  ecritures: Ecriture[], id: string, filtre?: (e: Ecriture) => boolean,
): number {
  return ecritures
    .filter((e) => e.rattachement === id && estRealisee(e) && (!filtre || filtre(e)))
    .reduce((s, e) => s + e.montantBase, 0)
}

export const totalType = (ecritures: Ecriture[], id: string, ...types: TypeOp[]) =>
  totalRattache(ecritures, id, (e) => types.includes(e.type))

/** Mensualité d'un crédit (méthode des annuités constantes). */
export function mensualite(capital: number, tauxAnnuel: number, dureeMois: number): number {
  if (!capital || !dureeMois) return 0
  const i = tauxAnnuel / 12
  if (!i) return capital / dureeMois
  return (capital * i) / (1 - Math.pow(1 + i, -dureeMois))
}

export function capitalRestant(
  capital: number, tauxAnnuel: number, dureeMois: number, rembourse: number,
): number {
  const m = mensualite(capital, tauxAnnuel, dureeMois)
  if (!m) return Math.max(0, capital - rembourse)
  const n = Math.round(rembourse / m)
  const i = tauxAnnuel / 12
  if (!i) return Math.max(0, capital - rembourse)
  const f = Math.pow(1 + i, n)
  return Math.max(0, capital * f - m * ((f - 1) / i))
}

export interface Alerte {
  ton: 'ok' | 'attention' | 'grave' | 'neutre'
  /** Clé de traduction, résolue à l'affichage. */
  cle: string
  valeurs?: Record<string, string | number>
}

export function alertes(
  p: Parametres, mois: MoisAgrege, dime: Dime, tresorerie: number, nbEcritures: number,
): Alerte[] {
  const a: Alerte[] = []
  a.push(mois.solde < 0
    ? { ton: 'grave', cle: 'alertes.deficitaire' }
    : { ton: 'ok', cle: 'alertes.excedentaire' })
  a.push(mois.tauxEpargne < p.tauxEpargneCible
    ? {
      ton: 'attention',
      cle: 'alertes.epargneFaible',
      valeurs: {
        actuel: `${(mois.tauxEpargne * 100).toFixed(1)} %`,
        cible: `${(p.tauxEpargneCible * 100).toFixed(0)} %`,
      },
    }
    : { ton: 'ok', cle: 'alertes.epargneAtteinte' })
  if (!mois.prevuDepenses) {
    a.push({ ton: 'neutre', cle: 'alertes.aucunBudget' })
  } else if (mois.depenses > mois.prevuDepenses) {
    a.push({ ton: 'grave', cle: 'alertes.budgetDepasse' })
  } else if (mois.depenses > mois.prevuDepenses * p.seuilAlerte) {
    a.push({ ton: 'attention', cle: 'alertes.budgetProche' })
  } else {
    a.push({ ton: 'ok', cle: 'alertes.budgetTenu' })
  }
  if (p.dimeActive) {
    a.push(dime.reste > 0
      ? { ton: 'attention', cle: 'alertes.dimeReste', valeurs: { montant: dime.reste.toLocaleString() } }
      : { ton: 'ok', cle: 'alertes.dimeAJour' })
  }
  if (tresorerie < 0) a.push({ ton: 'grave', cle: 'alertes.tresorerieNegative' })
  else if (tresorerie < mois.depenses) a.push({ ton: 'attention', cle: 'alertes.tresorerieFaible' })
  else a.push({ ton: 'ok', cle: 'alertes.tresorerieConfortable' })
  if (!nbEcritures) a.push({ ton: 'neutre', cle: 'alertes.commencer' })
  return a
}

/* ------------------------------------------------ prêts et emprunts */
export interface Encours {
  tiers: string
  avance: number      // ce que j'ai prêté, ou ce que l'on m'a prêté
  regle: number       // ce qui a déjà été remboursé
  solde: number       // ce qui reste dû
  dernier: string     // date de la dernière opération
}

function cumulerParTiers(
  ecritures: Ecriture[], typesPlus: TypeOp[], typesMoins: TypeOp[],
): Encours[] {
  const map = new Map<string, Encours>()
  for (const e of ecritures) {
    if (!estRealisee(e)) continue
    const plus = typesPlus.includes(e.type)
    const moins = typesMoins.includes(e.type)
    if (!plus && !moins) continue
    const tiers = (e.tiers || e.sousCategorie || e.libelle || 'Non précisé').trim()
    const cur = map.get(tiers) ?? { tiers, avance: 0, regle: 0, solde: 0, dernier: e.date }
    if (plus) cur.avance += e.montantBase
    else cur.regle += e.montantBase
    cur.solde = cur.avance - cur.regle
    if (e.date > cur.dernier) cur.dernier = e.date
    map.set(tiers, cur)
  }
  return [...map.values()].sort((a, b) => b.solde - a.solde)
}

/** Ce que l'on me doit : prêts accordés moins remboursements reçus. */
export const creances = (ecritures: Ecriture[]) =>
  cumulerParTiers(ecritures, ['pret'], ['remboursement_recu'])

/** Ce que je dois à des tiers : emprunts reçus moins remboursements versés. */
export const empruntsEnCours = (ecritures: Ecriture[]) =>
  cumulerParTiers(ecritures.filter((e) => e.type !== 'remboursement' || Boolean(e.tiers)),
    ['emprunt'], ['remboursement'])

/** Détail d'une épargne : combien, où, et sur quel type de compte. */
export interface LigneEpargne {
  compte: string
  nature: string
  etablissement: string
  verse: number
  retire: number
  solde: number
  blocageJusqu?: string
}

export function detailEpargne(comptes: Compte[], ecritures: Ecriture[]): LigneEpargne[] {
  return comptes
    .filter((c) => ['epargne', 'bloque'].includes(c.nature))
    .map((c) => {
      let verse = 0
      let retire = 0
      for (const e of ecritures) {
        if (!estRealisee(e)) continue
        if (e.compteCibleId === c.id || (e.type === 'epargne' && e.compteId === c.id)) {
          verse += e.montantBase
        } else if (e.compteId === c.id && sensDe(e.type) === 'sortie') {
          retire += e.montantBase
        }
      }
      return {
        compte: c.nom,
        nature: c.nature === 'bloque' ? 'Épargne bloquée' : 'Épargne disponible',
        etablissement: c.etablissement ?? '—',
        verse, retire,
        solde: c.soldeOuverture + verse - retire,
        blocageJusqu: c.blocageJusqu,
      }
    })
    .sort((a, b) => b.solde - a.solde)
}
