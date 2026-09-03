import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowDownRight, ArrowUpRight, Check, CopyPlus, Pencil, Plus, Repeat2, Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Btn, Card, Field, Input, Kpi, MoneyInput, Puce, Section, Select, Sheet, TextArea, Vide,
} from '../components/kit'
import {
  CAT_SPIRITUEL, DEVISES, MODULES, NATURES, STATUTS, TYPES, TYPES_TIERS,
  labelModule, sensDe,
} from '../data/refs'
import { categoriesPour, moyensDe, sousCategoriesDe } from '../lib/referentiel'
import { db, getParametres, now, uid } from '../db'
import { anneeDe, estRealisee, moisDe } from '../lib/compute'
import { convertir, fmt } from '../lib/money'
import type { Ecriture, ModuleId, Statut, TypeOp } from '../types'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

const vierge = (): Ecriture => ({
  id: uid(), createdAt: now(), updatedAt: now(),
  date: aujourdhui(), type: 'depense', module: 'general', categorie: '',
  libelle: '', montant: 0, devise: '', montantBase: 0, statut: 'paye',
})

export default function Journal() {
  const [params, setParams] = useSearchParams()
  const p = useLiveQuery(() => getParametres(), [])
  const comptes = useLiveQuery(() => db.comptes.orderBy('nom').toArray(), [], [])
  const ecritures = useLiveQuery(
    () => db.ecritures.orderBy('date').reverse().toArray(), [], [],
  )
  const rattachables = useLiveQuery(async () => {
    const [postes, objectifs, dettes] = await Promise.all([
      db.postes.toArray(), db.objectifs.toArray(), db.dettes.toArray(),
    ])
    return [
      ...postes.map((x) => ({ id: x.id, nom: x.nom, groupe: labelModule(x.module) })),
      ...objectifs.map((x) => ({ id: x.id, nom: x.nom, groupe: 'Objectifs' })),
      ...dettes.map((x) => ({ id: x.id, nom: x.nom, groupe: 'Crédits' })),
    ]
  }, [], [])

  const [brouillon, setBrouillon] = useState<Ecriture | null>(null)
  const [rapide, setRapide] = useState<{
    type: TypeOp; montant: number; categorie: string; sousCategorie: string; descriptif: string
  }>({ type: 'depense', montant: 0, categorie: '', sousCategorie: '', descriptif: '' })
  const [filtreModule, setFiltreModule] = useState<'tout' | ModuleId>('tout')

  const ouvrir = (e?: Ecriture) => setBrouillon(e ? { ...e } : vierge())
  if (params.get('new') && !brouillon) { setParams({}); ouvrir() }

  const visibles = useMemo(
    () => ecritures.filter((e) => filtreModule === 'tout' || e.module === filtreModule),
    [ecritures, filtreModule],
  )

  const totaux = useMemo(() => {
    if (!p) return { entrees: 0, sorties: 0, solde: 0 }
    let entrees = 0, sorties = 0
    for (const e of ecritures) {
      if (anneeDe(e) !== p.anneeTravail || moisDe(e) !== p.moisSuivi || !estRealisee(e)) continue
      const s = sensDe(e.type)
      if (s === 'entree') entrees += e.montantBase
      else if (s === 'sortie') sorties += e.montantBase
    }
    return { entrees, sorties, solde: entrees - sorties }
  }, [ecritures, p])

  /** Catégories les plus employées pour ce type : deux gestes suffisent. */
  const suggestions = useMemo(() => {
    const usage = new Map<string, number>()
    for (const e of ecritures) {
      if (e.type !== rapide.type || !e.categorie) continue
      usage.set(e.categorie, (usage.get(e.categorie) ?? 0) + 1)
    }
    const vues = [...usage.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)
    const module: ModuleId = filtreModule === 'tout' ? 'general' : filtreModule
    const proposees = p ? categoriesPour(p, module, rapide.type) : []
    return [...new Set([...vues, ...proposees])].slice(0, 8)
  }, [ecritures, rapide.type, filtreModule, p])

  /** Puces affichées : les suggestions, plus la catégorie choisie au clavier. */
  const puces = useMemo(
    () => [...new Set([rapide.categorie, ...suggestions].filter(Boolean))],
    [rapide.categorie, suggestions],
  )

  /** Dernière opération du même type : elle donne le compte et le moyen habituels. */
  const dernier = useMemo(
    () => ecritures.find((e) => e.type === rapide.type),
    [ecritures, rapide.type],
  )

  if (!p) return null

  const moduleCourant: ModuleId = filtreModule === 'tout' ? 'general' : filtreModule

  /**
   * Dîme, offrande et don : le descriptif doit dire à qui et quand.
   * On propose l'église enregistrée dans les paramètres et la date du jour ;
   * le texte reste entièrement modifiable.
   */
  const estSpirituel = (categorie: string) => CAT_SPIRITUEL.includes(categorie)
  const descriptifPropose = (categorie: string, date = aujourdhui()) =>
    `${p.dimeEglise} — ${date.split('-').reverse().join('/')}`

  /** Une épargne va sur un compte d'épargne, jamais sur le compte courant. */
  const compteEpargne = comptes.find((c) => c.nature === 'epargne' || c.nature === 'bloque')
  const versEpargne = ['epargne', 'investissement'].includes(rapide.type)
  const compteDestination = versEpargne
    ? dernier?.compteCibleId ?? compteEpargne?.id
    : undefined

  /** Saisie en trois gestes : montant, catégorie, valider. Le reste est déduit. */
  const enregistrerRapide = async () => {
    if (!rapide.montant) return
    const categorie = rapide.categorie || puces[0] || ''
    await db.ecritures.put({
      id: uid(), createdAt: now(), updatedAt: now(),
      date: aujourdhui(),
      type: rapide.type,
      module: moduleCourant,
      categorie,
      sousCategorie: rapide.sousCategorie || undefined,
      libelle: rapide.sousCategorie || categorie,
      descriptif: rapide.descriptif.trim()
        || (estSpirituel(categorie) ? descriptifPropose(categorie) : undefined),
      tiers: TYPES_TIERS.includes(rapide.type) ? rapide.descriptif.trim() || undefined : undefined,
      montant: rapide.montant,
      devise: '',
      montantBase: convertir(p, rapide.montant, p.deviseBase),
      compteId: dernier?.compteId ?? comptes[0]?.id,
      compteCibleId: compteDestination,
      moyen: dernier?.moyen,
      nature: dernier?.nature,
      statut: 'paye',
    })
    setRapide({ type: rapide.type, montant: 0, categorie: '', sousCategorie: '', descriptif: '' })
  }

  /** Repasser une opération identique à la date du jour. */
  const repeter = (e: Ecriture) => void db.ecritures.put({
    ...e, id: uid(), createdAt: now(), updatedAt: now(),
    date: aujourdhui(), statut: 'paye',
  })

  const enregistrer = async () => {
    if (!brouillon) return
    const e: Ecriture = {
      ...brouillon,
      montantBase: convertir(p, brouillon.montant, brouillon.devise || p.deviseBase),
      categorie: brouillon.categorie || categoriesPour(p, brouillon.module, brouillon.type)[0] || '',
      updatedAt: now(),
    }
    await db.ecritures.put(e)
    setBrouillon(null)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-3 gap-2.5">
        <Kpi label="Entrées du mois" valeur={fmt(p, totaux.entrees, { court: true })} ton="green" />
        <Kpi label="Sorties du mois" valeur={fmt(p, totaux.sorties, { court: true })} ton="red" />
        <Kpi label="Solde" valeur={fmt(p, totaux.solde, { court: true })}
             ton={totaux.solde >= 0 ? 'navy' : 'red'} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-apex-navy px-3.5 py-2">
          <p className="text-2xs font-bold uppercase tracking-[.14em] text-white">
            Saisie rapide
          </p>
          <button
            className="text-2xs font-semibold text-apex-gold"
            onClick={() => setBrouillon({
              ...vierge(), type: rapide.type, module: moduleCourant,
              montant: rapide.montant, categorie: rapide.categorie,
              libelle: rapide.categorie,
            })}
          >
            Plus de détails →
          </button>
        </div>

        <div className="space-y-2.5 p-3">
          <div className="grid grid-cols-3 gap-2">
            {(['depense', 'revenu', 'epargne'] as const)
              .map((id) => TYPES.find((t) => t.id === id)!)
              .map((t) => (
              <button
                key={t.id}
                onClick={() => setRapide({ ...rapide, type: t.id, categorie: '', sousCategorie: '' })}
                className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${
                  rapide.type === t.id
                    ? t.sens === 'entree'
                      ? 'border-apex-green bg-apex-mint text-apex-green'
                      : 'border-apex-gold bg-apex-cream text-apex-navy'
                    : 'border-surface-300 bg-white text-surface-600'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <MoneyInput
              value={rapide.montant}
              onChange={(v) => setRapide({ ...rapide, montant: v })}
              className="flex-1 !py-3 !text-xl"
            />
            <Btn variant="gold" className="!px-5" disabled={!rapide.montant}
                 onClick={() => void enregistrerRapide()}>
              <Check size={20} strokeWidth={2.6} />
            </Btn>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {puces.map((c) => (
              <button
                key={c}
                onClick={() => setRapide({ ...rapide, categorie: c, sousCategorie: '' })}
                className={`rounded-full px-2.5 py-1 text-2xs font-semibold transition ${
                  (rapide.categorie || suggestions[0]) === c
                    ? 'bg-apex-navy text-white'
                    : 'border border-surface-300 bg-white text-surface-600'
                }`}
              >
                {c}
              </button>
            ))}
            <select
              value=""
              aria-label="Autre catégorie"
              onChange={(e) => e.target.value && setRapide({
                ...rapide, categorie: e.target.value, sousCategorie: '',
              })}
              className="rounded-full border border-surface-300 bg-white px-2.5 py-1 text-2xs
                         font-semibold text-surface-600 outline-none focus:border-apex-gold"
            >
              <option value="">Autre catégorie…</option>
              {categoriesPour(p, moduleCourant, rapide.type)
                .filter((c) => !puces.includes(c))
                .map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {sousCategoriesDe(p, rapide.categorie || puces[0] || '').length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-surface-100 pt-2.5">
              {sousCategoriesDe(p, rapide.categorie || puces[0] || '').map((sc) => (
                <button
                  key={sc}
                  onClick={() => setRapide({
                    ...rapide,
                    categorie: rapide.categorie || puces[0] || '',
                    sousCategorie: rapide.sousCategorie === sc ? '' : sc,
                  })}
                  className={`rounded-lg px-2.5 py-1 text-2xs font-semibold transition ${
                    rapide.sousCategorie === sc
                      ? 'bg-apex-gold text-white'
                      : 'border border-surface-200 bg-surface-50 text-surface-600'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          )}

          <Input
            value={rapide.descriptif}
            onChange={(e) => setRapide({ ...rapide, descriptif: e.target.value })}
            onFocus={() => {
              const cat = rapide.categorie || puces[0] || ''
              if (!rapide.descriptif && estSpirituel(cat)) {
                setRapide({ ...rapide, categorie: cat, descriptif: descriptifPropose(cat) })
              }
            }}
            className="!py-2 !text-xs"
            placeholder={
              estSpirituel(rapide.categorie || puces[0] || '')
                ? `Quelle église, quelle date ? — ex. « ${p.dimeEglise} »`
                : TYPES_TIERS.includes(rapide.type)
                  ? 'À qui / de qui ? — ex. « Koffi, remboursement fin octobre »'
                  : rapide.type === 'epargne'
                    ? 'Pour quoi ? — ex. « apport terrain Bingerville »'
                    : 'À quoi ça a servi ? — ex. « maison → académie »'
            }
          />

          <p className="text-2xs leading-relaxed text-surface-500">
            Enregistré aujourd’hui en {labelModule(moduleCourant).toLowerCase()}
            {dernier?.compteId && comptes.some((c) => c.id === dernier.compteId)
              ? ` depuis « ${comptes.find((c) => c.id === dernier.compteId)?.nom} »`
              : comptes[0] ? ` depuis « ${comptes[0].nom} »` : ''}
            {compteDestination
              ? ` vers « ${comptes.find((c) => c.id === compteDestination)?.nom} »`
              : ''}
            . Le tableau de bord, les récapitulatifs et la dîme se recalculent tout seuls.
          </p>
        </div>
      </Card>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['tout', ...MODULES.map((m) => m.id)] as const).map((id) => (
          <button key={id} onClick={() => setFiltreModule(id as 'tout' | ModuleId)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filtreModule === id
                      ? 'bg-apex-navy text-white'
                      : 'border border-surface-300 bg-white text-surface-600'
                  }`}>
            {id === 'tout' ? 'Tout' : labelModule(id as ModuleId)}
          </button>
        ))}
      </div>

      <Section title={`${visibles.length} opération${visibles.length > 1 ? 's' : ''}`}>
        {visibles.length === 0 ? (
          <Vide texte="Aucune opération pour l’instant."
                action={<Btn variant="gold" onClick={() => ouvrir()}><Plus size={16} /> Saisir la première</Btn>} />
        ) : (
          <div className="space-y-2">
            {visibles.slice(0, 200).map((e) => {
              const sens = sensDe(e.type)
              return (
                <Card key={e.id} className="flex items-center gap-3 p-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    sens === 'entree' ? 'bg-apex-mint text-apex-green'
                      : sens === 'sortie' ? 'bg-apex-blush text-apex-red'
                        : 'bg-surface-100 text-surface-500'}`}>
                    {sens === 'entree' ? <ArrowUpRight size={18} />
                      : sens === 'sortie' ? <ArrowDownRight size={18} /> : <Repeat2 size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-apex-navy">
                      {e.libelle || e.categorie}
                    </p>
                    <p className="flex flex-wrap items-center gap-1.5 text-2xs text-surface-500">
                      <span>{new Date(e.date).toLocaleDateString('fr-FR')}</span>
                      <span>· {e.categorie}</span>
                      {e.sousCategorie && (
                        <span className="font-semibold text-apex-gold">› {e.sousCategorie}</span>
                      )}
                      {e.module !== 'general' && <Puce>{labelModule(e.module)}</Puce>}
                      {e.statut !== 'paye' && (
                        <Puce ton={e.statut === 'annule' ? 'neutre' : 'attention'}>
                          {STATUTS.find((s) => s.id === e.statut)?.label}
                        </Puce>
                      )}
                    </p>
                    {(e.descriptif || e.tiers) && (
                      <p className="mt-0.5 truncate text-2xs italic text-surface-500">
                        {e.tiers ? `${e.tiers} — ` : ''}{e.descriptif}
                      </p>
                    )}
                    {(e.compteCibleId || e.compteId) && (
                      <p className="truncate text-2xs text-surface-400">
                        {e.compteCibleId
                          ? `vers ${comptes.find((c) => c.id === e.compteCibleId)?.nom ?? '—'}`
                          : comptes.find((c) => c.id === e.compteId)?.nom}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold tabular-nums ${
                      sens === 'entree' ? 'text-apex-green'
                        : sens === 'sortie' ? 'text-apex-red' : 'text-surface-500'}`}>
                      {sens === 'sortie' ? '−' : sens === 'entree' ? '+' : ''}
                      {fmt(p, e.montantBase, { court: true })}
                    </p>
                    <div className="mt-1 flex justify-end gap-1">
                      <button onClick={() => repeter(e)} aria-label="Repasser aujourd’hui"
                              className="rounded p-1 text-surface-400 hover:bg-apex-cream hover:text-apex-gold">
                        <CopyPlus size={14} />
                      </button>
                      <button onClick={() => ouvrir(e)}
                              className="rounded p-1 text-surface-400 hover:bg-surface-100">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => void db.ecritures.delete(e.id)}
                              className="rounded p-1 text-surface-400 hover:bg-apex-blush hover:text-apex-red">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      <button onClick={() => ouvrir()} aria-label="Nouvelle opération"
              className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 grid
                         h-14 w-14 place-items-center rounded-full bg-apex-gold text-white
                         shadow-pop transition active:scale-95">
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <Sheet
        open={Boolean(brouillon)}
        titre={brouillon && ecritures.some((e) => e.id === brouillon.id) ? 'Modifier l’opération' : 'Nouvelle opération'}
        onClose={() => setBrouillon(null)}
        footer={
          <div className="flex gap-2">
            <Btn variant="ghost" className="flex-1" onClick={() => setBrouillon(null)}>Annuler</Btn>
            <Btn variant="gold" className="flex-[2]" onClick={() => void enregistrer()}
                 disabled={!brouillon?.montant}>Enregistrer</Btn>
          </div>
        }
      >
        {brouillon && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.filter((t) => ['revenu', 'depense', 'epargne'].includes(t.id)).map((t) => (
                <button key={t.id}
                        onClick={() => setBrouillon({ ...brouillon, type: t.id, categorie: '' })}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                          brouillon.type === t.id
                            ? 'border-apex-gold bg-apex-cream text-apex-navy'
                            : 'border-surface-300 bg-white text-surface-600'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <Field label="Montant">
              <div className="flex gap-2">
                <MoneyInput autoFocus value={brouillon.montant}
                            onChange={(v) => setBrouillon({ ...brouillon, montant: v })}
                            className="flex-1 !text-lg" />
                <Select className="w-28" value={brouillon.devise || p.deviseBase}
                        onChange={(e) => setBrouillon({ ...brouillon, devise: e.target.value })}>
                  {DEVISES.map(([c]) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              {brouillon.devise && brouillon.devise !== p.deviseBase && brouillon.montant > 0 && (
                <span className="mt-1 block text-2xs text-apex-steel">
                  = {fmt(p, convertir(p, brouillon.montant, brouillon.devise))}
                </span>
              )}
            </Field>

            <Field label="Libellé">
              <Input value={brouillon.libelle} placeholder="Courses du samedi"
                     onChange={(e) => setBrouillon({ ...brouillon, libelle: e.target.value })} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Module">
                <Select value={brouillon.module}
                        onChange={(e) => setBrouillon({
                          ...brouillon, module: e.target.value as ModuleId, categorie: '',
                        })}>
                  {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </Select>
              </Field>
              <Field label="Catégorie">
                <Select value={brouillon.categorie}
                        onChange={(e) => setBrouillon({ ...brouillon, categorie: e.target.value })}>
                  <option value="">— choisir —</option>
                  {categoriesPour(p, brouillon.module, brouillon.type)
                    .map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Sous-catégorie" hint="Le détail : « Yango », « marché », « Gbaka »…">
                <Input
                  list="sous-categories"
                  value={brouillon.sousCategorie ?? ''}
                  placeholder="Précisez"
                  onChange={(e) => setBrouillon({
                    ...brouillon, sousCategorie: e.target.value || undefined,
                  })}
                />
                <datalist id="sous-categories">
                  {sousCategoriesDe(p, brouillon.categorie).map((sc) => (
                    <option key={sc} value={sc} />
                  ))}
                </datalist>
              </Field>
              <Field label="Date">
                <Input type="date" value={brouillon.date}
                       onChange={(e) => setBrouillon({ ...brouillon, date: e.target.value })} />
              </Field>
              <Field label="Compte">
                <Select value={brouillon.compteId ?? ''}
                        onChange={(e) => setBrouillon({ ...brouillon, compteId: e.target.value || undefined })}>
                  <option value="">— aucun —</option>
                  {comptes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </Select>
              </Field>
              {['epargne', 'investissement', 'transfert'].includes(brouillon.type) && (
                <Field label="Compte destination" hint="Où l’argent est déposé.">
                  <Select value={brouillon.compteCibleId ?? ''}
                          onChange={(e) => setBrouillon({
                            ...brouillon, compteCibleId: e.target.value || undefined,
                          })}>
                    <option value="">— non précisé —</option>
                    {comptes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nom}{c.etablissement ? ` — ${c.etablissement}` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              {TYPES_TIERS.includes(brouillon.type) && (
                <Field label="Tiers" hint="À qui vous avez prêté, ou de qui vous avez emprunté.">
                  <Input value={brouillon.tiers ?? ''} placeholder="Nom de la personne"
                         onChange={(e) => setBrouillon({
                           ...brouillon, tiers: e.target.value || undefined,
                         })} />
                </Field>
              )}
              <Field label="Type d’opération">
                <Select value={brouillon.type}
                        onChange={(e) => setBrouillon({ ...brouillon, type: e.target.value as TypeOp })}>
                  {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Statut">
                <Select value={brouillon.statut}
                        onChange={(e) => setBrouillon({ ...brouillon, statut: e.target.value as Statut })}>
                  {STATUTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Nature">
                <Select value={brouillon.nature ?? ''}
                        onChange={(e) => setBrouillon({
                          ...brouillon, nature: (e.target.value || undefined) as Ecriture['nature'],
                        })}>
                  <option value="">— non précisée —</option>
                  {NATURES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </Select>
              </Field>
              <Field label="Moyen de paiement">
                <Select value={brouillon.moyen ?? ''}
                        onChange={(e) => setBrouillon({ ...brouillon, moyen: e.target.value || undefined })}>
                  <option value="">— aucun —</option>
                  {moyensDe(p).map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
            </div>

            {rattachables.length > 0 && (
              <Field label="Rattacher à" hint="Un bien, un projet, un objectif ou un crédit.">
                <Select value={brouillon.rattachement ?? ''}
                        onChange={(e) => setBrouillon({ ...brouillon, rattachement: e.target.value || undefined })}>
                  <option value="">— aucun —</option>
                  {rattachables.map((r) => (
                    <option key={r.id} value={r.id}>{r.groupe} — {r.nom}</option>
                  ))}
                </Select>
              </Field>
            )}

            <Field
              label="Descriptif"
              hint="À quoi cette opération a servi — c’est ce qui rend la ligne vérifiable plus tard."
            >
              <TextArea
                value={brouillon.descriptif ?? ''}
                placeholder={estSpirituel(brouillon.categorie)
                  ? `Ex. : ${p.dimeEglise} — culte du dimanche`
                  : 'Ex. : course maison → académie, aller-retour'}
                onFocus={() => {
                  if (!brouillon.descriptif && estSpirituel(brouillon.categorie)) {
                    setBrouillon({
                      ...brouillon,
                      descriptif: descriptifPropose(brouillon.categorie, brouillon.date),
                    })
                  }
                }}
                onChange={(e) => setBrouillon({ ...brouillon, descriptif: e.target.value })}
              />
            </Field>
          </>
        )}
      </Sheet>
    </div>
  )
}
