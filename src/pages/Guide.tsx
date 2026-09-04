import { useState } from 'react'
import {
  BookOpen, Building2, ChevronDown, ClipboardList, FileDown, Globe2, HelpCircle,
  Heart, FileSpreadsheet, NotebookPen, PieChart, Share2, ShieldCheck, Sparkles,
  ArrowLeftRight, UserCog,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Btn, Card } from '../components/kit'
import { GUIDE, type IconeGuide } from '../data/guide'
import { exporterGuidePdf } from '../lib/export-guide-pdf'
import { useLangue, useT } from '../i18n'

const ICONES: Record<IconeGuide, typeof Sparkles> = {
  depart: Sparkles,
  identite: UserCog,
  estimation: ClipboardList,
  saisie: NotebookPen,
  types: ArrowLeftRight,
  suivi: PieChart,
  dime: Heart,
  modules: Building2,
  rapports: FileSpreadsheet,
  donnees: ShieldCheck,
  langue: Globe2,
  questions: HelpCircle,
}

export default function Guide() {
  const t = useT()
  const langue = useLangue()
  const nav = useNavigate()
  // La première section est ouverte : on ne fait jamais face à un mur fermé.
  const [ouverte, setOuverte] = useState<string | null>(GUIDE[0]?.id ?? null)
  const dit = (b: { fr: string; en: string }) => (langue === 'en' ? b.en : b.fr)

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-apex-navy px-4 py-4 text-white">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
            <BookOpen size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">{t('guide.titre')}</p>
            <p className="mt-0.5 text-2xs text-white/70">{t('guide.sousTitre')}</p>
          </div>
        </div>
        <div className="h-1 bg-apex-gold" />
      </Card>

      <div className="space-y-2.5">
        {GUIDE.map((s, i) => {
          const Icone = ICONES[s.icone]
          const active = ouverte === s.id
          return (
            <Card key={s.id} className="overflow-hidden">
              <button
                onClick={() => setOuverte(active ? null : s.id)}
                aria-expanded={active}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white
                                 ${active ? 'bg-apex-gold' : 'bg-apex-navy'}`}>
                  <Icone size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-apex-navy">{dit(s.titre)}</p>
                  <p className="text-2xs text-surface-500">
                    {t('guide.etape', { n: i + 1, total: GUIDE.length })}
                  </p>
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-surface-400 transition-transform
                              ${active ? 'rotate-180' : ''}`}
                />
              </button>

              {active && (
                <div className="border-t border-surface-200 px-3.5 pb-3.5 pt-3">
                  <p className="text-xs leading-relaxed text-apex-navy">{dit(s.intro)}</p>
                  <ul className="mt-2.5 space-y-2">
                    {s.points.map((p, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-apex-gold" />
                        <span className="text-xs leading-relaxed text-surface-600">{dit(p)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="grid gap-2 p-3">
        <Btn variant="ghost" className="w-full" onClick={() => exporterGuidePdf(langue)}>
          <FileDown size={16} /> {t('partage.depuisGuide')}
        </Btn>
        <Btn variant="ghost" className="w-full" onClick={() => nav('/partager')}>
          <Share2 size={16} /> {t('partage.titre')}
        </Btn>
        <p className="px-1 text-center text-2xs leading-relaxed text-surface-500">
          {t('partage.depuisGuideAide')}
        </p>
      </Card>

      <Card className="space-y-3 bg-apex-cream p-4 text-center">
        <p className="text-xs leading-relaxed text-apex-navy">{t('guide.pret')}</p>
        <Btn variant="gold" className="w-full" onClick={() => nav('/parametres')}>
          {t('guide.commencer')}
        </Btn>
      </Card>
    </div>
  )
}
