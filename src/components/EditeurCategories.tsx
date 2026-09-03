import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Btn, Card, Input, Select } from './kit'
import { MODULES } from '../data/refs'
import { majParametres } from '../db'
import { referentielLivre } from '../lib/referentiel'
import { labelModule, useT } from '../i18n'
import type { ModuleId, Parametres } from '../types'

/**
 * Éditeur du référentiel : catégories et sous-catégories, module par module.
 *
 * Tout se renomme, s'ajoute et se supprime ici — et nulle part ailleurs. Les
 * écritures déjà saisies gardent leur libellé : supprimer une catégorie ne
 * réécrit pas le passé, elle disparaît simplement des propositions.
 */
export default function EditeurCategories({ p }: { p: Parametres }) {
  const t = useT()
  const [module, setModule] = useState<ModuleId>('general')
  const [ouverte, setOuverte] = useState<string | null>(null)
  const [nouvelle, setNouvelle] = useState('')
  const [nouvelleSous, setNouvelleSous] = useState('')

  const liste = p.categories[module] ?? []

  const enregistrer = (categories: string[], sousCategories = p.sousCategories) =>
    void majParametres({
      categories: { ...p.categories, [module]: categories },
      sousCategories,
    })

  const renommer = (avant: string, apres: string) => {
    const propre = apres.trim()
    if (!propre || (propre !== avant && liste.includes(propre))) return
    const sous = { ...p.sousCategories }
    if (sous[avant]) {
      sous[propre] = sous[avant]
      delete sous[avant]
    }
    enregistrer(liste.map((c) => (c === avant ? propre : c)), sous)
    if (ouverte === avant) setOuverte(propre)
  }

  const supprimer = (c: string) => {
    const sous = { ...p.sousCategories }
    delete sous[c]
    enregistrer(liste.filter((x) => x !== c), sous)
  }

  const ajouter = () => {
    const propre = nouvelle.trim()
    if (!propre || liste.includes(propre)) return
    enregistrer([...liste, propre])
    setNouvelle('')
    setOuverte(propre)
  }

  const majSous = (categorie: string, valeurs: string[]) =>
    void majParametres({ sousCategories: { ...p.sousCategories, [categorie]: valeurs } })

  const reinitialiser = () => {
    const livre = referentielLivre(p.langue)
    const sous = { ...p.sousCategories }
    for (const [cle, valeurs] of Object.entries(livre.sousCategories)) {
      if (livre.categories[module].includes(cle)) sous[cle] = [...valeurs]
    }
    enregistrer([...livre.categories[module]], sous)
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Select className="flex-1 !py-2 text-sm" value={module}
                onChange={(e) => { setModule(e.target.value as ModuleId); setOuverte(null) }}>
          {MODULES.map((m) => (
            <option key={m.id} value={m.id}>{labelModule(t, m.id)} — {(p.categories[m.id] ?? []).length}</option>
          ))}
        </Select>
        <Btn variant="ghost" className="!px-3 !py-2 text-xs" onClick={reinitialiser}>
          <RotateCcw size={14} /> {t('commun.retablir')}
        </Btn>
      </div>

      <Card className="divide-y divide-surface-200">
        {liste.map((c) => {
          const sous = p.sousCategories[c] ?? []
          const estOuverte = ouverte === c
          return (
            <div key={c}>
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <button
                  onClick={() => setOuverte(estOuverte ? null : c)}
                  aria-label={estOuverte ? t('categories.replier') : t('categories.deplier')}
                  className="rounded-lg p-1 text-surface-400 hover:bg-surface-100"
                >
                  {estOuverte ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <input
                  defaultValue={c}
                  onBlur={(e) => renommer(c, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2
                             py-1.5 text-sm text-apex-navy outline-none
                             hover:border-surface-200 focus:border-apex-gold focus:bg-white"
                />
                {sous.length > 0 && (
                  <span className="shrink-0 text-2xs text-surface-400">{sous.length}</span>
                )}
                <button onClick={() => supprimer(c)} aria-label={`${t('commun.supprimer')} ${c}`}
                        className="rounded-lg p-1 text-surface-300 hover:bg-apex-blush hover:text-apex-red">
                  <Trash2 size={15} />
                </button>
              </div>

              {estOuverte && (
                <div className="space-y-2 bg-surface-50 px-3 py-2.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-surface-500">
                    {t('categories.sousCategoriesProposees')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sous.map((sc) => (
                      <span key={sc}
                            className="flex items-center gap-1 rounded-lg border border-surface-200
                                       bg-white px-2 py-1 text-2xs font-semibold text-surface-600">
                        {sc}
                        <button aria-label={`${t('commun.supprimer')} ${sc}`}
                                onClick={() => majSous(c, sous.filter((x) => x !== sc))}
                                className="text-surface-400 hover:text-apex-red">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {sous.length === 0 && (
                      <span className="text-2xs italic text-surface-400">
                        {t('categories.aucuneSousCategorie')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="!py-1.5 !text-xs"
                      placeholder={t('categories.ajouterSousCategorie')}
                      value={ouverte === c ? nouvelleSous : ''}
                      onChange={(e) => setNouvelleSous(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        const v = nouvelleSous.trim()
                        if (v && !sous.includes(v)) majSous(c, [...sous, v])
                        setNouvelleSous('')
                      }}
                    />
                    <Btn
                      variant="ghost" className="!px-3 !py-1.5"
                      onClick={() => {
                        const v = nouvelleSous.trim()
                        if (v && !sous.includes(v)) majSous(c, [...sous, v])
                        setNouvelleSous('')
                      }}
                    >
                      <Plus size={14} />
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <div className="flex gap-2">
        <Input
          className="!py-2 !text-sm"
          placeholder={t('categories.ajouterCategorie')}
          value={nouvelle}
          onChange={(e) => setNouvelle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ajouter()}
        />
        <Btn variant="primary" className="!px-4 !py-2" onClick={ajouter}>
          <Plus size={16} />
        </Btn>
      </div>

      <p className="text-2xs leading-relaxed text-surface-500">
        {t('categories.aide')}
      </p>
    </div>
  )
}
