import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  Btn, Card, Field, Input, Kpi, MoneyInput, Section, Select, Sheet, Vide,
} from '../components/kit'
import { CATEGORIES, FAMILLES_MARIAGE, MOIS_COURT, couleurModule, labelModule } from '../data/refs'
import { db, getParametres, now, stamp, uid } from '../db'
import { parModule, totalRattache } from '../lib/compute'
import { fmt, pct } from '../lib/money'
import type { ModuleId, Poste } from '../types'

type Champ = { cle: string; label: string; type?: 'nombre' | 'texte' }

/** Chaque module a ses propres champs : on ne mélange pas un terrain et un traiteur. */
const CONFIG: Record<string, {
  titre: string; motItem: string; champs: Champ[]; devis: boolean
}> = {
  mariage: {
    titre: 'Budget mariage', motItem: 'Poste', devis: true,
    champs: [{ cle: 'prestataire', label: 'Prestataire', type: 'texte' }],
  },
  immobilier: {
    titre: 'Immobilier & terrain', motItem: 'Bien', devis: false,
    champs: [
      { cle: 'localisation', label: 'Localisation', type: 'texte' },
      { cle: 'surface', label: 'Surface (m²)' },
      { cle: 'fraisAnnexes', label: 'Frais annexes' },
      { cle: 'loyer', label: 'Loyer mensuel' },
      { cle: 'charges', label: 'Charges mensuelles' },
    ],
  },
  business: {
    titre: 'Business & projets', motItem: 'Projet', devis: false,
    champs: [
      { cle: 'responsable', label: 'Responsable', type: 'texte' },
      { cle: 'caPrevu', label: 'Chiffre d’affaires prévu' },
    ],
  },
}

const num = (p: Poste, cle: string) => Number(p.extra?.[cle] ?? 0) || 0

