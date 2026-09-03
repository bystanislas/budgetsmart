import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, Kpi, Puce, Section, Select } from '../components/kit'
import { MOIS, MODULES, couleurModule, labelModule } from '../data/refs'
import { db, getParametres, majParametres } from '../db'
import {
  agregerAnnee, alertes, calculerDime, parCategorie, parModule, soldeCompte,
} from '../lib/compute'
import { fmt, pct } from '../lib/money'

const TON_ALERTE = {
  ok: 'ok', attention: 'attention', grave: 'grave', neutre: 'neutre',
} as const

export default function TableauBord() {
  const p = useLiveQuery(() => getParametres(), [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  const comptes = useLiveQuery(() => db.comptes.toArray(), [], [])
  const plan = useLiveQuery(() => db.plan.toArray(), [], [])
  if (!p) return null

  const annuel = agregerAnnee(p, ecritures, plan)
  const mois = annuel[p.moisSuivi - 1]
  const dime = calculerDime(p, ecritures, p.anneeTravail, p.moisSuivi)
  const tresorerie = comptes.reduce((s, c) => s + soldeCompte(c.id, c.soldeOuverture, ecritures), 0)
  const top = parCategorie(p, ecritures, p.anneeTravail, p.moisSuivi).slice(0, 8)
  const totalTop = top.reduce((s, x) => s + x.montant, 0)
  const modules = parModule(ecritures, p.anneeTravail)
  const repartition = MODULES.map((m) => ({
    nom: m.court, valeur: modules[m.id][p.moisSuivi - 1], couleur: m.couleur,
  })).filter((x) => x.valeur > 0)

  const euro = (v: number) => fmt(p, v, { court: true })

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="flex flex-wrap items-center gap-3 p-3">
        <span className="text-xs font-semibold text-apex-navy">Période</span>
        <Select className="w-36 !py-1.5 text-sm" value={p.moisSuivi}
                onChange={(e) => void majParametres({ moisSuivi: Number(e.target.value) })}>
          {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </Select>
        <Select className="w-24 !py-1.5 text-sm" value={p.anneeTravail}
                onChange={(e) => void majParametres({ anneeTravail: Number(e.target.value) })}>
          {[p.anneeTravail - 2, p.anneeTravail - 1, p.anneeTravail, p.anneeTravail + 1]
            .map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Puce>{p.perimetre === 'general' ? 'Général seul'
          : p.perimetre === 'tout' ? 'Tout confondu' : labelModule(p.perimetre)}</Puce>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Kpi label="Revenus du mois" valeur={euro(mois.revenus)} ton="green" />
        <Kpi label="Dépenses du mois" valeur={euro(mois.depenses)} ton="red"
             note={mois.prevuDepenses ? `Budget ${euro(mois.prevuDepenses)}` : 'Aucun budget'} />
        <Kpi label="Mis de côté" valeur={euro(mois.epargne + mois.investissement)} ton="teal" />
        <Kpi label="Solde du mois" valeur={euro(mois.solde)}
             ton={mois.solde >= 0 ? 'navy' : 'red'} />
        <Kpi label="Taux d’épargne" valeur={pct(mois.tauxEpargne)} ton="gold"
             note={`Cible ${pct(p.tauxEpargneCible)}`} />
        <Kpi label="Trésorerie" valeur={euro(tresorerie)} ton="navy" />
      </div>

      <Section title="Revenus et dépenses de l’année">
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={annuel} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="nom" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                     tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip formatter={(v: number) => fmt(p, v)}
                       contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #dfe3e9' }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="revenus" name="Revenus" fill="#1E6B3C" radius={[3, 3, 0, 0]} />
              <Bar dataKey="depenses" name="Dépenses" fill="#8B1A1A" radius={[3, 3, 0, 0]} />
              <Bar dataKey="epargne" name="Épargne" fill="#10706B" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      <Section title="Trésorerie cumulée">
        <Card className="p-3">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={annuel} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceef2" vertical={false} />
              <XAxis dataKey="nom" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false}
                     tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
              <Tooltip formatter={(v: number) => fmt(p, v)}
                       contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #dfe3e9' }} />
              <Line type="monotone" dataKey="cumul" name="Cumul" stroke="#2E5480"
                    strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </Section>

      {repartition.length > 0 && (
        <Section title="Répartition du mois par module">
          <Card className="p-3">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={repartition} dataKey="valeur" nameKey="nom" innerRadius={45}
                     outerRadius={78} paddingAngle={2}>
                  {repartition.map((r) => <Cell key={r.nom} fill={r.couleur} />)}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(p, v)}
                         contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #dfe3e9' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Section>
      )}

      {p.dimeActive && (
        <Section title="Dîme du mois">
          <Card className="divide-y divide-surface-200">
            {[['Revenus soumis', dime.assiette], ['Dîme due', dime.due],
              ['Déjà versée', dime.versee], ['Reste à verser', dime.reste]].map(([l, v], i) => (
              <div key={l as string} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-surface-600">{l}</span>
                <span className={`text-sm font-bold tabular-nums ${
                  i === 3 && (v as number) > 0 ? 'text-apex-red' : 'text-apex-navy'}`}>
                  {fmt(p, v as number)}
                </span>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {top.length > 0 && (
        <Section title="Où part l’argent ce mois-ci">
          <Card className="divide-y divide-surface-200">
            {top.map((c) => (
              <div key={`${c.module}-${c.categorie}`} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-apex-navy">{c.categorie}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-apex-navy">
                    {fmt(p, c.montant, { court: true })}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
                  <div className="h-full rounded-full"
                       style={{ width: `${totalTop ? (c.montant / totalTop) * 100 : 0}%`,
                                background: couleurModule(c.module) }} />
                </div>
              </div>
            ))}
          </Card>
        </Section>
      )}

      <Section title="Alertes">
        <div className="space-y-2">
          {alertes(p, mois, dime, tresorerie, ecritures.length).map((a, i) => (
            <Card key={i} className="flex items-start gap-2.5 p-3">
              <Puce ton={TON_ALERTE[a.ton]}>
                {a.ton === 'ok' ? '✓' : a.ton === 'grave' ? '!' : a.ton === 'attention' ? '~' : '·'}
              </Puce>
              <p className="text-sm text-surface-700">{a.texte}</p>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  )
}
