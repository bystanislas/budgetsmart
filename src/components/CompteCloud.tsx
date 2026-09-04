import { useEffect, useState } from 'react'
import { CloudOff, LogOut, Mail, RefreshCw, Smartphone, UserCheck } from 'lucide-react'
import type { ConfirmationResult } from 'firebase/auth'
import { Btn, Card, Field, Input, Puce, Section } from './kit'
import {
  causeEchecLien, connexionGoogle, emailMemorise, envoyerCodeSms,
  envoyerLienConnexion, estAppInstallee, googleIndisponible, lienDeConnexionRecu,
  saisieEstUnLien, seDeconnecter, terminerConnexionParEmail, useUtilisateur,
} from '../lib/auth'
import { pousserTout, tirerTout } from '../lib/sync'
import { useT } from '../i18n'

const CONTENEUR_RECAPTCHA = 'recaptcha-conteneur'

/**
 * Compte en ligne : facultatif, mais c'est lui qui permet de retrouver ses
 * données après un changement de téléphone ou une réinstallation. Sans compte,
 * l'application fonctionne exactement comme avant, tout en local.
 */
export default function CompteCloud({ annonce }: { annonce: (texte: string) => void }) {
  const utilisateur = useUtilisateur()
  const t = useT()

  const [email, setEmail] = useState('')
  const [lienEnvoye, setLienEnvoye] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState(false)
  const [numero, setNumero] = useState('')
  const [confirmationSms, setConfirmationSms] = useState<ConfirmationResult | null>(null)
  const [code, setCode] = useState('')
  const [lienColle, setLienColle] = useState('')
  const [occupe, setOccupe] = useState(false)

  // Depuis l'écran d'accueil, le lien reçu par email s'ouvre dans le
  // navigateur et non dans l'application : on propose d'emblée de le coller.
  const installee = estAppInstallee()

  // Retour depuis le lien reçu par email : on termine tout seul si l'email a
  // été mémorisé sur cet appareil, sinon on le redemande (cas d'un lien ouvert
  // depuis un autre téléphone ou un autre navigateur).
  useEffect(() => {
    if (!lienDeConnexionRecu()) return
    const memorise = emailMemorise()
    if (!memorise) { setConfirmationEmail(true); return }
    setOccupe(true)
    terminerConnexionParEmail(memorise)
      .then(() => annonce(t('compte.connexionReussie')))
      .catch(() => { setConfirmationEmail(true); annonce(t('compte.lienExpire')) })
      .finally(() => setOccupe(false))
  }, [])

  const proteger = async (action: () => Promise<void>, echec: string) => {
    setOccupe(true)
    try { await action() } catch { annonce(echec) } finally { setOccupe(false) }
  }

  /**
   * Un lien refusé a plusieurs causes possibles, et l'utilisateur ne peut
   * corriger que celle qui le concerne : dire « lien invalide » à quelqu'un
   * dont le lien a simplement déjà servi le condamne à recommencer en boucle.
   */
  const MESSAGE_ECHEC = {
    illisible: 'compte.lienIllisible',
    expire: 'compte.lienDejaUtilise',
    email: 'compte.emailNeCorrespondPas',
    reseau: 'compte.reseauIndisponible',
    autre: 'compte.connexionEchouee',
  } as const

  const seConnecterAvecGoogle = async () => {
    setOccupe(true)
    try {
      const utilisateur = await connexionGoogle()
      // Sans utilisateur, la page part vers Google : ne rien annoncer ici.
      if (utilisateur) annonce(t('compte.connexionReussie'))
    } catch (erreur) {
      annonce(t(googleIndisponible(erreur)
        ? 'compte.googleIndisponible' : 'compte.googleEchouee'))
    } finally {
      setOccupe(false)
    }
  }

  const terminerAvecLienColle = async () => {
    if (!saisieEstUnLien(lienColle)) { annonce(t('compte.lienIllisible')); return }
    const adresse = (email.trim() || emailMemorise()) ?? ''
    setOccupe(true)
    try {
      await terminerConnexionParEmail(adresse, lienColle)
      setLienColle('')
      annonce(t('compte.connexionReussie'))
    } catch (erreur) {
      annonce(t(MESSAGE_ECHEC[causeEchecLien(erreur)]))
    } finally {
      setOccupe(false)
    }
  }

  /* ------------------------------------------------------- déjà connecté */
  if (utilisateur) {
    const identifiant = utilisateur.email ?? utilisateur.phoneNumber ?? 'compte'
    return (
      <Section title={t('compte.titre')}>
        <Card className="space-y-3 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-green text-white">
              <UserCheck size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-apex-navy">{identifiant}</p>
              <p className="text-2xs text-surface-500">
                {t('compte.sauvegardeActive')} <Puce ton="ok">{t('compte.connecte')}</Puce>
              </p>
            </div>
          </div>

          <p className="text-2xs leading-relaxed text-surface-500">
            {t('compte.connecteAide')}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Btn
              variant="ghost"
              disabled={occupe}
              onClick={() => void proteger(async () => {
                await pousserTout(utilisateur.uid)
                await tirerTout(utilisateur.uid)
                annonce(t('compte.syncTerminee'))
              }, t('compte.syncImpossible'))}
            >
              <RefreshCw size={16} /> {t('compte.synchroniser')}
            </Btn>
            <Btn
              variant="ghost"
              disabled={occupe}
              onClick={() => void proteger(async () => {
                await seDeconnecter()
                annonce(t('compte.deconnecte'))
              }, t('compte.deconnexionImpossible'))}
            >
              <LogOut size={16} /> {t('compte.seDeconnecter')}
            </Btn>
          </div>
        </Card>
      </Section>
    )
  }

  /* ------------------------------------------------------ non connecté */
  return (
    <Section title={t('compte.titre')}>
      <Card className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-200 text-surface-500">
            <CloudOff size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-apex-navy">{t('compte.aucunCompte')}</p>
            <p className="text-2xs text-surface-500">
              {t('compte.aucunCompteSous')}
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-apex-cream p-3 text-2xs leading-relaxed text-apex-navy">
          {t('compte.argumentaire')}
        </p>

        {/* Chemin le plus court pour la majorité : une adresse Gmail suffit. */}
        <div>
          <button
            onClick={() => void seConnecterAvecGoogle()}
            disabled={occupe}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border
                       border-surface-300 bg-white px-4 py-2.5 text-sm font-bold
                       text-apex-navy transition active:bg-surface-100 disabled:opacity-50"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.8c-.5 2.7-2 5-4.4 6.6v5.5h7.1c4.2-3.8 6.6-9.5 6.6-16.1z" />
              <path fill="#34A853" d="M24 46c6 0 11-2 14.6-5.4l-7.1-5.5c-2 1.3-4.5 2.1-7.5 2.1-5.8 0-10.6-3.9-12.4-9.1H4.3v5.7C7.9 41 15.4 46 24 46z" />
              <path fill="#FBBC05" d="M11.6 28.1c-.4-1.3-.7-2.7-.7-4.1s.3-2.8.7-4.1V14.2H4.3A22 22 0 0 0 2 24c0 3.5.8 6.9 2.3 9.8l7.3-5.7z" />
              <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.500 3.3l6.3-6.3C34.9 4.2 30 2 24 2 15.4 2 7.9 7 4.3 14.2l7.3 5.7c1.8-5.2 6.6-9.1 12.4-9.1z" />
            </svg>
            {t('compte.avecGoogle')}
          </button>
          <p className="mt-1.5 px-1 text-2xs leading-relaxed text-surface-500">
            {t('compte.avecGoogleAide')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-surface-200" />
          <span className="text-2xs font-semibold uppercase tracking-wider text-surface-400">
            {t('compte.ouBien')}
          </span>
          <span className="h-px flex-1 bg-surface-200" />
        </div>

        {confirmationEmail ? (
          <Field label={t('compte.confirmezEmail')} hint={t('compte.confirmezEmailAide')}>
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="email" value={email} placeholder={t('compte.emailPlaceholder')}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Btn
                variant="gold" disabled={occupe || !email.includes('@')}
                onClick={() => void proteger(async () => {
                  await terminerConnexionParEmail(email.trim())
                  annonce(t('compte.connexionReussie'))
                }, t('compte.connexionImpossible'))}
              >
                {t('commun.valider')}
              </Btn>
            </div>
          </Field>
        ) : (
          <Field label={t('compte.parEmail')} hint={t('compte.parEmailAide')}>
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="email" value={email} placeholder={t('compte.emailPlaceholder')}
                onChange={(e) => { setEmail(e.target.value); setLienEnvoye(false) }}
              />
              <Btn
                variant="primary" disabled={occupe || !email.includes('@')}
                onClick={() => void proteger(async () => {
                  await envoyerLienConnexion(email.trim())
                  setLienEnvoye(true)
                  annonce(t('compte.lienEnvoyeA', { email: email.trim() }))
                }, t('compte.envoiImpossible'))}
              >
                <Mail size={16} />
              </Btn>
            </div>
            {lienEnvoye && (
              <span className="mt-1 block text-2xs font-semibold text-apex-green">
                {t(installee ? 'compte.lienEnvoyeApp' : 'compte.lienEnvoye')}
              </span>
            )}
          </Field>
        )}

        {(installee || lienEnvoye) && (
          <Field label={t('compte.collerLien')} hint={t('compte.collerLienAide')}>
            <Input
              value={lienColle}
              placeholder={t('compte.collerLienPlaceholder')}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setLienColle(e.target.value)}
            />
            <Btn
              className="mt-2 w-full"
              variant="gold"
              disabled={occupe || !lienColle.trim() || !(email.trim() || emailMemorise())}
              onClick={() => void terminerAvecLienColle()}
            >
              {t('compte.terminerConnexion')}
            </Btn>
          </Field>
        )}

        {confirmationSms ? (
          <Field label={t('compte.codeRecu')}>
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="numeric" value={code} placeholder="123456"
                onChange={(e) => setCode(e.target.value)}
              />
              <Btn
                variant="gold" disabled={occupe || code.trim().length < 4}
                onClick={() => void proteger(async () => {
                  await confirmationSms.confirm(code.trim())
                  setConfirmationSms(null)
                  setCode('')
                  annonce(t('compte.connexionReussie'))
                }, t('compte.codeIncorrect'))}
              >
                {t('commun.valider')}
              </Btn>
            </div>
          </Field>
        ) : (
          <Field label={t('compte.parSms')} hint={t('compte.parSmsAide')}>
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="tel" value={numero} placeholder="+225 07 12 34 56 78"
                onChange={(e) => setNumero(e.target.value)}
              />
              <Btn
                variant="primary" disabled={occupe || numero.trim().length < 8}
                onClick={() => void proteger(async () => {
                  const confirmation = await envoyerCodeSms(
                    numero.replace(/\s+/g, ''), CONTENEUR_RECAPTCHA,
                  )
                  setConfirmationSms(confirmation)
                  annonce(t('compte.codeEnvoye'))
                }, t('compte.envoiSmsImpossible'))}
              >
                <Smartphone size={16} />
              </Btn>
            </div>
          </Field>
        )}

        {/* Exigé par Firebase pour l'envoi de SMS ; invisible pour l'utilisateur. */}
        <div id={CONTENEUR_RECAPTCHA} />
      </Card>
    </Section>
  )
}