export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
  const moduleId = (id ?? 'mariage') as Exclude<ModuleId, 'general'>
  const cfg = CONFIG[moduleId] ?? CONFIG.mariage
  const p = useLiveQuery(() => getParametres(), [])
  const postes = useLiveQuery(
    () => db.postes.where('module').equals(moduleId).toArray(), [moduleId], [],
  )
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  const [edit, setEdit] = useState<Poste | null>(null)
  if (!p) return null

  const coutRetenu = (x: Poste) =>
    x.devisRetenu >= 0 ? (x.devis[x.devisRetenu] || 0) : x.estimation
  const paye = (x: Poste) => totalRattache(ecritures, x.id, (e) => e.type !== 'revenu')
  const encaisse = (x: Poste) => totalRattache(ecritures, x.id, (e) => e.type === 'revenu')

  const totalRetenu = postes.reduce((s, x) => s + coutRetenu(x), 0)
  const totalPaye = postes.reduce((s, x) => s + paye(x), 0)
  const totalCa = postes.reduce((s, x) => s + encaisse(x), 0)
  const serie = parModule(ecritures, p.anneeTravail)[moduleId]
    .map((v, i) => ({ nom: MOIS_COURT[i], valeur: v }))

  const familles = moduleId === 'mariage'
    ? FAMILLES_MARIAGE.map(([nom, idx]) => ({
        nom,
        montant: postes
          .filter((x) => idx.includes(CATEGORIES.mariage.indexOf(x.categorie ?? '')))
          .reduce((s, x) => s + coutRetenu(x), 0),
      })).filter((f) => f.montant > 0)
    : []

  const vierge = (): Poste => stamp({
    id: uid(), module: moduleId, nom: '', categorie: '',
    estimation: 0, devis: [0, 0, 0], devisRetenu: -1, extra: {},
  }) as Poste

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 text-white" style={{ background: couleurModule(moduleId) }}>
          <p className="text-base font-bold">{cfg.titre}</p>
          <p className="text-2xs text-white/75">
            Cette page ne compte que le module {labelModule(moduleId)} — rien n’est mélangé
            avec votre budget courant.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label={`${cfg.motItem}s suivis`} valeur={String(postes.length)} ton="navy" />
        <Kpi label={moduleId === 'business' ? 'Budget prévu' : 'Coût retenu'}
             valeur={fmt(p, totalRetenu, { court: true })} ton="gold" />
        <Kpi label={moduleId === 'business' ? 'Dépensé' : 'Déjà payé'}
             valeur={fmt(p, totalPaye, { court: true })} ton="red"
             note={totalRetenu ? pct(totalPaye / totalRetenu) : undefined} />
        {moduleId === 'business'
          ? <Kpi label="Marge réalisée" valeur={fmt(p, totalCa - totalPaye, { court: true })}
                 ton={totalCa - totalPaye >= 0 ? 'green' : 'red'} note={`CA ${fmt(p, totalCa, { court: true })}`} />
          : <Kpi label="Reste à payer" valeur={fmt(p, Math.max(0, totalRetenu - totalPaye), { court: true })}
                 ton="orange" />}
      </div>

      <Section title={`${cfg.motItem}s`}
               action={<Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
                            onClick={() => setEdit(vierge())}><Plus size={14} /> Ajouter</Btn>}>
        {postes.length === 0 ? (
          <Vide texte={`Aucun ${cfg.motItem.toLowerCase()} enregistré.`}
                action={<Btn variant="gold" onClick={() => setEdit(vierge())}>
                  <Plus size={16} /> Ajouter un {cfg.motItem.toLowerCase()}
                </Btn>} />
        ) : (
          <div className="space-y-2">
            {postes.map((x) => {
              const retenu = coutRetenu(x)
              const r = paye(x)
              const ratio = retenu ? r / retenu : 0
              return (
                <Card key={x.id} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-apex-navy">
                        {x.nom || `${cfg.motItem} sans nom`}
                      </p>
                      <p className="truncate text-2xs text-surface-500">
                        {[x.categorie, x.extra?.localisation, x.extra?.prestataire,
                          x.extra?.responsable].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-apex-navy">
                        {fmt(p, retenu, { court: true })}
                      </p>
                      <p className="text-2xs text-surface-500">payé {fmt(p, r, { court: true })}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button onClick={() => setEdit({ ...x })}
                              className="rounded p-1 text-surface-400 hover:bg-surface-100">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => void db.postes.delete(x.id)}
                              className="rounded p-1 text-surface-400 hover:bg-apex-blush hover:text-apex-red">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {retenu > 0 && (
                    <div className="h-1 w-full bg-surface-200">
                      <div className="h-full" style={{
                        width: `${Math.min(100, ratio * 100)}%`, background: couleurModule(moduleId),
                      }} />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      {familles.length > 0 && (
        <Section title="Répartition par famille de postes">
          <Card className="divide-y divide-surface-200">
            {familles.map((f) => (
              <div key={f.nom} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-apex-navy">{f.nom}</span>
                <span className="text-sm font-bold tabular-nums text-apex-navy">
                  {fmt(p, f.montant, { court: true })}
                </span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title={`Sorties ${labelModule(moduleId)} — mois par mois`}>
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={serie} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="nom" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                     tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip formatter={(v: number) => fmt(p, v)}
                       contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #dfe3e9' }} />
              <Bar dataKey="valeur" name="Sorties" fill={couleurModule(moduleId)} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      <Sheet open={Boolean(edit)} titre={`${cfg.motItem}`} onClose={() => setEdit(null)}
             footer={
               <Btn variant="gold" className="w-full" disabled={!edit?.nom}
                    onClick={() => {
                      if (edit) void db.postes.put({ ...edit, updatedAt: now() })
                      setEdit(null)
                    }}>Enregistrer</Btn>
             }>
        {edit && (
          <>
            <Field label="Nom">
              <Input autoFocus value={edit.nom} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} />
            </Field>
            <Field label="Catégorie">
              <Select value={edit.categorie ?? ''}
                      onChange={(e) => setEdit({ ...edit, categorie: e.target.value })}>
                <option value="">— choisir —</option>
                {CATEGORIES[moduleId].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label={moduleId === 'business' ? 'Budget prévu' : 'Estimation'}>
              <MoneyInput value={edit.estimation}
                          onChange={(v) => setEdit({ ...edit, estimation: v })} />
            </Field>

            {cfg.devis && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <Field key={i} label={`Devis ${i + 1}`}>
                      <MoneyInput value={edit.devis[i] || 0}
                                  onChange={(v) => {
                                    const d = [...edit.devis]; d[i] = v
                                    setEdit({ ...edit, devis: d })
                                  }} />
                    </Field>
                  ))}
                </div>
                <Field label="Devis retenu">
                  <Select value={edit.devisRetenu}
                          onChange={(e) => setEdit({ ...edit, devisRetenu: Number(e.target.value) })}>
                    <option value={-1}>Estimation</option>
                    <option value={0}>Devis 1</option>
                    <option value={1}>Devis 2</option>
                    <option value={2}>Devis 3</option>
                  </Select>
                </Field>
              </>
            )}

            {cfg.champs.map((c) => (
              <Field key={c.cle} label={c.label}>
                {c.type === 'texte' ? (
                  <Input value={String(edit.extra?.[c.cle] ?? '')}
                         onChange={(e) => setEdit({
                           ...edit, extra: { ...edit.extra, [c.cle]: e.target.value },
                         })} />
                ) : (
                  <MoneyInput value={num(edit, c.cle)}
                              onChange={(v) => setEdit({
                                ...edit, extra: { ...edit.extra, [c.cle]: v },
                              })} />
                )}
              </Field>
            ))}

            <Field label="Échéance">
              <Input type="date" value={edit.echeance ?? ''}
                     onChange={(e) => setEdit({ ...edit, echeance: e.target.value })} />
            </Field>
          </>
        )}
      </Sheet>
    </div>
  )
}
