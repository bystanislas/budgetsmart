/**
 * Rapport PDF de Budget Smart.
 *
 * Un document prêt à imprimer ou à envoyer : bandeau de marque, indicateurs
 * de la période, puis les tableaux qui rendent chaque ligne vérifiable —
 * journal détaillé, dépenses par sous-catégorie, épargne, prêts et emprunts.
 */
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { saveAs } from 'file-saver'
import {
  APP_BRAND, APP_CONTACT, APP_NAME, MOIS, labelModule, labelType, sensDe,
} from '../data/refs'
import { db, getParametres } from '../db'
import {
  agregerAnnee, calculerDime, creances, detailEpargne, empruntsEnCours, estRealisee,
} from './compute'
import { fmt } from './money'
import { bornes, moisCouverts, type Periode } from './periode'
import type { Ecriture, Parametres } from '../types'

/* charte APEX, en RVB pour jsPDF */
const NAVY: [number, number, number] = [26, 53, 87]
const STEEL: [number, number, number] = [46, 84, 128]
const GOLD: [number, number, number] = [184, 134, 11]
const CREAM: [number, number, number] = [253, 246, 227]
const GREEN: [number, number, number] = [30, 107, 60]
const RED: [number, number, number] = [139, 26, 26]
const GRIS: [number, number, number] = [110, 118, 128]

const jour = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '')

/**
 * jsPDF n'embarque que les polices standard, limitées au jeu WinAnsi.
 * `toLocaleString('fr-FR')` sépare les milliers par une espace fine insécable
 * (U+202F) qui s'y imprime en « / » : on ramène ces caractères à leur
 * équivalent imprimable avant de les poser sur la page.
 */
const txt = (v: unknown): string =>
  String(v ?? '')
    .replace(/[\u202F\u00A0\u2009\u2007\u2008]/g, ' ')
    .replace(/[\u2192\u27A1\u279C]/g, '->')
    .replace(/[\u2190]/g, '<-')
    .replace(/\u2044/g, '/')

