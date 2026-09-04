import clsx from 'clsx'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState, type ReactNode } from 'react'

/* ---------------------------------------------------------------- cartes */
export function Card({ className, children, onClick }: {
  className?: string; children: ReactNode; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-surface-200 bg-white shadow-card',
        onClick && 'cursor-pointer transition hover:shadow-raised active:scale-[.995]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Section({ title, action, children, className }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={clsx('space-y-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-[.14em] text-apex-steel">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ------------------------------------------------------------ indicateur */
export function Kpi({ label, valeur, note, ton = 'navy', onClick }: {
  label: string; valeur: string; note?: string
  ton?: 'navy' | 'green' | 'red' | 'gold' | 'teal' | 'orange'
  onClick?: () => void
}) {
  const couleur = {
    navy: 'text-apex-navy', green: 'text-apex-green', red: 'text-apex-red',
    gold: 'text-apex-gold', teal: 'text-apex-teal', orange: 'text-apex-orange',
  }[ton]
  const barre = {
    navy: 'bg-apex-navy', green: 'bg-apex-green', red: 'bg-apex-red',
    gold: 'bg-apex-gold', teal: 'bg-apex-teal', orange: 'bg-apex-orange',
  }[ton]
  return (
    <Card onClick={onClick} className="overflow-hidden">
      <div className={clsx('h-1 w-full', barre)} />
      <div className="p-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-surface-500">{label}</p>
        <p className={clsx('mt-1 text-xl font-bold leading-tight', couleur)}>{valeur}</p>
        {note && <p className="mt-0.5 text-2xs text-surface-500">{note}</p>}
      </div>
    </Card>
  )
}

/* ---------------------------------------------------------------- champs */
export function Field({ label, hint, children }: {
  label: string; hint?: string; children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-apex-navy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-2xs text-surface-500">{hint}</span>}
    </label>
  )
}

const CHAMP =
  'rounded-xl border border-surface-300 bg-white px-3 py-2.5 text-sm outline-none ' +
  'transition focus:border-apex-gold focus:ring-2 focus:ring-apex-gold/25 disabled:bg-surface-100'

/**
 * Tailwind tranche les conflits par l'ordre de la feuille de style, jamais par
 * l'ordre où les classes sont écrites : une largeur passée par l'appelant
 * (`w-28`, `flex-1`) perdait silencieusement contre le `w-full` du champ, qui
 * s'étirait alors et écrasait ses voisins. On ne pose donc « pleine largeur »
 * que si l'appelant n'a pas déjà dit quelle largeur il veut.
 */
const base = (perso?: string) =>
  clsx(CHAMP, !/(?:^|\s)!?(?:w-|flex-)/.test(perso ?? '') && 'w-full', perso)

export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={base(p.className)} />
}

export function Select(p: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={base(clsx('appearance-none pr-8', p.className))} />
}

export function TextArea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={base(clsx('min-h-[72px]', p.className))} />
}

/** Saisie de montant : clavier numérique sur mobile, séparateurs tolérés. */
/**
 * Saisie d'un montant ou d'un taux.
 *
 * Le champ garde son propre texte plutôt que de se réafficher depuis le
 * nombre : « 655. » ou « 0, » sont des étapes de frappe légitimes qu'un
 * nombre ne sait pas représenter. Sans cela le séparateur décimal était
 * effacé à l'instant même où on le tapait, et « 655,957 » devenait 655957.
 */
const nombreDepuisTexte = (texte: string): number => {
  const n = Number(texte.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function MoneyInput({ value, onChange, ...rest }: {
  value: number; onChange: (v: number) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const afficher = (v: number) => (v === 0 ? '' : String(v))
  const [texte, setTexte] = useState(() => afficher(value))

  // Le champ se resynchronise si la valeur change ailleurs (chargement des
  // paramètres, restauration d'une sauvegarde), jamais pendant la frappe.
  useEffect(() => {
    if (nombreDepuisTexte(texte) !== value) setTexte(afficher(value))
  }, [value])

  return (
    <input
      {...rest}
      inputMode="decimal"
      value={texte}
      placeholder="0"
      onChange={(e) => {
        // Un seul séparateur décimal, un signe moins en tête au plus.
        const propre = e.target.value
          .replace(/[^\d.,-]/g, '')
          .replace(/(?!^)-/g, '')
          .replace(/([.,])(?=.*[.,])/g, '')
        setTexte(propre)
        onChange(nombreDepuisTexte(propre))
      }}
      className={base(clsx('text-right font-semibold tabular-nums', rest.className))}
    />
  )
}

/* --------------------------------------------------------------- boutons */
export function Btn({ variant = 'primary', className, ...p }: {
  variant?: 'primary' | 'ghost' | 'danger' | 'gold'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-apex-navy text-white hover:bg-apex-ink',
    gold: 'bg-apex-gold text-white hover:bg-apex-sun',
    ghost: 'border border-surface-300 bg-white text-apex-navy hover:bg-surface-50',
    danger: 'bg-apex-red text-white hover:opacity-90',
  }[variant]
  return (
    <button
      {...p}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
        'transition active:scale-[.98] disabled:opacity-50', styles, className,
      )}
    />
  )
}

/* --------------------------------------------------- panneau de saisie */
export function Sheet({ open, titre, onClose, children, footer }: {
  open: boolean; titre: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-apex-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-surface-50
                      shadow-pop animate-slide-up sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-surface-200 px-4 py-3">
          <h3 className="text-base font-bold text-apex-navy">{titre}</h3>
          <button onClick={onClose} aria-label="Fermer"
                  className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-200">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-surface-200 bg-white px-4 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ---------------------------------------------------------------- divers */
export function Vide({ texte, action }: { texte: string; action?: ReactNode }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-sm text-surface-500">{texte}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </Card>
  )
}

export function Puce({ children, ton = 'neutre' }: {
  children: ReactNode; ton?: 'neutre' | 'ok' | 'attention' | 'grave'
}) {
  const c = {
    neutre: 'bg-surface-100 text-surface-600',
    ok: 'bg-apex-mint text-apex-green',
    attention: 'bg-apex-cream text-apex-gold',
    grave: 'bg-apex-blush text-apex-red',
  }[ton]
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-2xs font-semibold', c)}>{children}</span>
  )
}
