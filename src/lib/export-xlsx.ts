/**
 * Export Excel de Budget Smart.
 *
 * On régénère un classeur aux couleurs APEX à partir des données locales :
 * mêmes libellés que la version bureautique, mais alimentés par ce qui a
 * réellement été saisi, et bornés à la période demandée (jour, mois,
 * trimestre ou année).
 */
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  APP_BRAND, APP_CONTACT, APP_NAME, APP_SIGNATURE, CAT_DIME, MOIS,
  labelModule, labelType, sensDe,
} from '../data/refs'
import { db, getParametres } from '../db'
import {
  agregerAnnee, calculerDime, creances, detailEpargne, empruntsEnCours, estRealisee,
  mensualite, parCategorie, soldeCompte, totalRattache,
} from './compute'
import { symboleDevise } from './money'
import { bornes, moisCouverts, type Periode } from './periode'
import type { Ecriture, Parametres } from '../types'

/* ------------------------------------------------------------- charte */
const NAVY = 'FF1A3557'
const STEEL = 'FF2E5480'
const GOLD = 'FFB8860B'
const CREAM = 'FFFDF6E3'
const LINE = 'FFD9DFE7'
const ZEBRA = 'FFF6F8FB'
const GREEN = 'FF1E6B3C'
const RED = 'FF8B1A1A'
const BLANC = 'FFFFFFFF'

type Cellule = string | number | Date | null | undefined

interface Colonne {
  entete: string
  largeur?: number
  format?: 'texte' | 'montant' | 'nombre' | 'pourcent' | 'date'
}

const FORMATS = {
  texte: undefined,
  montant: '#,##0;[Red]-#,##0;—',
  nombre: '#,##0.##',
  pourcent: '0.0 %',
  date: 'dd/mm/yyyy',
} as const

const police = (taille = 10, gras = false, couleur = 'FF404040') =>
  ({ name: 'Arial', size: taille, bold: gras, color: { argb: couleur } })

const fond = (argb: string) =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb } }) as ExcelJS.Fill

/** Bandeau de marque : titre, période, filet doré. Toujours les trois mêmes lignes. */
function bandeau(ws: ExcelJS.Worksheet, titre: string, sousTitre: string, n: number) {
  ws.mergeCells(1, 1, 1, n)
  const t = ws.getRow(1).getCell(1)
  t.value = `${titre}`
  t.font = police(15, true, BLANC)
  t.fill = fond(NAVY)
  t.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(1).height = 30

  ws.mergeCells(2, 1, 2, n)
  const s = ws.getRow(2).getCell(1)
  s.value = sousTitre
  s.font = police(9, false, NAVY)
  s.fill = fond(CREAM)
  s.alignment = { vertical: 'middle', indent: 1 }
  ws.getRow(2).height = 18

  ws.mergeCells(3, 1, 3, n)
  ws.getRow(3).getCell(1).fill = fond(GOLD)
  ws.getRow(3).height = 3
}

/** Tableau standard : en-têtes dorés, zébrures, ligne de total bleu nuit. */
function tableau(
  ws: ExcelJS.Worksheet, titre: string, sousTitre: string,
  colonnes: Colonne[], lignes: Cellule[][], total?: Cellule[],
) {
  const n = Math.max(colonnes.length, 1)
  bandeau(ws, titre, sousTitre, n)

  const entetes = ws.getRow(5)
  colonnes.forEach((c, i) => {
    const cell = entetes.getCell(i + 1)
    cell.value = c.entete
    cell.font = police(9, true, BLANC)
    cell.fill = fond(GOLD)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    ws.getColumn(i + 1).width = c.largeur ?? 16
  })
  entetes.height = 24

  const cadrer = (c: Colonne) => ({
    vertical: 'middle' as const,
    horizontal: (c.format && c.format !== 'texte' ? 'right' : 'left') as 'right' | 'left',
    indent: c.format && c.format !== 'texte' ? 0 : 1,
    wrapText: false,
  })

  lignes.forEach((ligne, r) => {
    const row = ws.getRow(6 + r)
    colonnes.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      cell.value = ligne[i] ?? null
      cell.font = police()
      const f = FORMATS[c.format ?? 'texte']
      if (f) cell.numFmt = f
      cell.alignment = cadrer(c)
      cell.border = { bottom: { style: 'hair', color: { argb: LINE } } }
      if (r % 2 === 1) cell.fill = fond(ZEBRA)
    })
  })

  if (total) {
    const row = ws.getRow(6 + lignes.length)
    row.height = 20
    colonnes.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      cell.value = total[i] ?? null
      cell.font = police(10, true, BLANC)
      cell.fill = fond(NAVY)
      const f = FORMATS[c.format ?? 'texte']
      if (f) cell.numFmt = f
      cell.alignment = cadrer(c)
    })
  }

  ws.views = [{ state: 'frozen', ySplit: 5 }]
  if (lignes.length) {
    ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: n } }
  }
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
}

