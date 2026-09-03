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
  APP_BRAND, APP_CONTACT, APP_NAME, APP_SIGNATURE, CAT_DIME, sensDe,
} from '../data/refs'
import {
  dictionnaire, labelFrequence, labelModule, labelType, traducteurPour,
} from '../i18n'
import { estLangue, LANGUE_DEFAUT, type Langue } from '../i18n/langues'
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

  // Le classeur parle la langue choisie dans les paramètres, comme le reste
  // de l'application : en-têtes, onglets, libellés et noms de mois.
  const langue: Langue = estLangue(p.langue) ? p.langue : LANGUE_DEFAUT
  const t = traducteurPour(langue)
  const MOIS = dictionnaire(langue).mois.long
  const nomModule = (m: Parameters<typeof labelModule>[1]) => labelModule(t, m)
  const nomType = (x: Parameters<typeof labelType>[1]) => labelType(t, x)
  const TOTAL = t('rapport.totalMaj')

  const b = bornes(periode, langue)
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
  const contexte = t('rapport.contexte', {
    nom: p.raisonSociale || t('rapport.monBudget'),
    periode: b.libelle,
    debut: jour(b.debut),
    fin: jour(b.fin),
    devise,
  })

  const entree = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'entree'
  const sortie = (e: Ecriture) => estRealisee(e) && sensDe(e.type) === 'sortie'
  const somme = (f: (e: Ecriture) => boolean) =>
    ecritures.filter(f).reduce((s, e) => s + e.montantBase, 0)

  const totalEntrees = somme(entree)
  const totalSorties = somme(sortie)
  const totalEpargne = somme((e) => estRealisee(e) && e.type === 'epargne')

  /* 1. Synthèse -------------------------------------------------------- */
  const ws = wb.addWorksheet(t('rapport.synthese'), { properties: { tabColor: { argb: NAVY } } })
  const mensuel = agregerAnnee(p, toutes, plan, annee).filter(
    (m) => moisCouverts(periode).includes(m.mois),
  )
  const colsSynth: Colonne[] = [
    { entete: t('rapport.colMois'), largeur: 14 },
    { entete: t('rapport.entrees'), largeur: 15, format: 'montant' },
    { entete: t('rapport.dontRevenus'), largeur: 15, format: 'montant' },
    { entete: t('rapport.dontEmprunts'), largeur: 15, format: 'montant' },
    { entete: t('rapport.colDepenses'), largeur: 15, format: 'montant' },
    { entete: t('rapport.colEpargne'), largeur: 14, format: 'montant' },
    { entete: t('rapport.investissement'), largeur: 15, format: 'montant' },
    { entete: t('rapport.remboursements'), largeur: 15, format: 'montant' },
    { entete: t('rapport.pretsAccordes'), largeur: 15, format: 'montant' },
    { entete: t('rapport.totalSorties'), largeur: 15, format: 'montant' },
    { entete: t('rapport.colSolde'), largeur: 15, format: 'montant' },
    { entete: t('rapport.tresorerieCumulee'), largeur: 17, format: 'montant' },
    { entete: t('rapport.budgetPrevu'), largeur: 15, format: 'montant' },
    { entete: t('estimation.ecart'), largeur: 14, format: 'montant' },
    { entete: t('rapport.colTauxEpargne'), largeur: 14, format: 'pourcent' },
  ]
  tableau(ws, entete, contexte, colsSynth, [], undefined)

  // Les indicateurs prennent la place des lignes 5-6 : on redessine par-dessus.
  ws.spliceRows(5, 0, [], [], [])
  indicateurs(ws, 5, [
    { label: t('rapport.entrees'), valeur: totalEntrees, couleur: GREEN },
    { label: t('rapport.sorties'), valeur: totalSorties, couleur: RED },
    { label: t('rapport.colSolde'), valeur: totalEntrees - totalSorties, couleur: NAVY },
    { label: t('tableau.misDeCote'), valeur: totalEpargne, couleur: STEEL },
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
    cell.value = i === 0 ? t('rapport.totalPeriode')
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
    wb.addWorksheet(t('rapport.ongletJournal')),
    t('rapport.journalOperations'), contexte,
    [
      { entete: t('rapport.colDate'), largeur: 12, format: 'date' },
      { entete: t('rapport.colModule'), largeur: 16 },
      { entete: t('rapport.colType'), largeur: 20 },
      { entete: t('rapport.colCategorie'), largeur: 26 },
      { entete: t('rapport.colSousCategorie'), largeur: 20 },
      { entete: t('rapport.colDescriptifLong'), largeur: 38 },
      { entete: t('rapport.colTiers'), largeur: 18 },
      { entete: t('rapport.sensEntree'), largeur: 14, format: 'montant' },
      { entete: t('rapport.sensSortie'), largeur: 14, format: 'montant' },
      { entete: t('rapport.deviseSaisie'), largeur: 11 },
      { entete: t('rapport.montantSaisi'), largeur: 13, format: 'nombre' },
      { entete: t('rapport.colCompte'), largeur: 18 },
      { entete: t('rapport.colCompteDestination'), largeur: 18 },
      { entete: t('rapport.colMoyen'), largeur: 16 },
      { entete: t('rapport.colNature'), largeur: 13 },
      { entete: t('rapport.colStatut'), largeur: 11 },
    ],
    ecritures.map((e) => {
      const sens = sensDe(e.type)
      const reel = estRealisee(e)
      return [
        new Date(e.date), nomModule(e.module), nomType(e.type), e.categorie,
        e.sousCategorie ?? '', e.descriptif ?? e.note ?? '', e.tiers ?? '',
        reel && sens === 'entree' ? e.montantBase : null,
        reel && sens === 'sortie' ? e.montantBase : null,
        e.devise || p.deviseBase, e.montant,
        nomCompte(e.compteId), nomCompte(e.compteCibleId),
        e.moyen ?? '', e.nature ?? '', e.statut,
      ]
    }),
    [TOTAL, '', '', '', '', '', '', totalEntrees, totalSorties],
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
    wb.addWorksheet(t('rapport.ongletCategories')),
    t('rapport.ouPartArgent'), contexte,
    [
      { entete: t('rapport.colCategorie'), largeur: 30 },
      { entete: t('rapport.colSousCategorie'), largeur: 24 },
      { entete: t('rapport.colMontant'), largeur: 16, format: 'montant' },
      { entete: t('rapport.colPart'), largeur: 11, format: 'pourcent' },
      { entete: t('rapport.nbOperations'), largeur: 11, format: 'nombre' },
      { entete: t('rapport.moyenne'), largeur: 15, format: 'montant' },
    ],
    lignesDetail.map((l) => [
      l.cat, l.sous, l.montant, totalDetail ? l.montant / totalDetail : 0,
      l.nb, Math.round(l.montant / l.nb),
    ]),
    [TOTAL, '', totalDetail, totalDetail ? 1 : 0,
      lignesDetail.reduce((s, l) => s + l.nb, 0), null],
  )

  /* 4. Épargne ---------------------------------------------------------- */
  const epargnes = detailEpargne(comptes, ecritures)
  if (epargnes.length) {
    tableau(
      wb.addWorksheet(t('rapport.ongletEpargne')),
      t('rapport.monEpargne'), contexte,
      [
        { entete: t('rapport.colCompte'), largeur: 24 },
        { entete: t('rapport.typeCompte'), largeur: 18 },
        { entete: t('rapport.etablissement'), largeur: 24 },
        { entete: t('rapport.versePeriode'), largeur: 18, format: 'montant' },
        { entete: t('rapport.retire'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colSolde'), largeur: 16, format: 'montant' },
        { entete: t('rapport.bloqueJusquau'), largeur: 15 },
      ],
      epargnes.map((l) => [
        l.compte, l.nature, l.etablissement, l.verse, l.retire, l.solde, jour(l.blocageJusqu),
      ]),
      [TOTAL, '', '',
        epargnes.reduce((s, l) => s + l.verse, 0),
        epargnes.reduce((s, l) => s + l.retire, 0),
        epargnes.reduce((s, l) => s + l.solde, 0), ''],
    )
  }

  /* 5. Prêts et emprunts ------------------------------------------------ */
  const aRecevoir = creances(toutes)
  const aRendre = empruntsEnCours(toutes)
  if (aRecevoir.length || aRendre.length) {
    const wsPret = wb.addWorksheet(t('rapport.ongletPrets'))
    tableau(
      wsPret, t('rapport.pretsEmprunts'),
      `${contexte} — ${t('rapport.encoursHistorique')}`,
      [
        { entete: t('rapport.colSens'), largeur: 20 },
        { entete: t('rapport.colTiers'), largeur: 26 },
        { entete: t('rapport.montantEngage'), largeur: 17, format: 'montant' },
        { entete: t('rapport.dejaRegle'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colReste'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colDerniereOperation'), largeur: 17 },
      ],
      [
        ...aRecevoir.map((c) => [t('rapport.ilsMeDoivent'), c.tiers, c.avance, c.regle, c.solde, jour(c.dernier)]),
        ...aRendre.map((d) => [t('rapport.jeDois'), d.tiers, d.avance, d.regle, d.solde, jour(d.dernier)]),
      ] as Cellule[][],
      [TOTAL, '',
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
      wb.addWorksheet(t('rapport.ongletDime')), t('rapport.dimeOffrandes'), contexte,
      [
        { entete: t('rapport.colMois'), largeur: 16 },
        { entete: t('rapport.colRevenusSoumis'), largeur: 18, format: 'montant' },
        { entete: t('rapport.colDimeDue'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colDejaVersee'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colResteAVerser'), largeur: 16, format: 'montant' },
      ],
      mois.map((m) => {
        const d = calculerDime(p, toutes, annee, m)
        return [MOIS[m - 1], d.assiette, d.due, d.versee, d.reste]
      }),
      [TOTAL,
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
      wb.addWorksheet(t('rapport.ongletEstimation')),
      t('rapport.estimationAnnuelle'), contexte,
      [
        { entete: t('rapport.colModule'), largeur: 16 },
        { entete: t('rapport.colType'), largeur: 16 },
        { entete: t('rapport.colCategorie'), largeur: 30 },
        ...mois.map((m) => ({ entete: MOIS[m - 1], largeur: 13, format: 'montant' as const })),
        { entete: t('rapport.totalPeriodeTitre'), largeur: 15, format: 'montant' as const },
        { entete: t('rapport.colCommentaire'), largeur: 26 },
      ],
      lignesPlan.map((l) => [
        nomModule(l.module), nomType(l.type), l.categorie,
        ...mois.map((m) => l.mois[m - 1] || null),
        mois.reduce((s, m) => s + (l.mois[m - 1] || 0), 0),
        l.commentaire ?? '',
      ]),
      [TOTAL, '', '',
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
      wb.addWorksheet(nomModule(m).slice(0, 31)),
      nomModule(m), contexte,
      [
        { entete: t('rapport.colPoste'), largeur: 30 },
        { entete: t('rapport.colCategorie'), largeur: 26 },
        { entete: t('rapport.colEstimation'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colBudgetRetenu'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colRealise'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colResteAPayer'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colAvancement'), largeur: 13, format: 'pourcent' },
        { entete: t('rapport.colPrestataire'), largeur: 22 },
        { entete: t('rapport.colEcheance'), largeur: 13 },
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
      [TOTAL, '',
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
      wb.addWorksheet(t('rapport.ongletObjectifs')), t('rapport.objectifsEpargne'), contexte,
      [
        { entete: t('rapport.colObjectif'), largeur: 30 },
        { entete: t('rapport.colModule'), largeur: 18 },
        { entete: t('rapport.colCible'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colConstitue'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colReste'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colAvancement'), largeur: 13, format: 'pourcent' },
        { entete: t('rapport.colEcheance'), largeur: 13 },
      ],
      objectifs.map((o) => {
        const acquis = totalRattache(toutes, o.id)
        return [
          o.nom, nomModule(o.module), o.cible, acquis,
          Math.max(0, o.cible - acquis), o.cible ? acquis / o.cible : 0, jour(o.echeance),
        ]
      }),
    )
  }

  if (dettes.length) {
    tableau(
      wb.addWorksheet(t('rapport.ongletCredits')), t('rapport.creditsDettes'), contexte,
      [
        { entete: t('rapport.colCredit'), largeur: 28 },
        { entete: t('rapport.colOrganisme'), largeur: 22 },
        { entete: t('rapport.colCapital'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colTauxAnnuel'), largeur: 12, format: 'pourcent' },
        { entete: t('rapport.colDureeMois'), largeur: 12, format: 'nombre' },
        { entete: t('rapport.colMensualite'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colDejaRembourse'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colResteDu'), largeur: 16, format: 'montant' },
        { entete: t('rapport.colPremiereEcheance'), largeur: 13 },
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
      wb.addWorksheet(t('rapport.ongletRecurrents')), t('rapport.operationsRecurrentes'), contexte,
      [
        { entete: t('rapport.colLibelle'), largeur: 30 },
        { entete: t('rapport.colModule'), largeur: 18 },
        { entete: t('rapport.colCategorie'), largeur: 26 },
        { entete: t('rapport.colMontant'), largeur: 15, format: 'montant' },
        { entete: t('rapport.colDevise'), largeur: 10 },
        { entete: t('rapport.colFrequence'), largeur: 16 },
        { entete: t('rapport.colProchaineEcheance'), largeur: 17 },
        { entete: t('rapport.actif'), largeur: 10 },
      ],
      recurrents.map((r) => [
        r.libelle, nomModule(r.module), r.categorie, r.montant,
        r.devise || p.deviseBase, labelFrequence(t, r.frequence), jour(r.prochaineEcheance),
        r.actif ? t('rapport.oui') : t('rapport.non'),
      ]),
    )
  }

  /* 10. Paramètres ------------------------------------------------------- */
  fiche(wb.addWorksheet(t('rapport.ongletParametres')), entete, contexte, [
    {
      titre: t('rapport.identite'),
      lignes: [
        [t('rapport.paramRaisonSociale'), p.raisonSociale],
        [t('rapport.colResponsable'), p.responsable],
        [t('rapport.paramActivite'), p.activite],
        [t('rapport.paramAdresse'), p.adresse],
        [t('rapport.paramVille'), p.ville],
        [t('rapport.paramPays'), p.pays],
        [t('rapport.paramTelephone'), p.telephone],
        [t('rapport.paramEmail'), p.email],
        [t('rapport.paramSiteWeb'), p.siteWeb],
        [t('rapport.paramIdentifiantFiscal'), p.identifiant],
      ],
    },
    {
      titre: t('rapport.exerciceDevise'),
      lignes: [
        [t('rapport.paramDeviseBase'), devise],
        [t('rapport.paramPeriodeRapport'), b.libelle],
        [t('rapport.paramTresorerieInitiale'), p.tresorerieInitiale, 'montant'],
        [t('rapport.paramTauxEpargneVise'), p.tauxEpargneCible, 'pourcent'],
        [t('rapport.paramSeuilAlerte'), p.seuilAlerte, 'pourcent'],
        [t('rapport.paramPerimetre'), p.perimetre === 'tout' ? t('rapport.perimetreTousModules')
          : p.perimetre === 'general' ? t('rapport.perimetreGeneralSeul') : nomModule(p.perimetre)],
      ],
    },
    {
      titre: t('rapport.ongletDime'),
      lignes: [
        [t('rapport.paramDimeActivee'), p.dimeActive ? t('rapport.oui') : t('rapport.non')],
        [t('rapport.colTauxApplique'), p.dimeTaux, 'pourcent'],
        [t('rapport.colAssiette'), p.dimeAssiette === 'salaire' ? t('rapport.assietteSalaire')
          : p.dimeAssiette === 'salaire_primes' ? t('rapport.assietteSalairePrimes')
            : t('rapport.assietteTousRevenus')],
      ],
    },
    {
      titre: t('rapport.ongletComptes'),
      lignes: comptes.map((c) => [
        `${c.nom}${c.etablissement ? ` — ${c.etablissement}` : ''}`,
        soldeCompte(c.id, c.soldeOuverture, toutes), 'montant',
      ] as [string, Cellule, Colonne['format']]),
    },
    {
      titre: t('rapport.edition'),
      lignes: [[t('rapport.contact'), APP_CONTACT], [t('rapport.marque'), APP_SIGNATURE]],
    },
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
    const { langue } = await getParametres()
    const t = traducteurPour(estLangue(langue) ? langue : LANGUE_DEFAUT)
    throw new Error(t('rapport.sauvegardeIllisible'))
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
