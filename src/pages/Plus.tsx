import { useLiveQuery } from 'dexie-react-hooks'
import {
  AlertTriangle, ArrowLeftRight, Bell, BookOpen, ChevronRight, Download,
  FileSpreadsheet, FileText, Pencil, Plus as PlusIcon, Repeat2, RotateCcw,
  Share2, Target, Trash2, TrendingDown, Upload, UserCog, Zap,
} from 'lucide-react'
import { VERSION_ACTUELLE, useNouveautes } from '../lib/nouveautes'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Btn, Card, Field, Input, Kpi, MoneyInput, Puce, Section, Select, Sheet, TextArea, Vide,
} from '../components/kit'
import {
  APP_BRAND, APP_CONTACT, APP_NAME, APP_SIGNATURE, DEVISES, FREQUENCES, MODULES,
} from '../data/refs'
import { labelFrequence, labelModule } from '../i18n'
import CompteCloud from '../components/CompteCloud'
import { categoriesPour } from '../lib/referentiel'
import { estEpargne } from '../data/concepts'
import { useLangue, useMois, useT } from '../i18n'
import { db, getParametres, now, uid } from '../db'
import {
  capitalRestant, creances, empruntsEnCours, mensualite, totalRattache,
} from '../lib/compute'
import {
  exporterClasseur, exporterSauvegarde, importerSauvegarde, toutEffacer,
} from '../lib/export-xlsx'
import { exporterPdf } from '../lib/export-pdf'

import {
  TRIMESTRES, TYPES_PERIODE, bornes, type Periode, type TypePeriode,
} from '../lib/periode'
import { convertir, fmt, pct } from '../lib/money'
import type { Dette, ModuleId, Objectif, Recurrent } from '../types'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

const objectifVierge = (): Objectif => ({
  id: uid(), createdAt: now(), updatedAt: now(),
  nom: '', module: 'general', cible: 0,
})

const detteVierge = (): Dette => ({
  id: uid(), createdAt: now(), updatedAt: now(),
  nom: '', capital: 0, tauxAnnuel: 0, dureeMois: 12, premiereEcheance: aujourdhui(),
})

const recurrentVierge = (): Recurrent => ({
  id: uid(), createdAt: now(), updatedAt: now(),
  libelle: '', module: 'general', categorie: '', montant: 0, devise: '',
  frequence: 'mensuel', prochaineEcheance: aujourdhui(), actif: true,
})

/** Avance une date d'un pas de fréquence : sert à replanifier après génération. */
function prochaine(date: string, frequence: Recurrent['frequence']): string {
  const d = new Date(date)
  const pas: Record<Recurrent['frequence'], number> = {
    hebdo: 0, mensuel: 1, bimestriel: 2, trimestriel: 3, semestriel: 6, annuel: 12,
  }
  if (frequence === 'hebdo') d.setDate(d.getDate() + 7)
  else d.setMonth(d.getMonth() + pas[frequence])
  return d.toISOString().slice(0, 10)
}

