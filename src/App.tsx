import { useLiveQuery } from 'dexie-react-hooks'
import { Home, NotebookPen, PieChart, Settings, Table2 } from 'lucide-react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { getParametres } from './db'
import { APP_BRAND, APP_NAME } from './data/refs'
import Accueil from './pages/Accueil'
import Estimation from './pages/Estimation'
import Journal from './pages/Journal'
import ModulePage from './pages/Module'
import Parametres from './pages/Parametres'
import Plus from './pages/Plus'
import TableauBord from './pages/TableauBord'

const ONGLETS = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/estimation', icon: Table2, label: 'Estimation' },
  { to: '/journal', icon: NotebookPen, label: 'Journal' },
  { to: '/tableau-de-bord', icon: PieChart, label: 'Tableau' },
  { to: '/plus', icon: Settings, label: 'Plus' },
]

export default function App() {
  const p = useLiveQuery(() => getParametres(), [])

  return (
    <div className="min-h-[100dvh] bg-surface-100 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 border-b border-apex-ink/20 bg-apex-navy
                         px-4 pb-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="./icon-192.png" alt="" className="h-8 w-8 rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">{APP_NAME}</p>
              <p className="text-2xs text-white/60">{APP_BRAND}</p>
            </div>
          </div>
          {p && (
            <p className="text-right text-2xs text-white/70">
              {p.raisonSociale || 'Mon budget'}
              <br />
              <span className="text-white/50">{p.deviseBase} · {p.anneeTravail}</span>
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/estimation" element={<Estimation />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/tableau-de-bord" element={<TableauBord />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/plus" element={<Plus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-200 bg-white/95
                      pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {ONGLETS.map(({ to, icon: Icon, label }) => (
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
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
