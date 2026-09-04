import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Btn, Card, Field, Input, Kpi, MoneyInput, Puce, Section, Select } from '../components/kit'
import EditeurCategories from '../components/EditeurCategories'
import {
  CAT_DIME, CAT_DON, CAT_OFFRANDE, DEVISES, ETABLISSEMENTS, MOIS, MODULES,
  MOYENS as MOYENS_LIVRES,
} from '../data/refs'
import { codePays, devinerPays, indicatifDe, nomPays, paysLocalises } from '../data/pays'
import { useUtilisateur } from '../lib/auth'
import { LANGUES, useT } from '../i18n'
import { referentielIntact, referentielLivre } from '../lib/referentiel'
import { EGLISE_DEFAUT } from '../data/refs'
import { EGLISE_DEFAUT_EN } from '../data/refs-en'
import { db, getParametres, majParametres, stamp, uid } from '../db'
import { soldeCompte } from '../lib/compute'
import { fmt, nomDevise, symboleDevise } from '../lib/money'
import type { Compte } from '../types'

/** Sépare l'indicatif du numéro dans le champ téléphone, sans champ séparé à migrer. */
function decomposerTelephone(telephone: string, pays: string): [string, string] {
  const m = telephone.match(/^(\+\d{1,4})\s*(.*)$/)
  return m ? [m[1], m[2]] : [indicatifDe(pays), telephone]
}

const NATURES_COMPTE = [
  ['courant', 'parametres.natureCourant'], ['epargne', 'parametres.natureEpargne'],
  ['bloque', 'parametres.natureBloque'], ['mobile', 'parametres.natureMobile'],
  ['especes', 'parametres.natureEspeces'], ['business', 'parametres.natureBusiness'],
  ['autre', 'parametres.natureAutre'],
] as const

