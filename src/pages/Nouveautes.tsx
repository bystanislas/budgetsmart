import { useEffect } from 'react'
import { Bell, CheckCircle2, Sparkles, Wrench } from 'lucide-react'
import { Card, Puce, Section } from '../components/kit'
import { JOURNAL, type GenreChangement } from '../data/nouveautes'
import { VERSION_ACTUELLE, marquerLues, nouveautesNonLues } from '../lib/nouveautes'
import { useLangue, useT } from '../i18n'

const ALLURE: Record<GenreChangement, {
  icone: typeof Sparkles; fond: string; ton: 'ok' | 'info' | 'alerte'
}> = {
  nouveau: { icone: Sparkles, fond: 'bg-apex-gold', ton: 'ok' },
  amelioration: { icone: CheckCircle2, fond: 'bg-apex-steel', ton: 'info' },
  correction: { icone: Wrench, fond: 'bg-apex-green', ton: 'info' },
}

export default function Nouveautes() {
  const t = useT()
  const langue = useLangue()

  // Les versions non lues sont relevées avant de marquer l'écran comme lu :
  // c'est ce qui permet de les mettre en avant pendant cette visite.
  const aSignaler = new Set(nouveautesNonLues().map((v) => v.version))
  useEffect(() => { marquerLues() }, [])

  const date = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(langue === 'en' ? 'en-GB' : 'fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-apex-navy px-4 py-4 text-white">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
            <Bell size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">{t('nouveautes.titre')}</p>
            <p className="mt-0.5 text-2xs text-white/70">{t('nouveautes.sousTitre')}</p>
          </div>
        </div>
        <div className="h-1 bg-apex-gold" />
      </Card>

      {aSignaler.size === 0 && (
        <Card className="p-4 text-center text-xs text-surface-500">
          {t('nouveautes.aucune')}
        </Card>
      )}

      <Section title={t('nouveautes.historique')}>
        <div className="space-y-3">
          {JOURNAL.map((v) => (
            <Card key={v.version} className="overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-surface-200
                              bg-surface-50 px-3.5 py-2">
                <p className="text-2xs font-bold uppercase tracking-wider text-apex-navy">
                  {t('nouveautes.versionDu', { version: v.version, date: date(v.date) })}
                </p>
                {aSignaler.has(v.version) && (
                  <Puce ton="ok">{t('nouveautes.dejaActif')}</Puce>
                )}
              </div>
              <ul className="divide-y divide-surface-200">
                {v.changements.map((c, i) => {
                  const { icone: Icone, fond } = ALLURE[c.genre]
                  return (
                    <li key={i} className="flex items-start gap-3 px-3.5 py-3">
                      <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center
                                       rounded-lg ${fond} text-white`}>
                        <Icone size={15} strokeWidth={2.4} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xs font-bold uppercase tracking-wider text-surface-500">
                          {t(`nouveautes.${c.genre}` as 'nouveautes.nouveau')}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-apex-navy">
                          {langue === 'en' ? c.en : c.fr}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <p className="pb-2 text-center text-2xs text-surface-400">
        Budget Smart {VERSION_ACTUELLE}
      </p>
    </div>
  )
}
