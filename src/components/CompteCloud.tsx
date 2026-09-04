import { useEffect, useState } from 'react'
import { CloudOff, LogOut, Mail, RefreshCw, Smartphone, UserCheck } from 'lucide-react'
import type { ConfirmationResult } from 'firebase/auth'
import { Btn, Card, Field, Input, Puce, Section } from './kit'
import {
  causeEchecLien, emailMemorise, envoyerCodeSms, envoyerLienConnexion,
  estAppInstallee, lienDeConnexionRecu, saisieEstUnLien, seDeconnecter,
  terminerConnexionParEmail, useUtilisateur,
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
