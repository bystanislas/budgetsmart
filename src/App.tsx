import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { Bell, Home, NotebookPen, PieChart, Settings, Table2 } from 'lucide-react'
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { finaliserRedirection, lienDeConnexionRecu, useUtilisateur } from './lib/auth'
import { useT } from './i18n'
import { useNouveautes } from './lib/nouveautes'
import { definirUtilisateurSync, pousserTout, tirerTout } from './lib/sync'
import { getParametres } from './db'
import { APP_BRAND, APP_NAME } from './data/refs'
import Accueil from './pages/Accueil'
import Estimation from './pages/Estimation'
import Journal from './pages/Journal'
import ModulePage from './pages/Module'
import Parametres from './pages/Parametres'
import Guide from './pages/Guide'
import Partager from './pages/Partager'
import Nouveautes from './pages/Nouveautes'
import Plus from './pages/Plus'
import TableauBord from './pages/TableauBord'

const ONGLETS = [
  { to: '/', icon: Home, cle: 'nav.accueil' },
  { to: '/estimation', icon: Table2, cle: 'nav.estimation' },
  { to: '/journal', icon: NotebookPen, cle: 'nav.journal' },
  { to: '/tableau-de-bord', icon: PieChart, cle: 'nav.tableau' },
  { to: '/plus', icon: Settings, cle: 'nav.plus' },
] as const

export default function App() {
  const p = useLiveQuery(() => getParametres(), [])
  const utilisateur = useUtilisateur()
  const nav = useNavigate()
  const t = useT()
  const nouveautes = useNouveautes()

  // Retour depuis le lien de connexion reçu par email : la page « Plus »
  // porte le formulaire qui termine l'opération.
  useEffect(() => {
    if (lienDeConnexionRecu()) nav('/plus')
    // Retour d'une connexion Google par redirection : Firebase a besoin qu'on
    // relise le résultat au chargement pour que la session soit établie.
    void finaliserRedirection()
  }, [])

  // Un compte connecté active la sauvegarde en ligne. On rapatrie d'abord ce
  // qui existe déjà — c'est ce qui restaure un nouvel appareil — puis on
  // publie l'état local : sans cette seconde étape, tout ce qui a été saisi
  // avant la création du compte ne partirait jamais dans le cloud.
  useEffect(() => {
    definirUtilisateurSync(utilisateur?.uid ?? null)
    if (!utilisateur) return
    const { uid } = utilisateur
    void (async () => {
      await tirerTout(uid)
      await pousserTout(uid)
    })()
  }, [utilisateur?.uid])

  return (
    /* En-tête et menu font partie de la mise en page, et non de flottants
       posés par-dessus : seul le contenu défile. Un menu en « fixed » saute
       sur mobile dès que la barre d'adresse du navigateur s'escamote, et son
       fond translucide laissait défiler le texte derrière lui. */
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface-100">
      <header className="shrink-0 border-b border-apex-ink/20 bg-apex-navy
                         px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="./icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">{APP_NAME}</p>
              <p className="text-2xs text-white/60">{APP_BRAND}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {p && (
              <p className="text-right text-2xs text-white/70">
                {p.raisonSociale || t('rapport.monBudget')}
                <br />
                <span className="text-white/50">{p.deviseBase} · {p.anneeTravail}</span>
              </p>
            )}
            {/* La cloche n'existe que s'il y a réellement quelque chose à annoncer. */}
            {nouveautes.length > 0 && (
              <button
                onClick={() => nav('/nouveautes')}
                aria-label={t('nouveautes.titre')}
                className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl
                           bg-white/10 text-white transition hover:bg-white/20"
              >
                <Bell size={18} strokeWidth={2.2} />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full
                                 bg-apex-gold ring-2 ring-apex-navy" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="mx-auto max-w-3xl">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/estimation" element={<Estimation />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/tableau-de-bord" element={<TableauBord />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/plus" element={<Plus />} />
          <Route path="/nouveautes" element={<Nouveautes />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/partager" element={<Partager />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </main>

      <nav className="shrink-0 border-t border-surface-200 bg-white
                      pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl">
          {ONGLETS.map(({ to, icon: Icon, cle }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-2xs font-semibold transition ${
                  isActive ? 'text-apex-gold' : 'text-surface-500'
                }`
              }
            >
              <Icon size={20} strokeWidth={2.2} />
              {t(cle)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