export default function Parametres() {
  const [moyen, setMoyen] = useState('')
  const utilisateur = useUtilisateur()
  const t = useT()
  const p = useLiveQuery(() => getParametres(), [])
  const comptes = useLiveQuery(() => db.comptes.orderBy('nom').toArray(), [], [])
  const ecritures = useLiveQuery(() => db.ecritures.toArray(), [], [])

  // Devine le pays au premier lancement, depuis le fuseau horaire — sans
  // réseau ni permission. Ne s'applique que si rien n'a encore été choisi.
  useEffect(() => {
    if (p && !p.pays) {
      const suggestion = devinerPays(p.langue)
      if (suggestion) void majParametres({ pays: suggestion })
    }
  }, [p?.pays])

  if (!p) return null

  const listePays = paysLocalises(p.langue)

  // Les cours sont conservés dans une référence unique (le franc CFA) pour que
  // changer de devise de base ne réécrive jamais la table. On les affiche
  // toutefois dans la devise choisie, seule lecture qui ait un sens pour
  // l'utilisateur : « 1 EUR = tant de ma devise ».
  const pivot = p.cours[p.deviseBase] || 1
  const arrondi = (v: number) => Math.round(v * 1e6) / 1e6
  const coursAffiche = (code: string) => arrondi((p.cours[code] ?? 0) / pivot)
  const set = (patch: Parameters<typeof majParametres>[0]) => void majParametres(patch)
  const [indicatifTel, numeroTel] = decomposerTelephone(p.telephone, p.pays)

  // Avec un compte en ligne, ces informations identifient le titulaire du
  // dossier : on les signale comme attendues, sans bloquer l'usage hors compte.
  const requis = (label: string) => (utilisateur ? `${label} *` : label)
  const profilIncomplet = Boolean(utilisateur)
    && !(p.raisonSociale && p.telephone && p.email && p.adresse)

  /**
   * Changer de langue traduit aussi les listes livrées — mais seulement si
   * l'utilisateur ne les a pas retouchées : ses propres libellés priment
   * toujours sur une traduction automatique.
   */
  const changerLangue = (langue: string) => {
    const patch: Parameters<typeof majParametres>[0] = { langue }
    if (referentielIntact(p, p.langue)) {
      const livre = referentielLivre(langue)
      patch.categories = structuredClone(livre.categories)
      patch.sousCategories = structuredClone(livre.sousCategories)
      patch.moyens = [...livre.moyens]
      const egliseLivree = p.langue === 'en' ? EGLISE_DEFAUT_EN : EGLISE_DEFAUT
      if (p.dimeEglise === egliseLivree) {
        patch.dimeEglise = langue === 'en' ? EGLISE_DEFAUT_EN : EGLISE_DEFAUT
      }
    }
    // Le pays est enregistré sous son nom : on le réécrit dans la nouvelle
    // langue pour qu'il reste sélectionné dans la liste.
    const codePaysChoisi = p.pays ? codePays(p.pays) : undefined
    if (codePaysChoisi) patch.pays = nomPays(codePaysChoisi, langue)
    set(patch)
  }

  const ajouterMoyen = () => {
    const v = moyen.trim()
    if (v && !p.moyens.includes(v)) set({ moyens: [...p.moyens, v] })
    setMoyen('')
  }
  const total = comptes.reduce((s, c) => s + soldeCompte(c.id, c.soldeOuverture, ecritures), 0)

  const majCompte = (c: Compte, patch: Partial<Compte>) =>
    void db.comptes.put({ ...c, ...patch, updatedAt: new Date().toISOString() })

  const sections = [
    ['identite', t('parametres.s1')],
    ['devise', t('parametres.s2')],
    ['soldes', t('parametres.s3')],
    ['comptes', t('parametres.s4')],
    ['dime', t('parametres.s5')],
    ['categories', t('parametres.s6')],
    ['moyens', t('parametres.s7')],
    ['cours', t('parametres.s8')],
    ['langue', t('parametres.s9')],
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="bg-apex-navy px-3.5 py-2">
          <p className="text-2xs font-bold uppercase tracking-[.14em] text-white">
            {t('parametres.titre')}
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

      <div id="langue" className="scroll-mt-20" />
      <Section title={t('parametres.langueSection')}>
        <Card className="space-y-2.5 p-3">
          <div className="grid grid-cols-2 gap-2">
            {LANGUES.map((l) => (
              <button
                key={l.code}
                onClick={() => changerLangue(l.code)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm
                            font-bold transition ${
                  p.langue === l.code
                    ? 'border-apex-gold bg-apex-cream text-apex-navy'
                    : 'border-surface-300 bg-white text-surface-600'
                }`}
              >
                <span className="text-lg">{l.drapeau}</span> {l.nom}
              </button>
            ))}
          </div>
          <p className="text-2xs leading-relaxed text-surface-500">
            {t('parametres.langueAide')}
          </p>
          {!referentielIntact(p, p.langue) && (
            <p className="rounded-xl bg-apex-cream p-2.5 text-2xs leading-relaxed text-apex-navy">
              {t('parametres.langueReferentiel')}
            </p>
          )}
        </Card>
      </Section>

      <div id="identite" className="scroll-mt-20" />
      <Section title={t('parametres.identite')}>
        {profilIncomplet && (
          <Card className="border-apex-gold bg-apex-cream p-3 text-2xs leading-relaxed text-apex-navy">
            {t('parametres.profilIncomplet')}
          </Card>
        )}
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label={requis(t('parametres.raisonSociale'))}>
            <Input value={p.raisonSociale} placeholder="APEX AFRICA"
                   onChange={(e) => set({ raisonSociale: e.target.value })} />
          </Field>
          <Field label={t('parametres.responsable')}>
            <Input value={p.responsable} onChange={(e) => set({ responsable: e.target.value })} />
          </Field>
          <Field label={t('parametres.activite')}>
            <Input value={p.activite} onChange={(e) => set({ activite: e.target.value })} />
          </Field>
          <Field label={requis(t('parametres.adresse'))}>
            <Input value={p.adresse} onChange={(e) => set({ adresse: e.target.value })} />
          </Field>
          <Field label={t('parametres.ville')}>
            <Input value={p.ville} placeholder="Abidjan"
                   onChange={(e) => set({ ville: e.target.value })} />
          </Field>
          <Field label={t('parametres.pays')} hint={t('parametres.paysAide')}>
            <Select value={p.pays} onChange={(e) => set({ pays: e.target.value })}>
              <option value="">{t('commun.choisir')}</option>
              {listePays.map(([code, nom]) => <option key={code} value={nom}>{nom}</option>)}
            </Select>
          </Field>
          <Field label={requis(t('parametres.telephone'))}>
            <div className="flex gap-2">
              <Select
                className="!w-24 shrink-0 !px-2"
                value={indicatifTel}
                onChange={(e) => set({ telephone: `${e.target.value} ${numeroTel}`.trim() })}
              >
                {listePays.map(([code, , indicatif]) => (
                  <option key={code} value={indicatif}>{indicatif} · {code}</option>
                ))}
              </Select>
              <Input
                className="flex-1"
                value={numeroTel}
                inputMode="tel"
                placeholder="07 12 34 56 78"
                onChange={(e) => set({ telephone: `${indicatifTel} ${e.target.value}`.trim() })}
              />
            </div>
          </Field>
          <Field label={requis(t('parametres.email'))}>
            <Input value={p.email} inputMode="email"
                   onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label={t('parametres.siteWeb')}>
            <Input value={p.siteWeb} onChange={(e) => set({ siteWeb: e.target.value })} />
          </Field>
          <Field label={t('parametres.identifiant')} hint={t('commun.facultatif')}>
            <Input value={p.identifiant} onChange={(e) => set({ identifiant: e.target.value })} />
          </Field>
        </Card>
      </Section>

      <div id="devise" className="scroll-mt-20" />
      <Section title={t('parametres.deviseSection')}>
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label={t('parametres.deviseBase')}
                 hint={t('parametres.deviseAide')}>
            <Select value={p.deviseBase} onChange={(e) => set({ deviseBase: e.target.value })}>
              {DEVISES.map(([code]) => (
                <option key={code} value={code}>
                  {code} — {nomDevise(code, p.langue)} ({symboleDevise(code)})
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('parametres.anneeTravail')}>
            <Input type="number" value={p.anneeTravail} inputMode="numeric"
                   onChange={(e) => set({ anneeTravail: Number(e.target.value) || p.anneeTravail })} />
          </Field>
          <Field label={t('parametres.moisSuivi')}>
            <Select value={p.moisSuivi} onChange={(e) => set({ moisSuivi: Number(e.target.value) })}>
              {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </Select>
          </Field>
          <Field label={t('parametres.perimetre')}
                 hint={t('parametres.perimetreAide')}>
            <Select value={p.perimetre}
                    onChange={(e) => set({ perimetre: e.target.value as typeof p.perimetre })}>
              <option value="general">{t('parametres.perimetreGeneral')}</option>
              <option value="tout">{t('parametres.perimetreTout')}</option>
              {MODULES.filter((m) => m.id !== 'general').map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Select>
          </Field>
        </Card>
      </Section>

      <div id="soldes" className="scroll-mt-20" />
      <Section title={t('parametres.soldesSection')}>
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label={t('parametres.tresorerieInitiale')} hint={t('parametres.tresorerieAide')}>
            <MoneyInput value={p.tresorerieInitiale}
                        onChange={(v) => set({ tresorerieInitiale: v })} />
          </Field>
          <Field label={t('parametres.tauxEpargneCible')}>
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.tauxEpargneCible * 100)}
                   onChange={(e) => set({ tauxEpargneCible: Number(e.target.value) / 100 })} />
          </Field>
          <Field label={t('parametres.seuilAlerte')}>
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.seuilAlerte * 100)}
                   onChange={(e) => set({ seuilAlerte: Number(e.target.value) / 100 })} />
          </Field>
        </Card>
      </Section>

      <div id="comptes" className="scroll-mt-20" />
      <Section
        title={t('parametres.comptesSection')}
        action={
          <Btn variant="ghost" className="!px-3 !py-1.5 text-xs"
               onClick={() => void db.comptes.put(stamp({
                 id: uid(), nom: t('parametres.nouveauCompte'), nature: 'courant', soldeOuverture: 0,
               }) as Compte)}>
            <Plus size={14} /> {t('commun.ajouter')}
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
                  {NATURES_COMPTE.map(([v, cle]) => <option key={v} value={v}>{t(cle)}</option>)}
                </Select>
                <MoneyInput value={c.soldeOuverture}
                            onChange={(v) => majCompte(c, { soldeOuverture: v })} />
                <Input list="etablissements" value={c.etablissement ?? ''}
                       placeholder={t('parametres.etablissementPlaceholder')}
                       onChange={(e) => majCompte(c, { etablissement: e.target.value })} />
                <Input value={c.reference ?? ''} placeholder={t('parametres.referencePlaceholder')}
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
            {t('parametres.comptesAide')}
          </p>
          <Kpi label={t('parametres.totalDisponible')} valeur={fmt(p, total)} ton="navy" />
        </div>
      </Section>

      <div id="dime" className="scroll-mt-20" />
      <Section title={t('parametres.dimeSection')}>
        <Card className="grid gap-3 p-4 sm:grid-cols-2">
          <Field label={t('parametres.dimeActive')}
                 hint={t('parametres.dimeActiveAide')}>
            <Select value={p.dimeActive ? 'oui' : 'non'}
                    onChange={(e) => set({ dimeActive: e.target.value === 'oui' })}>
              <option value="non">{t('commun.non')}</option>
              <option value="oui">{t('commun.oui')}</option>
            </Select>
          </Field>
          <Field label={t('parametres.dimeTaux')}>
            <Input type="number" min={0} max={100} inputMode="numeric"
                   value={Math.round(p.dimeTaux * 100)}
                   onChange={(e) => set({ dimeTaux: Number(e.target.value) / 100 })} />
          </Field>
          <Field label={t('parametres.dimeAssiette')}>
            <Select value={p.dimeAssiette}
                    onChange={(e) => set({ dimeAssiette: e.target.value as typeof p.dimeAssiette })}>
              <option value="salaire">{t('parametres.assietteSalaire')}</option>
              <option value="salaire_primes">{t('parametres.assietteSalairePrimes')}</option>
              <option value="tous">{t('parametres.assietteTous')}</option>
            </Select>
          </Field>
          <Field
            label={t('parametres.eglise')}
            hint={t('parametres.egliseAide')}
          >
            <Input value={p.dimeEglise} placeholder={t('parametres.eglise')}
                   onChange={(e) => set({ dimeEglise: e.target.value })} />
          </Field>
          <div className="sm:col-span-2 space-y-2 rounded-xl bg-surface-50 p-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-surface-500">
              {t('parametres.troisCategories')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Puce ton="attention">{CAT_DIME}</Puce>
              <Puce>{CAT_OFFRANDE}</Puce>
              <Puce>{CAT_DON}</Puce>
            </div>
            <p className="text-2xs leading-relaxed text-surface-500">
              {t('parametres.dimeExplication', { dime: CAT_DIME, offrande: CAT_OFFRANDE.toLowerCase(), don: CAT_DON.toLowerCase() })}
            </p>
          </div>
        </Card>
      </Section>

      <div id="categories" className="scroll-mt-20" />
      <Section title={t('parametres.categoriesSection')}>
        <EditeurCategories p={p} />
      </Section>

      <div id="moyens" className="scroll-mt-20" />
      <Section title={t('parametres.moyensSection')}>
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
              placeholder={t('parametres.ajouterMoyen')}
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

      <Section title={t('parametres.coursSection')}
               action={<span className="text-2xs text-surface-500">{t('parametres.coursAide', { devise: p.deviseBase })}</span>}>
        <Card className="max-h-96 divide-y divide-surface-200 overflow-y-auto">
          {DEVISES.filter(([c]) => c !== p.deviseBase).map(([code]) => (
            <div key={code} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-sm font-semibold text-apex-navy">
                {code} <span className="font-normal text-surface-500">{nomDevise(code, p.langue)}</span>
              </span>
              <MoneyInput className="w-32" value={coursAffiche(code)}
                          onChange={(v) => set({ cours: { ...p.cours, [code]: v * pivot } })} />
            </div>
          ))}
        </Card>
      </Section>
    </div>
  )
}
