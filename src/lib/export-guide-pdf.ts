/**
 * Mode d'emploi en PDF — à imprimer, ou à envoyer par WhatsApp à quelqu'un
 * qui découvre l'application. Même contenu que l'écran, même charte que les
 * rapports : bandeau bleu nuit, filet doré, une section par bloc.
 */
import { jsPDF } from 'jspdf'
import { saveAs } from 'file-saver'
import { APP_BRAND, APP_CONTACT, APP_NAME, APP_URL } from '../data/refs'
import { GUIDE } from '../data/guide'
import { traducteurPour } from '../i18n'
import { LANGUE_DEFAUT, estLangue, type Langue } from '../i18n/langues'

const NAVY: [number, number, number] = [26, 53, 87]
const GOLD: [number, number, number] = [184, 134, 11]
const CREAM: [number, number, number] = [253, 246, 227]
const GRIS: [number, number, number] = [110, 118, 128]
const ENCRE: [number, number, number] = [48, 56, 66]

/**
 * Les polices standard de jsPDF ne connaissent que le jeu WinAnsi : la flèche
 * et l'espace fine y sortent en caractères parasites. On les remplace avant
 * de poser le texte sur la page.
 */
const txt = (v: string): string =>
  v.replace(/[\u202F\u00A0\u2009\u2007\u2008]/g, ' ')
    .replace(/[\u2192\u27A1\u279C]/g, '->')
    .replace(/\u2190/g, '<-')
    .replace(/\u2044/g, '/')
    // Les chiffres cerclés numérotent les étapes à l'écran ; ici c'est le
    // document qui numérote ses sections, et la police ne les connaît pas.
    .replace(/[\u2460-\u2473]\s*/g, '')
    // Filet de sécurité : un caractère que les polices standard ne savent pas
    // écrire sortirait en charabia sur la page ; mieux vaut ne rien écrire.
    .replace(/[^\u0020-\u007E\u00A0-\u00FF\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178\n]/g, '')


export function exporterGuidePdf(langueDemandee: string): string {
  const langue: Langue = estLangue(langueDemandee) ? langueDemandee : LANGUE_DEFAUT
  const t = traducteurPour(langue)
  const dit = (b: { fr: string; en: string }) => txt(langue === 'en' ? b.en : b.fr)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const L = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()
  const MARGE = 16
  const LARGEUR = L - MARGE * 2
  const BAS = H - 20

  /* ------------------------------------------------------ page de titre */
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, L, 62, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 62, L, 1.6, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(26)
  doc.text(APP_NAME, MARGE, 28)
  doc.setTextColor(214, 188, 120)
  doc.setFont('helvetica', 'normal').setFontSize(11)
  doc.text(APP_BRAND, MARGE, 36)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(15)
  doc.text(txt(t('guide.titre')), MARGE, 50)
  doc.setFont('helvetica', 'normal').setFontSize(9.5)
  doc.text(txt(t('guide.sousTitre')), MARGE, 56.5)

  let y = 76

  /** Passe à la page suivante si le bloc à venir ne tient plus. */
  const place = (hauteur: number) => {
    if (y + hauteur <= BAS) return
    doc.addPage()
    y = MARGE + 4
  }

  GUIDE.forEach((s, i) => {
    const titre = `${i + 1}. ${dit(s.titre)}`
    const intro = doc.splitTextToSize(dit(s.intro), LARGEUR - 6) as string[]
    place(14 + intro.length * 4.6)

    // Bandeau de section
    doc.setFillColor(...NAVY)
    doc.rect(MARGE, y - 5.2, LARGEUR, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold').setFontSize(10.5)
    doc.text(titre, MARGE + 3, y)
    y += 8

    doc.setTextColor(...ENCRE)
    doc.setFont('helvetica', 'italic').setFontSize(9.5)
    intro.forEach((ligne) => { doc.text(ligne, MARGE + 3, y); y += 4.6 })
    y += 2

    doc.setFont('helvetica', 'normal').setFontSize(9.5)
    s.points.forEach((p) => {
      const lignes = doc.splitTextToSize(dit(p), LARGEUR - 12) as string[]
      place(lignes.length * 4.6 + 3)
      doc.setFillColor(...GOLD)
      doc.circle(MARGE + 4, y - 1.4, 0.9, 'F')
      doc.setTextColor(...ENCRE)
      lignes.forEach((ligne) => { doc.text(ligne, MARGE + 8, y); y += 4.6 })
      y += 1.6
    })
    y += 5
  })

  /* ---------------------------------------------- encadré « où trouver » */
  place(26)
  doc.setFillColor(...CREAM)
  doc.roundedRect(MARGE, y - 4, LARGEUR, 22, 2.5, 2.5, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(MARGE, y - 4, LARGEUR, 1.4, 'F')
  doc.setTextColor(...NAVY)
  doc.setFont('helvetica', 'bold').setFontSize(10)
  doc.text(txt(t('partage.titre')), MARGE + 4, y + 3)
  doc.setFont('helvetica', 'normal').setFontSize(9.5)
  doc.text(APP_URL, MARGE + 4, y + 9.5)
  doc.setFontSize(8).setTextColor(...GRIS)
  doc.text(txt(t('partage.installer')), MARGE + 4, y + 15)

  /* ------------------------------------------------------- pied de page */
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.4)
    doc.line(MARGE, H - 13, L - MARGE, H - 13)
    doc.setFont('helvetica', 'normal').setFontSize(7.5)
    doc.setTextColor(...GRIS)
    doc.text(`${APP_NAME} ${APP_BRAND} · ${APP_CONTACT}`, MARGE, H - 8)
    doc.text(txt(t('rapport.page', { n: i, total: pages })), L - MARGE, H - 8, { align: 'right' })
  }

  const nom = langue === 'en' ? 'Budget-Smart-user-guide.pdf' : 'Budget-Smart-mode-d-emploi.pdf'
  saveAs(doc.output('blob'), nom)
  return nom
}