/** Feuille « libellé / valeur », pour les paramètres et les fiches. */
function fiche(
  ws: ExcelJS.Worksheet, titre: string, sousTitre: string,
  blocs: { titre: string; lignes: [string, Cellule, Colonne['format']?][] }[],
) {
  ws.getColumn(1).width = 36
  ws.getColumn(2).width = 34
  bandeau(ws, titre, sousTitre, 2)

  let r = 5
  for (const bloc of blocs) {
    ws.mergeCells(r, 1, r, 2)
    const h = ws.getRow(r).getCell(1)
    h.value = bloc.titre
    h.font = police(10, true, BLANC)
    h.fill = fond(STEEL)
    h.alignment = { vertical: 'middle', indent: 1 }
    ws.getRow(r).height = 19
    r += 1

    for (const [label, valeur, format] of bloc.lignes) {
      const row = ws.getRow(r)
      const a = row.getCell(1)
      a.value = label
      a.font = police(10, true, NAVY)
      a.alignment = { vertical: 'middle', indent: 1 }
      a.border = { bottom: { style: 'hair', color: { argb: LINE } } }
      const b = row.getCell(2)
      b.value = valeur ?? null
      b.font = police()
      const f = FORMATS[format ?? 'texte']
      if (f) b.numFmt = f
      b.alignment = {
        vertical: 'middle',
        horizontal: format && format !== 'texte' ? 'right' : 'left',
        indent: format && format !== 'texte' ? 0 : 1,
      }
      b.border = { bottom: { style: 'hair', color: { argb: LINE } } }
      r += 1
    }
    r += 1
  }
}

/** Bandeau d'indicateurs : quatre cartes colorées en haut d'une feuille. */
function indicateurs(
  ws: ExcelJS.Worksheet, ligne: number,
  cartes: { label: string; valeur: number; couleur: string }[],
) {
  cartes.forEach((c, i) => {
    const col = i * 3 + 1
    ws.mergeCells(ligne, col, ligne, col + 2)
    const t = ws.getRow(ligne).getCell(col)
    t.value = c.label.toUpperCase()
    t.font = police(8, true, BLANC)
    t.fill = fond(c.couleur)
    t.alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells(ligne + 1, col, ligne + 1, col + 2)
    const v = ws.getRow(ligne + 1).getCell(col)
    v.value = c.valeur
    v.numFmt = FORMATS.montant
    v.font = police(13, true, c.couleur)
    v.fill = fond(BLANC)
    v.alignment = { horizontal: 'center', vertical: 'middle' }
    v.border = {
      left: { style: 'thin', color: { argb: LINE } },
      right: { style: 'thin', color: { argb: LINE } },
      bottom: { style: 'thin', color: { argb: LINE } },
    }
  })
  ws.getRow(ligne).height = 16
  ws.getRow(ligne + 1).height = 26
}

const jour = (iso?: string) => (iso ? iso.split('-').reverse().join('/') : '')