export async function exporterPdf(periode: Periode): Promise<string> {
  const p = await getParametres()
  const [toutes, comptes, plan] = await Promise.all([
    db.ecritures.orderBy('date').toArray(),
    db.comptes.orderBy('nom').toArray(),
    db.plan.toArray(),
  ])

  const b = bornes(periode)
  const ecritures = toutes.filter((e) => e.date >= b.debut && e.date <= b.fin)
  const nomCompte = (id?: string) => comptes.find((c) => c.id === id)?.nom ?? ''
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const L = doc.internal.pageSize.getWidth()

  const montant = (v: number) => txt(fmt(p, v))

  /* ------------------------------------------------------ bandeau titre */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, L, 26, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 26, L, 1.4, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(16)
  doc.text(APP_NAME, 14, 12)
  doc.setFont('helvetica', 'normal').setFontSize(8.5)
  doc.setTextColor(214, 188, 120)
  doc.text(APP_BRAND, 14, 17.5)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(11)
  doc.text(txt(b.libelle), L - 14, 12, { align: 'right' })
  doc.setFont('helvetica', 'normal').setFontSize(8)
  doc.text(`du ${jour(b.debut)} au ${jour(b.fin)}`, L - 14, 17.5, { align: 'right' })
  doc.text(txt(p.raisonSociale || 'Mon budget'), L - 14, 22, { align: 'right' })

  /* ------------------------------------------------------- indicateurs */
  const entree = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'entree'
  const sortie = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'sortie'
  const somme = (f: (e: Ecriture) => boolean) =>
    ecritures.filter(f).reduce((s, e) => s + e.montantBase, 0)

  const entrees = somme(entree)
  const sorties = somme(sortie)
  const epargne = somme((e) => estRealisee(e) && e.type === 'epargne')
  const cartes: { label: string; valeur: string; couleur: [number, number, number] }[] = [
    { label: 'ENTRÉES', valeur: montant(entrees), couleur: GREEN },
    { label: 'SORTIES', valeur: montant(sorties), couleur: RED },
    { label: 'SOLDE', valeur: montant(entrees - sorties), couleur: NAVY },
    { label: 'MIS DE CÔTÉ', valeur: montant(epargne), couleur: STEEL },
    { label: 'OPÉRATIONS', valeur: String(ecritures.length), couleur: GOLD },
  ]
  const largeur = (L - 28 - 4 * 4) / cartes.length
  cartes.forEach((c, i) => {
    const x = 14 + i * (largeur + 4)
    doc.setFillColor(...CREAM)
    doc.roundedRect(x, 33, largeur, 18, 2, 2, 'F')
    doc.setFillColor(...c.couleur)
    doc.rect(x, 33, largeur, 1.6, 'F')
    doc.setTextColor(...GRIS)
    doc.setFont('helvetica', 'bold').setFontSize(6.5)
    doc.text(c.label, x + 3, 39.5)
    doc.setTextColor(...c.couleur)
    doc.setFont('helvetica', 'bold').setFontSize(11)
    doc.text(txt(c.valeur), x + 3, 47)
  })

  let y = 58

  /* --------------------------------------------------------- fonctions */
  const styles = {
    headStyles: { fillColor: GOLD, textColor: [255, 255, 255] as [number, number, number],
      fontSize: 7.5, fontStyle: 'bold' as const, halign: 'center' as const },
    bodyStyles: { fontSize: 7.5, textColor: [64, 64, 64] as [number, number, number] },
    alternateRowStyles: { fillColor: [246, 248, 251] as [number, number, number] },
    footStyles: { fillColor: NAVY, textColor: [255, 255, 255] as [number, number, number],
      fontSize: 8, fontStyle: 'bold' as const },
    margin: { left: 14, right: 14, top: 20, bottom: 18 },
    theme: 'plain' as const,
  }

  const titre = (texte: string) => {
    if (y > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); y = 20 }
    doc.setFillColor(...NAVY)
    doc.rect(14, y - 5, L - 28, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold').setFontSize(9)
    doc.text(txt(texte).toUpperCase(), 17, y - 0.2)
    y += 6
  }

  const bloc = (
    entetes: string[], corps: (string | number)[][], pied?: (string | number)[],
    alignDroite: number[] = [],
  ) => {
    autoTable(doc, {
      ...styles,
      startY: y,
      head: [entetes.map(txt)],
      body: corps.map((l) => l.map(txt)),
      foot: pied ? [pied.map(txt)] : undefined,
      columnStyles: Object.fromEntries(
        alignDroite.map((i) => [i, { halign: 'right' as const }]),
      ),
      didDrawPage: () => { /* la pagination est peinte à la fin */ },
    })
    // @ts-expect-error — autotable pose lastAutoTable sur le document
    y = (doc.lastAutoTable?.finalY ?? y) + 10
  }

  /* ------------------------------------------------------- 1. synthèse */
  const mensuel = agregerAnnee(p, toutes, plan, periode.annee)
    .filter((m) => moisCouverts(periode).includes(m.mois))
  titre('Synthèse de la période')
  bloc(
    ['Mois', 'Entrées', 'Dépenses', 'Épargne', 'Invest.', 'Rembours.', 'Prêts',
      'Total sorties', 'Solde', 'Trésorerie', 'Budget prévu', 'Écart'],
    mensuel.map((m) => [
      MOIS[m.mois - 1], montant(m.entrees), montant(m.depenses), montant(m.epargne),
      montant(m.investissement), montant(m.remboursement), montant(m.prets),
      montant(m.sorties), montant(m.solde), montant(m.cumul),
      montant(m.prevuDepenses), montant(m.ecartBudget),
    ]),
    ['TOTAL', montant(mensuel.reduce((s, m) => s + m.entrees, 0)),
      montant(mensuel.reduce((s, m) => s + m.depenses, 0)),
      montant(mensuel.reduce((s, m) => s + m.epargne, 0)),
      montant(mensuel.reduce((s, m) => s + m.investissement, 0)),
      montant(mensuel.reduce((s, m) => s + m.remboursement, 0)),
      montant(mensuel.reduce((s, m) => s + m.prets, 0)),
      montant(mensuel.reduce((s, m) => s + m.sorties, 0)),
      montant(mensuel.reduce((s, m) => s + m.solde, 0)),
      mensuel.length ? montant(mensuel[mensuel.length - 1].cumul) : montant(p.tresorerieInitiale),
      montant(mensuel.reduce((s, m) => s + m.prevuDepenses, 0)),
      montant(mensuel.reduce((s, m) => s + m.ecartBudget, 0))],
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  )

  /* ---------------------------------------- 2. dépenses par catégorie */
  const detail = new Map<string, { cat: string; sous: string; montant: number; nb: number }>()
  for (const e of ecritures) {
    if (!sortie(e)) continue
    const cle = `${e.categorie}|${e.sousCategorie ?? ''}`
    const cur = detail.get(cle)
      ?? { cat: e.categorie, sous: e.sousCategorie ?? '—', montant: 0, nb: 0 }
    cur.montant += e.montantBase
    cur.nb += 1
    detail.set(cle, cur)
  }
  const lignes = [...detail.values()].sort((a, c) => c.montant - a.montant)
  const totalCat = lignes.reduce((s, l) => s + l.montant, 0)
  if (lignes.length) {
    titre('Où part l’argent — par catégorie et sous-catégorie')
    bloc(
      ['Catégorie', 'Sous-catégorie', 'Montant', 'Part', 'Opérations', 'Moyenne'],
      lignes.map((l) => [
        l.cat, l.sous, montant(l.montant),
        totalCat ? `${((l.montant / totalCat) * 100).toFixed(1)} %` : '—',
        l.nb, montant(Math.round(l.montant / l.nb)),
      ]),
      ['TOTAL', '', montant(totalCat), '100 %',
        lignes.reduce((s, l) => s + l.nb, 0), ''],
      [2, 3, 4, 5],
    )
  }

  /* ---------------------------------------------------- 3. le journal */
  titre('Journal détaillé des opérations')
  bloc(
    ['Date', 'Type', 'Catégorie', 'Sous-catégorie', 'Descriptif', 'Tiers',
      'Entrée', 'Sortie', 'Compte', 'Statut'],
    ecritures.map((e) => [
      jour(e.date), labelType(e.type),
      e.module === 'general' ? e.categorie : `${labelModule(e.module)} · ${e.categorie}`,
      e.sousCategorie ?? '', e.descriptif ?? e.note ?? '', e.tiers ?? '',
      entree(e) ? montant(e.montantBase) : '',
      sortie(e) ? montant(e.montantBase) : '',
      nomCompte(e.compteCibleId) || nomCompte(e.compteId),
      e.statut === 'paye' ? '' : e.statut,
    ]),
    ['TOTAL', '', '', '', '', '', montant(entrees), montant(sorties), '', ''],
    [6, 7],
  )

  /* --------------------------------------------------- 4. mon épargne */
  const epargnes = detailEpargne(comptes, ecritures)
  if (epargnes.length) {
    titre('Mon épargne — où dort l’argent')
    bloc(
      ['Compte', 'Type', 'Établissement', 'Versé', 'Retiré', 'Solde', 'Bloqué jusqu’au'],
      epargnes.map((l) => [
        l.compte, l.nature, l.etablissement, montant(l.verse), montant(l.retire),
        montant(l.solde), jour(l.blocageJusqu) || '—',
      ]),
      ['TOTAL', '', '',
        montant(epargnes.reduce((s, l) => s + l.verse, 0)),
        montant(epargnes.reduce((s, l) => s + l.retire, 0)),
        montant(epargnes.reduce((s, l) => s + l.solde, 0)), ''],
      [3, 4, 5],
    )
  }

  /* ------------------------------------------- 5. prêts et emprunts */
  const aRecevoir = creances(toutes)
  const aRendre = empruntsEnCours(toutes)
  if (aRecevoir.length || aRendre.length) {
    titre('Prêts accordés et emprunts reçus')
    bloc(
      ['Sens', 'Tiers', 'Montant engagé', 'Déjà réglé', 'Reste', 'Dernière opération'],
      [
        ...aRecevoir.map((c) => ['Ils me doivent', c.tiers, montant(c.avance),
          montant(c.regle), montant(c.solde), jour(c.dernier)]),
        ...aRendre.map((d) => ['Je dois', d.tiers, montant(d.avance),
          montant(d.regle), montant(d.solde), jour(d.dernier)]),
      ],
      undefined,
      [2, 3, 4],
    )
  }

  /* ------------------------------------------------------- 6. la dîme */
  if (p.dimeActive) {
    titre('Dîme et offrandes')
    const mois = moisCouverts(periode)
    bloc(
      ['Mois', 'Revenus soumis', 'Dîme due', 'Déjà versée', 'Reste à verser'],
      mois.map((m) => {
        const d = calculerDime(p, toutes, periode.annee, m)
        return [MOIS[m - 1], montant(d.assiette), montant(d.due),
          montant(d.versee), montant(d.reste)]
      }),
      undefined,
      [1, 2, 3, 4],
    )
  }

  /* ------------------------------------------------------- pagination */
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    const H = doc.internal.pageSize.getHeight()
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.4)
    doc.line(14, H - 12, L - 14, H - 12)
    doc.setFont('helvetica', 'normal').setFontSize(7)
    doc.setTextColor(...GRIS)
    doc.text(`${APP_NAME} ${APP_BRAND} · ${APP_CONTACT}`, 14, H - 7.5)
    doc.text(txt(`${b.libelle} — page ${i} / ${pages}`), L - 14, H - 7.5, { align: 'right' })
  }

  const nom = `Budget-Smart-${b.cle}.pdf`
  saveAs(doc.output('blob'), nom)
  return nom
}

export type { Parametres }
