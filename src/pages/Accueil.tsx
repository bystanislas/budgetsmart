import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Building2, Heart, Briefcase, ClipboardList, NotebookPen, UserCog } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Kpi, Section } from '../components/kit'
import { APP_SIGNATURE, APP_CONTACT } from '../data/refs'
import { useMois, useT } from '../i18n'
import { db, getParametres } from '../db'
import { agregerAnnee, soldeCompte } from '../lib/compute'
import { fmt } from '../lib/money'

const ETAPES = [
  {
    n: '①', titre: 'accueil.etape1', sous: 'accueil.etape1Sous',
    to: '/parametres', icon: UserCog, fond: 'bg-apex-navy',
  },
  {
    n: '②', titre: 'accueil.etape2', sous: 'accueil.etape2Sous',
    to: '/estimation', icon: ClipboardList, fond: 'bg-apex-steel',
  },
  {
    n: '③', titre: 'accueil.etape3', sous: 'accueil.etape3Sous',
    to: '/journal', icon: NotebookPen, fond: 'bg-apex-gold',
  },
] as const

const MODULES_BTN = [
  { id: 'mariage', titre: 'accueil.mariage', sous: 'accueil.mariageSous', icon: Heart, fond: 'bg-apex-wedding' },
  { id: 'business', titre: 'accueil.projet', sous: 'accueil.projetSous', icon: Briefcase, fond: 'bg-apex-orange' },
  { id: 'immobilier', titre: 'accueil.immo', sous: 'accueil.immoSous', icon: Building2, fond: 'bg-apex-green' },
] as const

export default function Accueil() {
  const nav = useNavigate()
  const t = useT()
  const nomsMois = useMois()
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
            {p.raisonSociale ? `${t('accueil.bonjour')} ${p.raisonSociale}` : t('accueil.bienvenue')}
          </p>
          <p className="mt-1 text-xs text-white/70">
            {p.ville ? `${p.ville}${p.pays ? `, ${p.pays}` : ''} · ` : ''}
            {t('accueil.periodeSuivie')} : {nomsMois.long[p.moisSuivi - 1]} {p.anneeTravail}
          </p>
        </div>
        <div className="h-1 bg-apex-gold" />
      </Card>

      <Section title={t('accueil.parcours')}>
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
                    {t(e.titre)}
                    {fait && <span className="text-2xs font-semibold text-apex-green">{t('commun.fait')}</span>}
                  </p>
                  <p className="truncate text-xs text-surface-500">{t(e.sous)}</p>
                </div>
                <ArrowRight size={18} className="shrink-0 text-surface-400" />
              </Card>
            )
          })}
        </div>
      </Section>

      <Section title={t('accueil.autresBudgets')}>
        <div className="grid grid-cols-3 gap-2.5">
          {MODULES_BTN.map((m) => (
            <Card key={m.id} onClick={() => nav(`/module/${m.id}`)}
                  className="flex flex-col items-center gap-2 p-3 text-center">
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${m.fond} text-white`}>
                <m.icon size={20} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-apex-navy">{t(m.titre)}</p>
                <p className="text-2xs leading-tight text-surface-500">{t(m.sous)}</p>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title={t('accueil.ouJenSuis')}>
        <div className="grid grid-cols-3 gap-2.5">
          <Kpi label={t('accueil.soldeDuMois')} valeur={fmt(p, mois.solde, { court: true })}
               ton={mois.solde >= 0 ? 'green' : 'red'} onClick={() => nav('/tableau-de-bord')} />
          <Kpi label={t('accueil.depenses')} valeur={fmt(p, mois.depenses, { court: true })} ton="red"
               onClick={() => nav('/tableau-de-bord')} />
          <Kpi label={t('accueil.tresorerie')} valeur={fmt(p, tresorerie, { court: true })} ton="navy"
               onClick={() => nav('/parametres')} />
        </div>
      </Section>

      <p className="pb-2 text-center text-2xs leading-relaxed text-surface-400">
        {APP_SIGNATURE}<br />{APP_CONTACT}
      </p>
    </div>
  )
}