/* ------------------------------------------------------------- export */
export async function exporterClasseur(periode: Periode): Promise<string> {
  const p = await getParametres()
  const [toutes, comptes, plan, postes, objectifs, dettes, recurrents] = await Promise.all([
    db.ecritures.orderBy('date').toArray(),
    db.comptes.orderBy('nom').toArray(),
    db.plan.toArray(),
    db.postes.toArray(),
    db.objectifs.toArray(),
    db.dettes.toArray(),
    db.recurrents.toArray(),
  ])

  const b = bornes(periode)
  const annee = periode.annee
  const ecritures = toutes.filter((e) => e.date >= b.debut && e.date <= b.fin)
  const nomCompte = (id?: string) => comptes.find((c) => c.id === id)?.nom ?? ''

  const wb = new ExcelJS.Workbook()
  wb.creator = `${APP_NAME} ${APP_BRAND}`
  wb.company = 'APEX AFRICA'
  wb.created = new Date()
  wb.title = `${APP_NAME} — ${b.libelle}`
  wb.description = APP_SIGNATURE

  const devise = `${p.deviseBase} (${symboleDevise(p.deviseBase)})`
  const entete = `${APP_NAME} ${APP_BRAND}`
  const contexte = `${p.raisonSociale || 'Mon budget'} · ${b.libelle} · `
    + `du ${jour(b.debut)} au ${jour(b.fin)} · montants en ${devise}`

  const entree = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'entree'
  const sortie = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'sortie'
  const somme = (f: (e: Ecriture) => boolean) =>
    ecritures.filter(f).reduce((s, e) => s + e.montantBase, 0)

  const totalEntrees = somme(entree)
  const totalSorties = somme(sortie)
  const totalEpargne = somme((e) => estRealisee(e) && e.type === 'epargne')

  /* 1. Synthèse -------------------------------------------------------- */
  const ws = wb.addWorksheet('Synthèse', { properties: { tabColor: { argb: NAVY } } })
  const mensuel = agregerAnnee(p, toutes, plan, annee).filter(
    (m) => moisCouverts(periode).includes(m.mois),
  )
  const colsSynth: Colonne[] = [
    { entete: 'Mois', largeur: 14 },
    { entete: 'Entrées', largeur: 15, format: 'montant' },
    { entete: 'dont revenus', largeur: 15, format: 'montant' },
    { entete: 'dont emprunts', largeur: 15, format: 'montant' },
    { entete: 'Dépenses', largeur: 15, format: 'montant' },
    { entete: 'Épargne', largeur: 14, format: 'montant' },
    { entete: 'Investissement', largeur: 15, format: 'montant' },
    { entete: 'Remboursements', largeur: 15, format: 'montant' },
    { entete: 'Prêts accordés', largeur: 15, format: 'montant' },
    { entete: 'Total sorties', largeur: 15, format: 'montant' },
    { entete: 'Solde', largeur: 15, format: 'montant' },
    { entete: 'Trésorerie cumulée', largeur: 17, format: 'montant' },
    { entete: 'Budget prévu', largeur: 15, format: 'montant' },
    { entete: 'Écart', largeur: 14, format: 'montant' },
    { entete: 'Taux d’épargne', largeur: 14, format: 'pourcent' },
  ]
  tableau(ws, entete, contexte, colsSynth, [], undefined)

  // Les indicateurs prennent la place des lignes 5-6 : on redessine par-dessus.
  ws.spliceRows(5, 0, [], [], [])
  indicateurs(ws, 5, [
    { label: 'Entrées', valeur: totalEntrees, couleur: GREEN },
    { label: 'Sorties', valeur: totalSorties, couleur: RED },
    { label: 'Solde', valeur: totalEntrees - totalSorties, couleur: NAVY },
    { label: 'Mis de côté', valeur: totalEpargne, couleur: STEEL },
  ])

  const lignesSynth: Cellule[][] = mensuel.map((m) => [
    MOIS[m.mois - 1], m.entrees, m.revenus, m.emprunts, m.depenses, m.epargne,
    m.investissement, m.remboursement, m.prets, m.sorties, m.solde, m.cumul,
    m.prevuDepenses, m.ecartBudget, m.tauxEpargne,
  ])
  const cumule = (i: number) =>
    lignesSynth.reduce((s, l) => s + (typeof l[i] === 'number' ? (l[i] as number) : 0), 0)

  const entetes = ws.getRow(8)
  colsSynth.forEach((c, i) => {
    const cell = entetes.getCell(i + 1)
    cell.value = c.entete
    cell.font = police(9, true, BLANC)
    cell.fill = fond(GOLD)
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    ws.getColumn(i + 1).width = c.largeur ?? 16
  })
  entetes.height = 24
  lignesSynth.forEach((ligne, r) => {
    const row = ws.getRow(9 + r)
    colsSynth.forEach((c, i) => {
      const cell = row.getCell(i + 1)
      cell.value = ligne[i] ?? null
      cell.font = police()
      const f = FORMATS[c.format ?? 'texte']
      if (f) cell.numFmt = f
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.format && c.format !== 'texte' ? 'right' : 'left',
        indent: c.format && c.format !== 'texte' ? 0 : 1,
      }
      cell.border = { bottom: { style: 'hair', color: { argb: LINE } } }
      if (r % 2 === 1) cell.fill = fond(ZEBRA)
    })
    // Le solde du mois se lit d'un coup d'œil.
    const solde = row.getCell(11)
    solde.font = police(10, true, Number(ligne[10] ?? 0) < 0 ? RED : GREEN)
  })
  const totalRow = ws.getRow(9 + lignesSynth.length)
  totalRow.height = 20
  colsSynth.forEach((c, i) => {
    const cell = totalRow.getCell(i + 1)
    cell.value = i === 0 ? 'TOTAL PÉRIODE'
      : i === 11 ? (mensuel.length ? mensuel[mensuel.length - 1].cumul : p.tresorerieInitiale)
        : i === 14 ? null : cumule(i)
    cell.font = police(10, true, BLANC)
    cell.fill = fond(NAVY)
    const f = FORMATS[c.format ?? 'texte']
    if (f) cell.numFmt = f
    cell.alignment = {
      vertical: 'middle',
      horizontal: c.format && c.format !== 'texte' ? 'right' : 'left',
      indent: c.format && c.format !== 'texte' ? 0 : 1,
    }
  })
  ws.views = [{ state: 'frozen', ySplit: 8 }]

  /* 2. Journal --------------------------------------------------------- */
  tableau(
    wb.addWorksheet('Journal'),
    'Journal des opérations', contexte,
    [
      { entete: 'Date', largeur: 12, format: 'date' },
      { entete: 'Module', largeur: 16 },
      { entete: 'Type', largeur: 20 },
      { entete: 'Catégorie', largeur: 26 },
      { entete: 'Sous-catégorie', largeur: 20 },
      { entete: 'Descriptif — à quoi ça a servi', largeur: 38 },
      { entete: 'Tiers', largeur: 18 },
      { entete: 'Entrée', largeur: 14, format: 'montant' },
      { entete: 'Sortie', largeur: 14, format: 'montant' },
      { entete: 'Devise saisie', largeur: 11 },
      { entete: 'Montant saisi', largeur: 13, format: 'nombre' },
      { entete: 'Compte', largeur: 18 },
      { entete: 'Compte destination', largeur: 18 },
      { entete: 'Moyen', largeur: 16 },
      { entete: 'Nature', largeur: 13 },
      { entete: 'Statut', largeur: 11 },
    ],
    ecritures.map((e) => {
      const sens = sensDe(e.type)
      const reel = estRealisee(e)
      return [
        new Date(e.date), labelModule(e.module), labelType(e.type), e.categorie,
        e.sousCategorie ?? '', e.descriptif ?? e.note ?? '', e.tiers ?? '',
        reel && sens === 'entree' ? e.montantBase : null,
        reel && sens === 'sortie' ? e.montantBase : null,
        e.devise || p.deviseBase, e.montant,
        nomCompte(e.compteId), nomCompte(e.compteCibleId),
        e.moyen ?? '', e.nature ?? '', e.statut,
      ]
    }),
    ['TOTAL', '', '', '', '', '', '', totalEntrees, totalSorties],
  )

  /* 3. Dépenses par catégorie et sous-catégorie ------------------------- */
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
  const lignesDetail = [...detail.values()].sort((a, b2) => b2.montant - a.montant)
  const totalDetail = lignesDetail.reduce((s, l) => s + l.montant, 0)
  tableau(
    wb.addWorksheet('Par catégorie'),
    'Où part l’argent', contexte,
    [
      { entete: 'Catégorie', largeur: 30 },
      { entete: 'Sous-catégorie', largeur: 24 },
      { entete: 'Montant', largeur: 16, format: 'montant' },
      { entete: 'Part', largeur: 11, format: 'pourcent' },
      { entete: 'Opérations', largeur: 11, format: 'nombre' },
      { entete: 'Moyenne', largeur: 15, format: 'montant' },
    ],
    lignesDetail.map((l) => [
      l.cat, l.sous, l.montant, totalDetail ? l.montant / totalDetail : 0,
      l.nb, Math.round(l.montant / l.nb),
    ]),
    ['TOTAL', '', totalDetail, totalDetail ? 1 : 0,
      lignesDetail.reduce((s, l) => s + l.nb, 0), null],
  )

  /* 4. Épargne ---------------------------------------------------------- */
  const epargnes = detailEpargne(comptes, ecritures)
  if (epargnes.length) {
    tableau(
      wb.addWorksheet('Épargne'),
      'Mon épargne — où dort l’argent', contexte,
      [
        { entete: 'Compte', largeur: 24 },
        { entete: 'Type', largeur: 18 },
        { entete: 'Établissement', largeur: 24 },
        { entete: 'Versé sur la période', largeur: 18, format: 'montant' },
        { entete: 'Retiré', largeur: 15, format: 'montant' },
        { entete: 'Solde', largeur: 16, format: 'montant' },
        { entete: 'Bloqué jusqu’au', largeur: 15 },
      ],
      epargnes.map((l) => [
        l.compte, l.nature, l.etablissement, l.verse, l.retire, l.solde, jour(l.blocageJusqu),
      ]),
      ['TOTAL', '', '',
        epargnes.reduce((s, l) => s + l.verse, 0),
        epargnes.reduce((s, l) => s + l.retire, 0),
        epargnes.reduce((s, l) => s + l.solde, 0), ''],
    )
  }

  /* 5. Prêts et emprunts ------------------------------------------------ */
  const aRecevoir = creances(toutes)
  const aRendre = empruntsEnCours(toutes)
  if (aRecevoir.length || aRendre.length) {
    const wsPret = wb.addWorksheet('Prêts & emprunts')
    tableau(
      wsPret, 'Prêts accordés et emprunts reçus',
      `${contexte} — encours calculé sur tout l’historique`,
      [
        { entete: 'Sens', largeur: 20 },
        { entete: 'Tiers', largeur: 26 },
        { entete: 'Montant engagé', largeur: 17, format: 'montant' },
        { entete: 'Déjà réglé', largeur: 16, format: 'montant' },
        { entete: 'Reste', largeur: 16, format: 'montant' },
        { entete: 'Dernière opération', largeur: 17 },
      ],
      [
        ...aRecevoir.map((c) => ['Ils me doivent', c.tiers, c.avance, c.regle, c.solde, jour(c.dernier)]),
        ...aRendre.map((d) => ['Je dois', d.tiers, d.avance, d.regle, d.solde, jour(d.dernier)]),
      ] as Cellule[][],
      ['TOTAL', '',
        aRecevoir.reduce((s, c) => s + c.avance, 0) + aRendre.reduce((s, d) => s + d.avance, 0),
        aRecevoir.reduce((s, c) => s + c.regle, 0) + aRendre.reduce((s, d) => s + d.regle, 0),
        aRecevoir.reduce((s, c) => s + c.solde, 0) - aRendre.reduce((s, d) => s + d.solde, 0),
        ''],
    )
  }

  /* 6. Dîme -------------------------------------------------------------- */
  if (p.dimeActive) {
    const mois = moisCouverts(periode)
    tableau(
      wb.addWorksheet('Dîme'), 'Dîme et offrandes', contexte,
      [
        { entete: 'Mois', largeur: 16 },
        { entete: 'Revenus soumis', largeur: 18, format: 'montant' },
        { entete: 'Dîme due', largeur: 16, format: 'montant' },
        { entete: 'Déjà versée', largeur: 16, format: 'montant' },
        { entete: 'Reste à verser', largeur: 16, format: 'montant' },
      ],
      mois.map((m) => {
        const d = calculerDime(p, toutes, annee, m)
        return [MOIS[m - 1], d.assiette, d.due, d.versee, d.reste]
      }),
      ['TOTAL',
        ...[0, 1, 2, 3].map((k) => mois.reduce((s, m) => {
          const d = calculerDime(p, toutes, annee, m)
          return s + [d.assiette, d.due, d.versee, d.reste][k]
        }, 0)),
      ],
    )
  }

  /* 7. Estimation annuelle ---------------------------------------------- */
  const lignesPlan = plan.filter((l) => l.annee === annee)
  if (lignesPlan.length) {
    const mois = moisCouverts(periode)
    tableau(
      wb.addWorksheet('Estimation'),
      'Estimation annuelle des budgets', contexte,
      [
        { entete: 'Module', largeur: 16 },
        { entete: 'Type', largeur: 16 },
        { entete: 'Catégorie', largeur: 30 },
        ...mois.map((m) => ({ entete: MOIS[m - 1], largeur: 13, format: 'montant' as const })),
        { entete: 'Total période', largeur: 15, format: 'montant' as const },
        { entete: 'Commentaire', largeur: 26 },
      ],
      lignesPlan.map((l) => [
        labelModule(l.module), labelType(l.type), l.categorie,
        ...mois.map((m) => l.mois[m - 1] || null),
        mois.reduce((s, m) => s + (l.mois[m - 1] || 0), 0),
        l.commentaire ?? '',
      ]),
      ['TOTAL', '', '',
        ...mois.map((m) => lignesPlan.reduce((s, l) => s + (l.mois[m - 1] || 0), 0)),
        lignesPlan.reduce((s, l) => s + mois.reduce((a, m) => a + (l.mois[m - 1] || 0), 0), 0),
        ''],
    )
  }

  /* 8. Modules ---------------------------------------------------------- */
  for (const m of ['mariage', 'immobilier', 'business'] as const) {
    const liste = postes.filter((x) => x.module === m)
    if (!liste.length) continue
    const retenu = (x: (typeof liste)[number]) =>
      (x.devisRetenu >= 0 ? x.devis[x.devisRetenu] : x.estimation) || 0
    tableau(
      wb.addWorksheet(labelModule(m).slice(0, 31)),
      labelModule(m), contexte,
      [
        { entete: 'Poste', largeur: 30 },
        { entete: 'Catégorie', largeur: 26 },
        { entete: 'Estimation', largeur: 15, format: 'montant' },
        { entete: 'Budget retenu', largeur: 15, format: 'montant' },
        { entete: 'Réalisé', largeur: 15, format: 'montant' },
        { entete: 'Reste à payer', largeur: 15, format: 'montant' },
        { entete: 'Avancement', largeur: 13, format: 'pourcent' },
        { entete: 'Prestataire', largeur: 22 },
        { entete: 'Échéance', largeur: 13 },
      ],
      liste.map((x) => {
        const budget = retenu(x)
        const realise = totalRattache(toutes, x.id)
        return [
          x.nom, x.categorie ?? '', x.estimation, budget, realise,
          Math.max(0, budget - realise), budget ? realise / budget : 0,
          x.prestataire ?? '', jour(x.echeance),
        ]
      }),
      ['TOTAL', '',
        liste.reduce((s, x) => s + x.estimation, 0),
        liste.reduce((s, x) => s + retenu(x), 0),
        liste.reduce((s, x) => s + totalRattache(toutes, x.id), 0),
        liste.reduce((s, x) => s + Math.max(0, retenu(x) - totalRattache(toutes, x.id)), 0),
      ],
    )
  }

  /* 9. Objectifs, crédits, récurrents ------------------------------------ */
  if (objectifs.length) {
    tableau(
      wb.addWorksheet('Objectifs'), 'Objectifs d’épargne', contexte,
      [
        { entete: 'Objectif', largeur: 30 },
        { entete: 'Module', largeur: 18 },
        { entete: 'Cible', largeur: 16, format: 'montant' },
        { entete: 'Constitué', largeur: 16, format: 'montant' },
        { entete: 'Reste', largeur: 16, format: 'montant' },
        { entete: 'Avancement', largeur: 13, format: 'pourcent' },
        { entete: 'Échéance', largeur: 13 },
      ],
      objectifs.map((o) => {
        const acquis = totalRattache(toutes, o.id)
        return [
          o.nom, labelModule(o.module), o.cible, acquis,
          Math.max(0, o.cible - acquis), o.cible ? acquis / o.cible : 0, jour(o.echeance),
        ]
      }),
    )
  }

  if (dettes.length) {
    tableau(
      wb.addWorksheet('Crédits'), 'Crédits et dettes', contexte,
      [
        { entete: 'Crédit', largeur: 28 },
        { entete: 'Organisme', largeur: 22 },
        { entete: 'Capital', largeur: 16, format: 'montant' },
        { entete: 'Taux annuel', largeur: 12, format: 'pourcent' },
        { entete: 'Durée (mois)', largeur: 12, format: 'nombre' },
        { entete: 'Mensualité', largeur: 15, format: 'montant' },
        { entete: 'Déjà remboursé', largeur: 16, format: 'montant' },
        { entete: 'Reste dû', largeur: 16, format: 'montant' },
        { entete: '1re échéance', largeur: 13 },
      ],
      dettes.map((d) => {
        const paye = totalRattache(toutes, d.id)
        return [
          d.nom, d.organisme ?? '', d.capital, d.tauxAnnuel, d.dureeMois,
          Math.round(mensualite(d.capital, d.tauxAnnuel, d.dureeMois)),
          paye, Math.max(0, d.capital - paye), jour(d.premiereEcheance),
        ]
      }),
    )
  }

  if (recurrents.length) {
    tableau(
      wb.addWorksheet('Récurrents'), 'Opérations récurrentes', contexte,
      [
        { entete: 'Libellé', largeur: 30 },
        { entete: 'Module', largeur: 18 },
        { entete: 'Catégorie', largeur: 26 },
        { entete: 'Montant', largeur: 15, format: 'montant' },
        { entete: 'Devise', largeur: 10 },
        { entete: 'Fréquence', largeur: 16 },
        { entete: 'Prochaine échéance', largeur: 17 },
        { entete: 'Actif', largeur: 10 },
      ],
      recurrents.map((r) => [
        r.libelle, labelModule(r.module), r.categorie, r.montant,
        r.devise || p.deviseBase, r.frequence, jour(r.prochaineEcheance),
        r.actif ? 'Oui' : 'Non',
      ]),
    )
  }

  /* 10. Paramètres ------------------------------------------------------- */
  fiche(wb.addWorksheet('Paramètres'), entete, contexte, [
    {
      titre: 'Identité',
      lignes: [
        ['Raison sociale / Foyer', p.raisonSociale],
        ['Responsable', p.responsable],
        ['Activité', p.activite],
        ['Adresse', p.adresse],
        ['Ville', p.ville],
        ['Pays', p.pays],
        ['Téléphone', p.telephone],
        ['E-mail', p.email],
        ['Site web', p.siteWeb],
        ['Identifiant fiscal', p.identifiant],
      ],
    },
    {
      titre: 'Exercice & devise',
      lignes: [
        ['Devise de base', devise],
        ['Période du rapport', b.libelle],
        ['Trésorerie initiale', p.tresorerieInitiale, 'montant'],
        ['Taux d’épargne visé', p.tauxEpargneCible, 'pourcent'],
        ['Seuil d’alerte budget', p.seuilAlerte, 'pourcent'],
        ['Périmètre', p.perimetre === 'tout' ? 'Tous les modules'
          : p.perimetre === 'general' ? 'Général seul' : labelModule(p.perimetre)],
      ],
    },
    {
      titre: 'Dîme',
      lignes: [
        ['Dîme activée', p.dimeActive ? 'Oui' : 'Non'],
        ['Taux appliqué', p.dimeTaux, 'pourcent'],
        ['Assiette', p.dimeAssiette === 'salaire' ? 'Salaire uniquement'
          : p.dimeAssiette === 'salaire_primes' ? 'Salaire et primes' : 'Tous les revenus'],
      ],
    },
    {
      titre: 'Comptes',
      lignes: comptes.map((c) => [
        `${c.nom}${c.etablissement ? ` — ${c.etablissement}` : ''}`,
        soldeCompte(c.id, c.soldeOuverture, toutes), 'montant',
      ] as [string, Cellule, Colonne['format']]),
    },
    { titre: 'Édition', lignes: [['Contact', APP_CONTACT], ['Marque', APP_SIGNATURE]] },
  ])

  const nom = `Budget-Smart-${b.cle}.xlsx`
  const buffer = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    nom,
  )
  return nom
}

