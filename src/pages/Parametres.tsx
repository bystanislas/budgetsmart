import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Btn, Card, Field, Input, Kpi, MoneyInput, Puce, Section, Select } from '../components/kit'
import EditeurCategories from '../components/EditeurCategories'
import {
  CAT_DIME, CAT_DON, CAT_OFFRANDE, DEVISES, ETABLISSEMENTS, MOIS, MODULES,
  MOYENS as MOYENS_LIVRES,
} from '../data/refs'
import { db, getParametres, majParametres, stamp, uid } from '../db'
import { soldeCompte } from '../lib/compute'
import { fmt, nomDevise, symboleDevise } from '../lib/money'
import type { Compte } from '../types'

const NATURES_COMPTE = [
  ['courant', 'Compte courant'], ['epargne', 'Épargne'], ['bloque', 'Épargne bloquée'],
  ['mobile', 'Mobile Money'], ['especes', 'Espèces'], ['business', 'Business'],
  ['autre', 'Autre'],
] as const

export default function Parametres() {
  const [moyen, setMoyen] = useState('')
  const p = useLiveQuery(() => getParametres(), [])
  const comptes = useLiveQuery(() => db.comptes.orderBy('nom').toArray(), [], [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  if (!p) return null

  const set = (patch: Parameters<typeof majParametres>[0]) => void majParametres(patch)

  const ajouterMoyen = () => {
    const v = moyen.trim()
    if (v && !p.moyens.includes(v)) set({ moyens: [...p.moyens, v] })
    setMoyen('')
  }
  const total = comptes.reduce((s, c) => s + soldeCompte(c.id, c.soldeOuverture, ecritures), 0)

  const majCompte = (c: Compte, patch: Partial<Compte>) =>
    void db.comptes.put({ ...c, ...patch, updatedAt: new Date().toISOString() })

  const sections = [
    ['identite', '① Identité'],
    ['devise', '② Devise & période'],
    ['soldes', '③ Soldes & objectifs'],
    ['comptes', '④ Comptes'],
    ['dime', '⑤ Dîme, offrandes & dons'],
    ['categories', '⑥ Catégories'],
    ['moyens', '⑦ Moyens de paiement'],
    ['cours', '⑧ Cours des devises'],
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="bg-apex-navy px-3.5 py-2">
          <p className="text-2xs font-bold uppercase tracking-[.14em] text-white">
            Tout se règle ici
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 p-3">
          {sections.map(([id, label]) => (
            <a key={id} href={`#${id}`}
               className="rounded-full border border-surface-300 bg-white px-2.5 py-1
                          text-2xs font-semibold text-surface-600 transition
                          hover:border-apex-gold hover:text-apex-navy">
              {label}
            </a>
          ))}
        </div>
      </Card>

      <div id="identite" className="scroll-mt-20" />
      <Section title="① Identité & coordonnées">
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Raison sociale / Nom">
            <Input value={p.raisonSociale} placeholder="APEX AFRICA"
                   onChange={(e) => set({ raisonSociale: e.target.value })} />
          </Field>
          <Field label="Responsable / Titulaire">
            <Input value={p.responsable} onChange={(e) => set({ responsable: e.target.value })} />
          </Field>
          <Field label="Activité / Fonction">
            <Input value={p.activite} onChange={(e) => set({ activite: e.target.value })} />
          </Field>
          <Field label="Adresse">
            <Input value={p.adresse} onChange={(e) => set({ adresse: e.target.value })} />
          </Field>
          <Field label="Ville">
            <Input value={p.ville} placeholder="Abidjan"
                   onChange={(e) => set({ ville: e.target.value })} />
          </Field>
          <Field label="Pays">
            <Input value={p.pays} placeholder="Côte d’Ivoire"
                   onChange={(e) => set({ pays: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input value={p.telephone} inputMode="tel" placeholder="+225 …"
                   onChange={(e) => set({ telephone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={p.email} inputMode="email"
                   onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Site web">
            <Input value={p.siteWeb} onChange={(e) => set({ siteWeb: e.target.value })} />
          </Field>
          <Field label="RCCM / IFU / N° d’identification" hint="Facultatif">
            <Input value={p.identifiant} onChange={(e) => set({ identifiant: e.target.value })} />
          </Field>
        </Card>
      </Section>

      <div id="devise" className="scroll-mt-20" />
      <Section title="② Devise & période">
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Devise de base"
                 hint="À fixer avant de commencer à saisir : tous les totaux s’y expriment.">
            <Select value={p.deviseBase} onChange={(e) => set({ deviseBase: e.target.value })}>
              {DEVISES.map(([code]) => (
                <option key={code} value={code}>
                  {code} — {nomDevise(code)} ({symboleDevise(code)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Année de travail">
            <Input type="number" value={p.anneeTravail} inputMode="numeric"
                   onChange={(e) => set({ anneeTravail: Number(e.target.value) || p.anneeTravail })} />
          </Field>
          <Field label="Mois de suivi">
            <Select value={p.moisSuivi} onChange={(e) => set({ moisSuivi: Number(e.target.value) })}>
              {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
          </Field>
          <Field label="Périmètre d’analyse"
                 hint="« Général seul » laisse le mariage, l’immobilier et le business à leurs propres pages.">
            <Select value={p.perimetre}
                    onChange={(e) => set({ perimetre: e.target.value as typeof p.perimetre })}>
              <option value="general">Général seul</option>
              <option value="tout">Tout confondu</option>
              {MODULES.filter((m) => m.id !== 'general').map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Select>
          </Field>
        </Card>
      </Section>

      <div id="soldes" className="scroll-mt-20" />
      <Section title="③ Soldes & objectifs">
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Trésorerie initiale" hint="Vos disponibilités au 1er janvier.">
            <MoneyInput value={p.tresorerieInitiale}
                        onChange={(v) => set({ tresorerieInitiale: v })} />
          </Field>
          <Field label="Taux d’épargne cible">
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.tauxEpargneCible * 100)}
                   onChange={(e) => set({ tauxEpargneCible: Number(e.target.value) / 100 })} />
          </Field>
          <Field label="Seuil d’alerte budget (%)">
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.seuilAlerte * 100)}
                   onChange={(e) => set({ seuilAlerte: Number(e.target.value) / 100 })} />
          </Field>
        </Card>
      </Section>

      <div id="comptes" className="scroll-mt-20" />
      <Section
        title="④ Mes comptes"
        action={
          <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
               onClick={() => void db.comptes.put(stamp({
                 id: uid(), nom: 'Nouveau compte', nature: 'courant', soldeOuverture: 0,
               }) as Compte)}>
            <Plus size={14} /> Ajouter
          </Btn>
        }
      >
        <div className="space-y-2">
          {comptes.map((c) => (
            <Card key={c.id} className="grid grid-cols-[1fr_auto] gap-3 p-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <Input value={c.nom} onChange={(e) => majCompte(c, { nom: e.target.value })} />
                <Select value={c.nature}
                        onChange={(e) => majCompte(c, { nature: e.target.value as Compte['nature'] })}>
                  {NATURES_COMPTE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
                <MoneyInput value={c.soldeOuverture}
                            onChange={(v) => majCompte(c, { soldeOuverture: v })} />
                <Input list="etablissements" value={c.etablissement ?? ''}
                       placeholder="Banque, Wave, Orange Money…"
                       onChange={(e) => majCompte(c, { etablissement: e.target.value })} />
                <Input value={c.reference ?? ''} placeholder="Référence (4 derniers chiffres)"
                       onChange={(e) => majCompte(c, { reference: e.target.value })} />
                {c.nature === 'bloque' && (
                  <Input type="date" value={c.blocageJusqu ?? ''}
                         onChange={(e) => majCompte(c, { blocageJusqu: e.target.value })} />
                )}
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="text-sm font-bold text-apex-navy">
                  {fmt(p, soldeCompte(c.id, c.soldeOuverture, ecritures), { court: true })}
                </span>
                <button onClick={() => void db.comptes.delete(c.id)}
                        className="rounded-lg p-1 text-surface-400 hover:bg-apex-blush hover:text-apex-red">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
          <datalist id="etablissements">
            {ETABLISSEMENTS.map((e) => <option key={e} value={e} />)}
          </datalist>
          <p className="text-2xs leading-relaxed text-surface-500">
            Précisez l’établissement de chaque compte : une épargne doit pouvoir se retrouver
            — quelle banque, quel opérateur, et jusqu’à quand elle est bloquée.
          </p>
          <Kpi label="Total disponible" valeur={fmt(p, total)} ton="navy" />
        </div>
      </Section>

      <div id="dime" className="scroll-mt-20" />
      <Section title="⑤ Dîme, offrandes & dons">
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label="Dîme activée"
                 hint="Le montant dû est calculé chaque mois et comparé à ce que vous avez versé.">
            <Select value={p.dimeActive ? 'oui' : 'non'}
                    onChange={(e) => set({ dimeActive: e.target.value === 'oui' })}>
              <option value="non">Non</option>
              <option value="oui">Oui</option>
            </Select>
          </Field>
          <Field label="Taux (%)">
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.dimeTaux * 100)}
                   onChange={(e) => set({ dimeTaux: Number(e.target.value) / 100 })} />
          </Field>
          <Field label="Assiette de calcul">
            <Select value={p.dimeAssiette}
                    onChange={(e) => set({ dimeAssiette: e.target.value as typeof p.dimeAssiette })}>
              <option value="salaire">Salaire uniquement</option>
              <option value="salaire_primes">Salaire + primes</option>
              <option value="tous">Tous les revenus</option>
            </Select>
          </Field>
          <Field
            label="Église / organisation bénéficiaire"
            hint="Reprise automatiquement dans le descriptif, avec la date. Modifiable à chaque saisie."
          >
            <Input value={p.dimeEglise} placeholder="Nom de votre église"
                   onChange={(e) => set({ dimeEglise: e.target.value })} />
          </Field>
          <div className="sm:col-span-2 space-y-2 rounded-xl bg-surface-50 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-surface-500">
              Trois catégories distinctes, trois usages
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Puce ton="attention">{CAT_DIME}</Puce>
              <Puce>{CAT_OFFRANDE}</Puce>
              <Puce>{CAT_DON}</Puce>
            </div>
            <p className="text-2xs leading-relaxed text-surface-500">
              Seule la <strong>{CAT_DIME}</strong> vient en déduction de la dîme due — c’est
              elle que le calcul suit. L’<strong>{CAT_OFFRANDE.toLowerCase()}</strong> et le{' '}
              <strong>{CAT_DON.toLowerCase()}</strong> sont des dépenses à part entière,
              suivies séparément dans les récapitulatifs.
            </p>
          </div>
        </Card>
      </Section>

      <div id="categories" className="scroll-mt-20" />
      <Section title="⑥ Catégories & sous-catégories">
        <EditeurCategories p={p} />
      </Section>

      <div id="moyens" className="scroll-mt-20" />
      <Section title="⑦ Moyens de paiement">
        <Card className="space-y-2.5 p-3">
          <div className="flex flex-wrap gap-1.5">
            {p.moyens.map((m) => (
              <span key={m}
                    className="flex items-center gap-1 rounded-lg border border-surface-200
                               bg-surface-50 px-2 py-1 text-2xs font-semibold text-surface-600">
                {m}
                <button aria-label={`Retirer ${m}`}
                        onClick={() => set({ moyens: p.moyens.filter((x) => x !== m) })}
                        className="text-surface-400 hover:text-apex-red">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="!py-2 !text-sm"
              placeholder="Ajouter un moyen de paiement"
              value={moyen}
              onChange={(e) => setMoyen(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ajouterMoyen()}
            />
            <Btn variant="primary" className="!px-4 !py-2" onClick={ajouterMoyen}>
              <Plus size={16} />
            </Btn>
            <Btn variant="ghost" className="!px-3 !py-2 text-xs"
                 onClick={() => set({ moyens: [...MOYENS_LIVRES] })}>
              Rétablir
            </Btn>
          </div>
        </Card>
      </Section>

      <Section title="⑧ Cours des devises"
               action={<span className="text-2xs text-surface-500">1 unité = X XOF</span>}>
        <Card className="divide-y divide-surface-200">
          {DEVISES.filter(([c]) => c !== 'XOF').slice(0, 8).map(([code]) => (
            <div key={code} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm font-semibold text-apex-navy">
                {code} <span className="font-normal text-surface-500">{nomDevise(code)}</span>
              </span>
              <MoneyInput className="w-32" value={p.cours[code] ?? 0}
                          onChange={(v) => set({ cours: { ...p.cours, [code]: v } })} />
            </div>
          ))}
        </Card>
      </Section>
    </div>
  )
}
