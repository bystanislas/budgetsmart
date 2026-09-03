import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Building2, Heart, Briefcase, ClipboardList, NotebookPen, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Kpi, Section } from '../components/kit'
import { APP_SIGNATURE, APP_CONTACT } from '../data/refs'
import { db, getParametres } from '../db'
import { agregerAnnee, soldeCompte } from '../lib/compute'
import { fmt } from '../lib/money'

const ETAPES = [
  {
    n: '①', titre: 'Remplir mes informations', sous: 'Nom, devise, comptes',
    to: '/parametres', icon: UserCog, fond: 'bg-apex-navy',
  },
  {
    n: '②', titre: 'Estimer mon année', sous: 'Charges fixes, variables, imprévus',
    to: '/estimation', icon: ClipboardList, fond: 'bg-apex-steel',
  },
  {
    n: '③', titre: 'Budget Smart', sous: 'Ma saisie de tous les jours',
    to: '/journal', icon: NotebookPen, fond: 'bg-apex-gold',
  },
]

const MODULES_BTN = [
  { id: 'mariage', titre: 'Mariage', sous: 'Postes, devis, financement', icon: Heart, fond: 'bg-apex-wedding' },
  { id: 'business', titre: 'Projet', sous: 'Chiffre d’affaires, marge', icon: Briefcase, fond: 'bg-apex-orange' },
  { id: 'immobilier', titre: 'Immo', sous: 'Terrains, travaux, loyers', icon: Building2, fond: 'bg-apex-green' },
]

export default function Accueil() {
  const nav = useNavigate()
  const p = useLiveQuery(() => getParametres(), [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])
  const comptes = useLiveQuery(() => db.comptes.toArray(), [], [])
  const plan = useLiveQuery(() => db.plan.toArray(), [], [])
  if (!p) return null

  const mois = agregerAnnee(p, ecritures, plan)[p.moisSuivi - 1]
  const tresorerie = comptes.reduce(
    (s, c) => s + soldeCompte(c.id, c.soldeOuverture, ecritures), 0,
  )
  const faits = {
    infos: Boolean(p.raisonSociale),
    estimation: plan.some((l) => l.annee === p.anneeTravail && l.mois.some((v) => v > 0)),
    journal: ecritures.length > 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="bg-apex-navy px-4 py-5 text-white">
          <p className="text-lg font-bold leading-tight">
            Bonjour {p.raisonSociale || 'et bienvenue'}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {p.ville ? `${p.ville}${p.pays ? `, ${p.pays}` : ''} · ` : ''}
            Période suivie : {new Intl.DateTimeFormat('fr-FR', { month: 'long' })
              .format(new Date(2000, p.moisSuivi - 1))} {p.anneeTravail}
          </p>
        </div>
        <div className="h-1 bg-apex-gold" />
      </Card>

      <Section title="Votre parcours — dans cet ordre">
        <div className="space-y-2.5">
          {ETAPES.map((e, i) => {
            const fait = [faits.infos, faits.estimation, faits.journal][i]
            return (
              <Card key={e.to} onClick={() => nav(e.to)} className="flex items-center gap-3 p-3">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${e.fond} text-white`}>
                  <e.icon size={22} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-bold text-apex-navy">
                    <span className="text-apex-gold">{e.n}</span>
                    {e.titre}
                    {fait && <span className="text-2xs font-semibold text-apex-green">✓ fait</span>}
                  </p>
                  <p className="truncate text-xs text-surface-500">{e.sous}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-surface-400" />
              </Card>
            )
          })}
        </div>
      </Section>

      <Section title="Mes modules — chacun sa page, aucun mélange">
        <div className="grid grid-cols-3 gap-2.5">
          {MODULES_BTN.map((m) => (
            <Card key={m.id} onClick={() => nav(`/module/${m.id}`)}
                  className="flex flex-col items-center gap-2 p-3 text-center">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${m.fond} text-white`}>
                <m.icon size={20} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-apex-navy">{m.titre}</p>
                <p className="text-2xs leading-tight text-surface-500">{m.sous}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Où j’en suis aujourd’hui">
        <div className="grid grid-cols-3 gap-2.5">
          <Kpi label="Solde du mois" valeur={fmt(p, mois.solde, { court: true })}
               ton={mois.solde >= 0 ? 'green' : 'red'} onClick={() => nav('/tableau-de-bord')} />
          <Kpi label="Dépenses" valeur={fmt(p, mois.depenses, { court: true })} ton="red"
               onClick={() => nav('/tableau-de-bord')} />
          <Kpi label="Trésorerie" valeur={fmt(p, tresorerie, { court: true })} ton="navy"
               onClick={() => nav('/parametres')} />
        </div>
      </Section>

      <p className="pb-2 text-center text-2xs leading-relaxed text-surface-400">
        {APP_SIGNATURE}<br />{APP_CONTACT}
      </p>
    </div>
  )
}
