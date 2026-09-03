import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronRight, Plus, Trash2, Wand2 } from 'lucide-react'
import { useState } from 'react'
import {
  Btn, Card, Field, Kpi, MoneyInput, Section, Select, Sheet, Vide,
} from '../components/kit'
import { MODULES, MOIS_COURT, TYPES, labelModule } from '../data/refs'
import { categoriesDe, categoriesPour } from '../lib/referentiel'
import { db, getParametres, now, stamp, uid } from '../db'
import { estRealisee, anneeDe } from '../lib/compute'
import { fmt } from '../lib/money'
import type { LignePlan, ModuleId, TypeOp } from '../types'

/** Lignes proposées au démarrage : de quoi poser une estimation en deux minutes. */
const AMORCE: [ModuleId, TypeOp, string][] = [
  ['general', 'revenu', 'Salaire'],
  ['general', 'depense', 'Loyer'],
  ['general', 'depense', 'Alimentation / Courses'],
  ['general', 'depense', 'Électricité'],
  ['general', 'depense', 'Transport en commun'],
  ['general', 'depense', 'Internet / Box'],
  ['general', 'depense', 'Santé / Pharmacie'],
  ['general', 'depense', 'Imprévus / Divers'],
  ['general', 'epargne', 'Épargne (versement)'],
]

export default function Estimation() {
  const p = useLiveQuery(() => getParametres(), [])
  const lignes = useLiveQuery(() => db.plan.toArray(), [], [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [ajout, setAjout] = useState<{ module: ModuleId; type: TypeOp; categorie: string } | null>(null)
  if (!p) return null

  const annee = p.anneeTravail
  const mesLignes = lignes.filter((l) => l.annee === annee)
  const totalLigne = (l: LignePlan) => l.mois.reduce((s, v) => s + (v || 0), 0)
  const somme = (t: TypeOp) =>
    mesLignes.filter((l) => l.type === t).reduce((s, l) => s + totalLigne(l), 0)

  const reelDe = (l: LignePlan) => ecritures
    .filter((e) => anneeDe(e) === annee && estRealisee(e) && e.module === l.module
      && e.type === l.type && e.categorie === l.categorie)
    .reduce((s, e) => s + e.montantBase, 0)

  const creer = async (module: ModuleId, type: TypeOp, categorie: string) => {
    if (mesLignes.some((l) => l.module === module && l.type === type && l.categorie === categorie)) return
    await db.plan.put(stamp({
      id: uid(), annee, module, type, categorie, mois: Array(12).fill(0),
    }) as LignePlan)
  }

  const majMois = (l: LignePlan, i: number, v: number) => {
    const mois = [...l.mois]; mois[i] = v
    void db.plan.put({ ...l, mois, updatedAt: now() })
  }

  const remplirTout = (l: LignePlan, v: number) =>
    void db.plan.put({ ...l, mois: Array(12).fill(v), updatedAt: now() })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Kpi label="Revenus prévus" valeur={fmt(p, somme('revenu'), { court: true })} ton="green" />
        <Kpi label="Dépenses prévues" valeur={fmt(p, somme('depense'), { court: true })} ton="red" />
        <Kpi label="Épargne prévue" valeur={fmt(p, somme('epargne') + somme('investissement'), { court: true })} ton="teal" />
        <Kpi label="Solde prévisionnel"
             valeur={fmt(p, somme('revenu') - somme('depense') - somme('remboursement'), { court: true })}
             ton="navy" />
      </div>

      {mesLignes.length === 0 ? (
        <Vide
          texte={`Aucune estimation pour ${annee}. Posez d’abord ce que vous prévoyez, mois par mois.`}
          action={
            <Btn variant="gold" onClick={() => void Promise.all(AMORCE.map((a) => creer(...a)))}>
              <Wand2 size={16} /> Démarrer avec les postes courants
            </Btn>
          }
        />
      ) : (
        <Section
          title={`Estimation ${annee}`}
          action={
            <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
                 onClick={() => setAjout({ module: 'general', type: 'depense', categorie: '' })}>
              <Plus size={14} /> Ligne
            </Btn>
          }
        >
          <div className="space-y-2">
            {mesLignes.map((l) => {
              const total = totalLigne(l)
              const reel = reelDe(l)
              const ratio = total ? reel / total : 0
              const ouvert = ouverte === l.id
              return (
                <Card key={l.id} className="overflow-hidden">
                  <button onClick={() => setOuverte(ouvert ? null : l.id)}
                          className="flex w-full items-center gap-3 p-3 text-left">
                    {ouvert ? <ChevronDown size={16} className="shrink-0 text-surface-400" />
                            : <ChevronRight size={16} className="shrink-0 text-surface-400" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-apex-navy">{l.categorie}</p>
                      <p className="text-2xs text-surface-500">
                        {labelModule(l.module)} · {TYPES.find((t) => t.id === l.type)?.label}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-apex-navy">
                        {fmt(p, total, { court: true })}
                      </p>
                      <p className="text-2xs text-surface-500">
                        réalisé {fmt(p, reel, { court: true })}
                      </p>
                    </div>
                  </button>
                  {total > 0 && (
                    <div className="h-1 w-full bg-surface-200">
                      <div className={`h-full ${ratio > 1 ? 'bg-apex-red' : ratio > p.seuilAlerte ? 'bg-apex-orange' : 'bg-apex-green'}`}
                           style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                    </div>
                  )}
                  {ouvert && (
                    <div className="border-t border-surface-200 bg-surface-50 p-3">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-2xs font-semibold text-surface-500">
                          Même montant tous les mois :
                        </span>
                        <MoneyInput className="w-28 !py-1.5 text-xs" value={l.mois[0] || 0}
                                    onChange={(v) => remplirTout(l, v)} />
                        <button onClick={() => void db.plan.delete(l.id)}
                                className="ml-auto rounded p-1 text-surface-400 hover:bg-apex-blush hover:text-apex-red">
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {MOIS_COURT.map((m, i) => (
                          <label key={m} className="block">
                            <span className="mb-0.5 block text-2xs font-semibold text-surface-500">{m}</span>
                            <MoneyInput className="!px-2 !py-1.5 text-xs" value={l.mois[i] || 0}
                                        onChange={(v) => majMois(l, i, v)} />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </Section>
      )}

      <Sheet open={Boolean(ajout)} titre="Ajouter une ligne" onClose={() => setAjout(null)}
             footer={
               <Btn variant="gold" className="w-full" disabled={!ajout?.categorie}
                    onClick={() => {
                      if (ajout?.categorie) void creer(ajout.module, ajout.type, ajout.categorie)
                      setAjout(null)
                    }}>Ajouter</Btn>
             }>
        {ajout && (
          <>
            <Field label="Module">
              <Select value={ajout.module}
                      onChange={(e) => setAjout({ ...ajout, module: e.target.value as ModuleId, categorie: '' })}>
                {MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </Select>
            </Field>
            <Field label="Type">
              <Select value={ajout.type}
                      onChange={(e) => setAjout({ ...ajout, type: e.target.value as TypeOp, categorie: '' })}>
                {TYPES.filter((t) => t.id !== 'transfert')
                  .map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </Select>
            </Field>
            <Field label="Catégorie">
              <Select value={ajout.categorie}
                      onChange={(e) => setAjout({ ...ajout, categorie: e.target.value })}>
                <option value="">— choisir —</option>
                {(ajout.module === 'general'
                  ? categoriesPour(p, ajout.module, ajout.type)
                  : categoriesDe(p, ajout.module)).map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
          </>
        )}
      </Sheet>
    </div>
  )
}