export default function Plus() {
  const nav = useNavigate()
  const nouveautes = useNouveautes()
  const t = useT()
  const langue = useLangue()
  const nomsMois = useMois()
  const p = useLiveQuery(() => getParametres(), [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  const comptes = useLiveQuery(() => db.comptes.orderBy('nom').toArray(), [], [])
  const objectifs = useLiveQuery(() => db.objectifs.orderBy('nom').toArray(), [], [])
  const dettes = useLiveQuery(() => db.dettes.orderBy('nom').toArray(), [], [])
  const recurrents = useLiveQuery(() => db.recurrents.orderBy('libelle').toArray(), [], [])

  const [objectif, setObjectif] = useState<Objectif | null>(null)
  const [dette, setDette] = useState<Dette | null>(null)
  const [recurrent, setRecurrent] = useState<Recurrent | null>(null)
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [periode, setPeriode] = useState<Periode | null>(null)
  const [enCours, setEnCours] = useState<'' | 'xlsx' | 'pdf'>('')
  const fichier = useRef<HTMLInputElement>(null)

  if (!p) return null

  const periodeCourante: Periode = periode ?? {
    type: 'mois', annee: p.anneeTravail, mois: p.moisSuivi,
    trimestre: Math.ceil(p.moisSuivi / 3), date: aujourdhui(),
  }

  const annonce = (texte: string) => {
    setMessage(texte)
    window.setTimeout(() => setMessage(''), 5000)
  }

  /* ------------------------------------------------------------- actions */
  const enregistrer = async <T extends { id: string; updatedAt: string }>(
    table: { put: (v: T) => Promise<unknown> }, valeur: T,
  ) => {
    await table.put({ ...valeur, updatedAt: now() })
  }

  /** Génère l'écriture d'une opération récurrente puis replanifie l'échéance. */
  const genererRecurrent = async (r: Recurrent) => {
    const date = r.prochaineEcheance || aujourdhui()
    await db.ecritures.put({
      id: uid(), createdAt: now(), updatedAt: now(),
      date,
      type: estEpargne(r.categorie) ? 'epargne' : 'depense',
      module: r.module,
      categorie: r.categorie,
      libelle: r.libelle,
      montant: r.montant,
      devise: r.devise,
      montantBase: convertir(p, r.montant, r.devise),
      compteId: r.compteId,
      nature: 'fixe',
      statut: 'paye',
      note: 'Généré depuis les opérations récurrentes',
    })
    await db.recurrents.put({
      ...r, prochaineEcheance: prochaine(date, r.frequence), updatedAt: now(),
    })
    annonce(t('plus.recurrentAjoute', { libelle: r.libelle, date: date.split('-').reverse().join('/') }))
  }

  const lancerExport = async (format: 'xlsx' | 'pdf') => {
    setEnCours(format)
    try {
      const nom = format === 'xlsx'
        ? await exporterClasseur(periodeCourante)
        : await exporterPdf(periodeCourante)
      annonce(t('plus.telecharge', { nom }))
    } catch {
      annonce(t('plus.exportEchoue'))
    } finally {
      setEnCours('')
    }
  }

  const restaurer = async (f: File) => {
    try {
      await importerSauvegarde(f)
      annonce(t('plus.sauvegardeRestauree'))
    } catch {
      annonce(t('plus.sauvegardeIllisible'))
    }
  }

  /* -------------------------------------------------------------- rendus */
  const totalObjectifs = objectifs.reduce((s, o) => s + o.cible, 0)
  const acquisObjectifs = objectifs.reduce((s, o) => s + totalRattache(ecritures, o.id), 0)
  const resteDu = dettes.reduce(
    (s, d) => s + capitalRestant(d.capital, d.tauxAnnuel, d.dureeMois, totalRattache(ecritures, d.id)),
    0,
  )
  const chargeMensuelle = dettes.reduce(
    (s, d) => s + mensualite(d.capital, d.tauxAnnuel, d.dureeMois), 0,
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {message && (
        <Card className="border-apex-gold bg-apex-cream p-3 text-xs font-semibold text-apex-navy">
          {message}
        </Card>
      )}

      <Card onClick={() => nav('/guide')} className="flex items-center gap-3 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl
                        bg-apex-gold text-white">
          <BookOpen size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-apex-navy">{t('guide.titre')}</p>
          <p className="truncate text-2xs text-surface-500">{t('guide.sousTitre')}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-surface-400" />
      </Card>

      <Card onClick={() => nav('/partager')} className="flex items-center gap-3 p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl
                        bg-apex-green text-white">
          <Share2 size={20} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-apex-navy">{t('partage.titre')}</p>
          <p className="truncate text-2xs text-surface-500">{t('partage.sousTitre')}</p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-surface-400" />
      </Card>

      <CompteCloud annonce={annonce} />

      <Section title={t('plus.reglages')}>
        <Card onClick={() => nav('/parametres')} className="flex items-center gap-3 p-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-navy text-white">
            <UserCog size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-apex-navy">{t('plus.mesInformations')}</p>
            <p className="truncate text-xs text-surface-500">
              {p.raisonSociale || t('plus.aCompleter')} · {p.deviseBase} {' '}
              {p.dimeActive ? t('plus.dimeActivee', { taux: pct(p.dimeTaux) }) : t('plus.dimeDesactivee')}
            </p>
          </div>
        </Card>
      </Section>

      {/* ---------------------------------------------------------- objectifs */}
      <Section
        title={t('plus.objectifs')}
        action={
          <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
               onClick={() => setObjectif(objectifVierge())}>
            <PlusIcon size={14} /> {t('commun.ajouter')}
          </Btn>
        }
      >
        {objectifs.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi label={t('plus.totalVise')} valeur={fmt(p, totalObjectifs, { court: true })} ton="navy" />
            <Kpi label={t('plus.dejaConstitue')} valeur={fmt(p, acquisObjectifs, { court: true })}
                 ton="green" note={totalObjectifs ? pct(acquisObjectifs / totalObjectifs) : undefined} />
          </div>
        )}
        {objectifs.length === 0 ? (
          <Vide texte={t('plus.aucunObjectif')} />
        ) : (
          <div className="space-y-2">
            {objectifs.map((o) => {
              const acquis = totalRattache(ecritures, o.id)
              const part = o.cible ? Math.min(1, acquis / o.cible) : 0
              return (
                <Card key={o.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-apex-mint text-apex-green">
                      <Target size={17} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-apex-navy">{o.nom}</p>
                      <p className="text-2xs text-surface-500">
                        {labelModule(t, o.module)}
                        {o.echeance && ` · pour le ${o.echeance.split('-').reverse().join('/')}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setObjectif({ ...o })} aria-label={t('commun.modifier')}
                              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => void db.objectifs.delete(o.id)} aria-label={t('commun.supprimer')}
                              className="rounded-lg p-1.5 text-apex-red hover:bg-apex-blush">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-surface-100">
                    <div className="h-full rounded-full bg-apex-green transition-all"
                         style={{ width: `${part * 100}%` }} />
                  </div>
                  <div className="mt-1.5 flex justify-between text-2xs text-surface-500">
                    <span className="font-semibold text-apex-green">{fmt(p, acquis)}</span>
                    <span>{pct(part)} de {fmt(p, o.cible)}</span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------------ dettes */}
      <Section
        title={t('plus.credits')}
        action={
          <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
               onClick={() => setDette(detteVierge())}>
            <PlusIcon size={14} /> {t('commun.ajouter')}
          </Btn>
        }
      >
        {dettes.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi label={t('plus.resteDu')} valeur={fmt(p, resteDu, { court: true })} ton="red" />
            <Kpi label={t('plus.chargeMensuelle')} valeur={fmt(p, chargeMensuelle, { court: true })} ton="orange" />
          </div>
        )}
        {dettes.length === 0 ? (
          <Vide texte={t('plus.aucunCredit')} />
        ) : (
          <div className="space-y-2">
            {dettes.map((d) => {
              const paye = totalRattache(ecritures, d.id)
              const reste = capitalRestant(d.capital, d.tauxAnnuel, d.dureeMois, paye)
              return (
                <Card key={d.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-apex-blush text-apex-red">
                      <TrendingDown size={17} strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-apex-navy">{d.nom}</p>
                      <p className="truncate text-2xs text-surface-500">
                        {d.organisme || t('plus.organismeNonPrecise')} · {pct(d.tauxAnnuel)} sur {d.dureeMois} mois
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => setDette({ ...d })} aria-label={t('commun.modifier')}
                              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => void db.dettes.delete(d.id)} aria-label={t('commun.supprimer')}
                              className="rounded-lg p-1.5 text-apex-red hover:bg-apex-blush">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                    {[
                      ['Mensualité', fmt(p, Math.round(mensualite(d.capital, d.tauxAnnuel, d.dureeMois)))],
                      ['Remboursé', fmt(p, paye)],
                      ['Reste dû', fmt(p, Math.round(reste))],
                    ].map(([label, valeur]) => (
                      <div key={label} className="rounded-lg bg-surface-50 py-1.5">
                        <p className="text-2xs text-surface-500">{label}</p>
                        <p className="text-xs font-bold text-apex-navy">{valeur}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {/* ---------------------------------------------------- prêts & emprunts */}
      {(creances(ecritures).length > 0 || empruntsEnCours(ecritures).length > 0) && (
        <Section title={t('plus.pretsEmprunts')}>
          <div className="space-y-2">
            {[
              ...creances(ecritures).map((c) => ({ ...c, sens: 'du' as const })),
              ...empruntsEnCours(ecritures).map((c) => ({ ...c, sens: 'a' as const })),
            ]
              .filter((c) => Math.abs(c.solde) > 0.5)
              .map((c) => (
                <Card key={`${c.sens}-${c.tiers}`} className="flex items-center gap-3 p-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    c.sens === 'du' ? 'bg-apex-mint text-apex-green' : 'bg-apex-blush text-apex-red'
                  }`}>
                    <ArrowLeftRight size={17} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-apex-navy">{c.tiers}</p>
                    <p className="truncate text-2xs text-surface-500">
                      {c.sens === 'du' ? t('plus.ilsMeDoivent') : t('plus.jeDois')}{' '}
                      {fmt(p, c.avance)} · {fmt(p, c.regle)} {' '}
                      {c.dernier.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${
                    c.sens === 'du' ? 'text-apex-green' : 'text-apex-red'
                  }`}>
                    {fmt(p, c.solde, { court: true })}
                  </p>
                </Card>
              ))}
          </div>
          <p className="text-2xs leading-relaxed text-surface-500">
            {t('plus.pretsAide')}
          </p>
        </Section>
      )}

      {/* -------------------------------------------------------- récurrents */}
      <Section
        title={t('plus.recurrents')}
        action={
          <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
               onClick={() => setRecurrent(recurrentVierge())}>
            <PlusIcon size={14} /> {t('commun.ajouter')}
          </Btn>
        }
      >
        {recurrents.length === 0 ? (
          <Vide texte={t('plus.aucunRecurrent')} />
        ) : (
          <div className="space-y-2">
            {recurrents.map((r) => {
              const due = r.prochaineEcheance && r.prochaineEcheance <= aujourdhui()
              return (
                <Card key={r.id} className="flex items-center gap-3 p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-apex-cream text-apex-gold">
                    <Repeat2 size={17} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-bold text-apex-navy">
                      {r.libelle}
                      {!r.actif && <Puce>{t('plus.enPause')}</Puce>}
                      {r.actif && due && <Puce ton="attention">{t('plus.aPasser')}</Puce>}
                    </p>
                    <p className="truncate text-2xs text-surface-500">
                      {fmt(p, convertir(p, r.montant, r.devise))} ·{' '}
                      {labelFrequence(t, r.frequence)} ·{' '}
                      {labelModule(t, r.module)}
                      {r.prochaineEcheance && ` · le ${r.prochaineEcheance.split('-').reverse().join('/')}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {r.actif && (
                      <button onClick={() => void genererRecurrent(r)} aria-label={t('plus.ajouterAuJournal')}
                              className="rounded-lg p-1.5 text-apex-green hover:bg-apex-mint">
                        <Zap size={15} />
                      </button>
                    )}
                    <button onClick={() => setRecurrent({ ...r })} aria-label={t('commun.modifier')}
                            className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => void db.recurrents.delete(r.id)} aria-label={t('commun.supprimer')}
                            className="rounded-lg p-1.5 text-apex-red hover:bg-apex-blush">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------------ outils */}
      <Section title={t('plus.rapports')}>
        <Card className="overflow-hidden">
          <div className="bg-apex-navy px-3.5 py-2">
            <p className="text-2xs font-bold uppercase tracking-[.14em] text-white">
              {t('plus.periodeRapport')}
            </p>
          </div>
          <div className="space-y-3 p-3">
            <div className="grid grid-cols-4 gap-1.5">
              {TYPES_PERIODE.map((tp) => (
                <button
                  key={tp.id}
                  onClick={() => setPeriode({ ...periodeCourante, type: tp.id as TypePeriode })}
                  className={`rounded-xl border px-1 py-2 text-2xs font-bold transition ${
                    periodeCourante.type === tp.id
                      ? 'border-apex-gold bg-apex-cream text-apex-navy'
                      : 'border-surface-300 bg-white text-surface-600'
                  }`}
                >
                  {t(tp.cle as never)}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {periodeCourante.type === 'jour' && (
                <Field label={t('plus.jour')}>
                  <Input type="date" value={periodeCourante.date ?? aujourdhui()}
                         onChange={(e) => setPeriode({
                           ...periodeCourante,
                           date: e.target.value,
                           annee: Number(e.target.value.slice(0, 4)) || periodeCourante.annee,
                         })} />
                </Field>
              )}
              {periodeCourante.type === 'mois' && (
                <Field label={t('commun.mois')}>
                  <Select value={periodeCourante.mois ?? 1}
                          onChange={(e) => setPeriode({
                            ...periodeCourante, mois: Number(e.target.value),
                          })}>
                    {nomsMois.long.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </Select>
                </Field>
              )}
              {periodeCourante.type === 'trimestre' && (
                <Field label={t('plus.trimestre')}>
                  <Select value={periodeCourante.trimestre ?? 1}
                          onChange={(e) => setPeriode({
                            ...periodeCourante, trimestre: Number(e.target.value),
                          })}>
                    {TRIMESTRES.map((q) => <option key={q.id} value={q.id}>{t(q.cle as never)}</option>)}
                  </Select>
                </Field>
              )}
              <Field label={t('commun.annee')}>
                <Select value={periodeCourante.annee}
                        onChange={(e) => setPeriode({
                          ...periodeCourante, annee: Number(e.target.value),
                        })}>
                  {[p.anneeTravail - 2, p.anneeTravail - 1, p.anneeTravail, p.anneeTravail + 1]
                    .map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
            </div>

            <p className="rounded-xl bg-surface-50 px-3 py-2 text-2xs text-surface-600">
              {bornes(periodeCourante, langue).libelle} — {t('plus.du')}{' '}
              {bornes(periodeCourante, langue).debut.split('-').reverse().join('/')} {t('plus.au')}{' '}
              {bornes(periodeCourante, langue).fin.split('-').reverse().join('/')}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <Btn variant="primary" disabled={enCours !== ''}
                   onClick={() => void lancerExport('xlsx')}>
                <FileSpreadsheet size={16} />
                {enCours === 'xlsx' ? t('plus.exportEnCours') : 'Excel'}
              </Btn>
              <Btn variant="gold" disabled={enCours !== ''}
                   onClick={() => void lancerExport('pdf')}>
                <FileText size={16} />
                {enCours === 'pdf' ? t('plus.exportEnCours') : 'PDF'}
              </Btn>
            </div>
            <p className="text-2xs leading-relaxed text-surface-500">
              {t('plus.rapportsAide')}
            </p>
          </div>
        </Card>
      </Section>

      <Section title={t('plus.donnees')}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Card onClick={() => void exporterSauvegarde()} className="flex items-center gap-3 p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-navy text-white">
              <Download size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-apex-navy">{t('plus.sauvegarder')}</p>
              <p className="text-2xs text-surface-500">{t('plus.sauvegarderSous')}</p>
            </div>
          </Card>

          <Card onClick={() => fichier.current?.click()} className="flex items-center gap-3 p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-steel text-white">
              <Upload size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-apex-navy">{t('plus.restaurer')}</p>
              <p className="text-2xs text-surface-500">{t('plus.restaurerSous')}</p>
            </div>
          </Card>

          <Card onClick={() => setConfirmation(true)} className="flex items-center gap-3 p-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-red text-white">
              <RotateCcw size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-apex-red">{t('plus.toutEffacer')}</p>
              <p className="text-2xs text-surface-500">{t('plus.toutEffacerSous')}</p>
            </div>
          </Card>
        </div>
        <input
          ref={fichier} type="file" accept="application/json,.json" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (f) void restaurer(f)
          }}
        />
        <p className="text-2xs leading-relaxed text-surface-500">
          {t('plus.donneesAide')}
        </p>
      </Section>

      {/* ----------------------------------------------------------- à propos */}
      <Section title={t('plus.aPropos')}>
        <Card onClick={() => nav('/nouveautes')}
              className="mb-2.5 flex items-center gap-3 p-3">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl
                          bg-apex-navy text-white">
            <Bell size={20} strokeWidth={2.2} />
            {nouveautes.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full
                               bg-apex-gold ring-2 ring-apex-navy" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-apex-navy">{t('nouveautes.titre')}</p>
            <p className="truncate text-2xs text-surface-500">
              {nouveautes.length > 0
                ? t(nouveautes.length > 1
                  ? 'nouveautes.misAJourSousPluriel' : 'nouveautes.misAJourSous',
                { n: nouveautes.length })
                : `Version ${VERSION_ACTUELLE}`}
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-surface-400" />
        </Card>
        <Card className="space-y-1.5 p-4 text-center">
          <p className="text-base font-bold text-apex-navy">{APP_NAME}</p>
          <p className="text-xs font-semibold text-apex-gold">{APP_BRAND}</p>
          <p className="pt-1 text-2xs text-surface-500">{APP_SIGNATURE}</p>
          <p className="text-2xs text-surface-500">{APP_CONTACT}</p>
          <p className="pt-1 text-2xs text-surface-400">
            {t('plus.droits', { annee: new Date().getFullYear() })}
          </p>
        </Card>
      </Section>

      {/* ----------------------------------------------- formulaire objectif */}
      <Sheet
        open={Boolean(objectif)} titre={t('plus.objectifTitre')}
        onClose={() => setObjectif(null)}
        footer={
          <Btn className="w-full" onClick={async () => {
            if (!objectif?.nom.trim()) return
            await enregistrer(db.objectifs, objectif)
            setObjectif(null)
          }}>{t('commun.enregistrer')}</Btn>
        }
      >
        {objectif && (
          <>
            <Field label={t('plus.nomObjectif')}>
              <Input value={objectif.nom} placeholder={t('plus.nomObjectifPlaceholder')}
                     onChange={(e) => setObjectif({ ...objectif, nom: e.target.value })} />
            </Field>
            <Field label={t('plus.moduleConcerne')}>
              <Select value={objectif.module}
                      onChange={(e) => setObjectif({ ...objectif, module: e.target.value as ModuleId })}>
                {MODULES.map((m) => <option key={m.id} value={m.id}>{labelModule(t, m.id)}</option>)}
              </Select>
            </Field>
            <Field label={`Montant cible (${p.deviseBase})`}>
              <MoneyInput value={objectif.cible}
                          onChange={(v) => setObjectif({ ...objectif, cible: v })} />
            </Field>
            <Field label={t('plus.echeanceSouhaitee')}>
              <Input type="date" value={objectif.echeance ?? ''}
                     onChange={(e) => setObjectif({ ...objectif, echeance: e.target.value })} />
            </Field>
            <Field label={t('plus.compteDedie')} hint={t('plus.compteDedieAide')}>
              <Select value={objectif.compteId ?? ''}
                      onChange={(e) => setObjectif({ ...objectif, compteId: e.target.value || undefined })}>
                <option value="">{t('commun.aucun')}</option>
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </Select>
            </Field>
            <p className="rounded-xl bg-apex-cream p-3 text-2xs leading-relaxed text-apex-navy">
              {t('plus.objectifAide')}
            </p>
          </>
        )}
      </Sheet>

      {/* -------------------------------------------------- formulaire dette */}
      <Sheet
        open={Boolean(dette)} titre={t('plus.creditTitre')}
        onClose={() => setDette(null)}
        footer={
          <Btn className="w-full" onClick={async () => {
            if (!dette?.nom.trim()) return
            await enregistrer(db.dettes, dette)
            setDette(null)
          }}>{t('commun.enregistrer')}</Btn>
        }
      >
        {dette && (
          <>
            <Field label={t('plus.intitule')}>
              <Input value={dette.nom} placeholder={t('plus.intitulePlaceholder')}
                     onChange={(e) => setDette({ ...dette, nom: e.target.value })} />
            </Field>
            <Field label={t('plus.organisme')}>
              <Input value={dette.organisme ?? ''}
                     onChange={(e) => setDette({ ...dette, organisme: e.target.value })} />
            </Field>
            <Field label={`Capital emprunté (${p.deviseBase})`}>
              <MoneyInput value={dette.capital}
                          onChange={(v) => setDette({ ...dette, capital: v })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('plus.tauxAnnuel')}>
                <Input inputMode="decimal" value={dette.tauxAnnuel ? dette.tauxAnnuel * 100 : ''}
                       placeholder="7,5"
                       onChange={(e) => setDette({
                         ...dette,
                         tauxAnnuel: (Number(e.target.value.replace(',', '.')) || 0) / 100,
                       })} />
              </Field>
              <Field label={t('plus.dureeMois')}>
                <Input inputMode="numeric" value={dette.dureeMois || ''}
                       onChange={(e) => setDette({ ...dette, dureeMois: Number(e.target.value) || 0 })} />
              </Field>
            </div>
            <Field label={t('plus.premiereEcheance')}>
              <Input type="date" value={dette.premiereEcheance ?? ''}
                     onChange={(e) => setDette({ ...dette, premiereEcheance: e.target.value })} />
            </Field>
            <div className="rounded-xl bg-apex-navy p-3 text-center text-white">
              <p className="text-2xs uppercase tracking-wider text-white/60">{t('plus.mensualiteCalculee')}</p>
              <p className="text-lg font-bold">
                {fmt(p, Math.round(mensualite(dette.capital, dette.tauxAnnuel, dette.dureeMois)))}
              </p>
            </div>
          </>
        )}
      </Sheet>

      {/* ---------------------------------------------- formulaire récurrent */}
      <Sheet
        open={Boolean(recurrent)} titre={t('plus.recurrentTitre')}
        onClose={() => setRecurrent(null)}
        footer={
          <Btn className="w-full" onClick={async () => {
            if (!recurrent?.libelle.trim()) return
            await enregistrer(db.recurrents, recurrent)
            setRecurrent(null)
          }}>{t('commun.enregistrer')}</Btn>
        }
      >
        {recurrent && (
          <>
            <Field label={t('journal.libelle')}>
              <Input value={recurrent.libelle} placeholder={t('plus.recurrentPlaceholder')}
                     onChange={(e) => setRecurrent({ ...recurrent, libelle: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Module">
                <Select value={recurrent.module}
                        onChange={(e) => setRecurrent({
                          ...recurrent, module: e.target.value as ModuleId, categorie: '',
                        })}>
                  {MODULES.map((m) => <option key={m.id} value={m.id}>{labelModule(t, m.id)}</option>)}
                </Select>
              </Field>
              <Field label={t('plus.frequence')}>
                <Select value={recurrent.frequence}
                        onChange={(e) => setRecurrent({
                          ...recurrent, frequence: e.target.value as Recurrent['frequence'],
                        })}>
                  {FREQUENCES.map((f) => <option key={f.id} value={f.id}>{labelFrequence(t, f.id)}</option>)}
                </Select>
              </Field>
            </div>
            <Field label={t('commun.categorie')}>
              <Select value={recurrent.categorie}
                      onChange={(e) => setRecurrent({ ...recurrent, categorie: e.target.value })}>
                <option value="">{t('commun.choisir')}</option>
                {categoriesPour(p, recurrent.module, 'depense').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('commun.montant')}>
                <MoneyInput value={recurrent.montant}
                            onChange={(v) => setRecurrent({ ...recurrent, montant: v })} />
              </Field>
              <Field label={t('commun.devise')}>
                <Select value={recurrent.devise || p.deviseBase}
                        onChange={(e) => setRecurrent({
                          ...recurrent,
                          devise: e.target.value === p.deviseBase ? '' : e.target.value,
                        })}>
                  {DEVISES.map(([code, nom]) => (
                    <option key={code} value={code}>{code} — {nom}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label={t('plus.prochaineEcheance')}>
              <Input type="date" value={recurrent.prochaineEcheance ?? ''}
                     onChange={(e) => setRecurrent({ ...recurrent, prochaineEcheance: e.target.value })} />
            </Field>
            <Field label={t('plus.compteDebite')}>
              <Select value={recurrent.compteId ?? ''}
                      onChange={(e) => setRecurrent({ ...recurrent, compteId: e.target.value || undefined })}>
                <option value="">{t('commun.aucun')}</option>
                {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </Select>
            </Field>
            <label className="flex items-center gap-2.5 rounded-xl bg-surface-50 p-3">
              <input type="checkbox" checked={recurrent.actif} className="h-4 w-4 accent-apex-gold"
                     onChange={(e) => setRecurrent({ ...recurrent, actif: e.target.checked })} />
              <span className="text-xs font-semibold text-apex-navy">
                {t('plus.actif')}
              </span>
            </label>
          </>
        )}
      </Sheet>

      {/* ------------------------------------------------- confirmation reset */}
      <Sheet
        open={confirmation} titre={t('plus.toutEffacer')} onClose={() => setConfirmation(false)}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={() => setConfirmation(false)}>{t('commun.annuler')}</Btn>
            <Btn variant="danger" onClick={async () => {
              await toutEffacer()
              setConfirmation(false)
              annonce(t('plus.toutEfface'))
              nav('/')
            }}>{t('plus.effacerDefinitivement')}</Btn>
          </div>
        }
      >
        <div className="flex gap-3 rounded-xl bg-apex-blush p-3">
          <AlertTriangle size={20} className="shrink-0 text-apex-red" />
          <p className="text-xs leading-relaxed text-apex-navy">
            {t('plus.effacerAvertissement')}
          </p>
        </div>
        <TextArea
          readOnly
          value={t('plus.resume', { ecritures: ecritures.length, comptes: comptes.length, objectifs: objectifs.length, dettes: dettes.length, recurrents: recurrents.length })}
        />
      </Sheet>
    </div>
  )
}