/* ------------------------------------------- sauvegarde / restauration */
export interface Sauvegarde {
  app: string
  version: number
  exporteLe: string
  parametres: Parametres
  ecritures: unknown[]
  comptes: unknown[]
  plan: unknown[]
  postes: unknown[]
  objectifs: unknown[]
  dettes: unknown[]
  recurrents: unknown[]
}

/** Sauvegarde intégrale au format JSON : tout est relisible et réimportable. */
export async function exporterSauvegarde(): Promise<string> {
  const [parametres, ecritures, comptes, plan, postes, objectifs, dettes, recurrents] =
    await Promise.all([
      getParametres(), db.ecritures.toArray(), db.comptes.toArray(), db.plan.toArray(),
      db.postes.toArray(), db.objectifs.toArray(), db.dettes.toArray(), db.recurrents.toArray(),
    ])
  const data: Sauvegarde = {
    app: `${APP_NAME} ${APP_BRAND}`,
    version: 2,
    exporteLe: new Date().toISOString(),
    parametres, ecritures, comptes, plan, postes, objectifs, dettes, recurrents,
  }
  const nom = `budget-smart-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
  saveAs(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
    nom,
  )
  return nom
}

/** Restauration : on remplace intégralement le contenu local par le fichier. */
export async function importerSauvegarde(fichier: File): Promise<void> {
  const brut = JSON.parse(await fichier.text()) as Partial<Sauvegarde>
  if (!brut || !Array.isArray(brut.ecritures)) {
    throw new Error('Fichier de sauvegarde non reconnu.')
  }
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
    if (brut.parametres) await db.parametres.put({ ...brut.parametres, id: 'app' })
    await db.ecritures.bulkPut(brut.ecritures as never[])
    await db.comptes.bulkPut((brut.comptes ?? []) as never[])
    await db.plan.bulkPut((brut.plan ?? []) as never[])
    await db.postes.bulkPut((brut.postes ?? []) as never[])
    await db.objectifs.bulkPut((brut.objectifs ?? []) as never[])
    await db.dettes.bulkPut((brut.dettes ?? []) as never[])
    await db.recurrents.bulkPut((brut.recurrents ?? []) as never[])
  })
}

/** Remise à zéro complète, y compris les paramètres. */
export async function toutEffacer(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
}

export const CATEGORIE_DIME = CAT_DIME
export { parCategorie }
