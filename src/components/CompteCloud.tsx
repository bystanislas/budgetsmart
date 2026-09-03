import { useEffect, useState } from 'react'
import { CloudOff, LogOut, Mail, RefreshCw, Smartphone, UserCheck } from 'lucide-react'
import type { ConfirmationResult } from 'firebase/auth'
import { Btn, Card, Field, Input, Puce, Section } from './kit'
import {
  emailMemorise, envoyerCodeSms, envoyerLienConnexion, lienDeConnexionRecu,
  seDeconnecter, terminerConnexionParEmail, useUtilisateur,
} from '../lib/auth'
import { pousserTout, tirerTout } from '../lib/sync'

const CONTENEUR_RECAPTCHA = 'recaptcha-conteneur'

/**
 * Compte en ligne : facultatif, mais c'est lui qui permet de retrouver ses
 * données après un changement de téléphone ou une réinstallation. Sans compte,
 * l'application fonctionne exactement comme avant, tout en local.
 */
export default function CompteCloud({ annonce }: { annonce: (texte: string) => void }) {
  const utilisateur = useUtilisateur()

  const [email, setEmail] = useState('')
  const [lienEnvoye, setLienEnvoye] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState(false)
  const [numero, setNumero] = useState('')
  const [confirmationSms, setConfirmationSms] = useState<ConfirmationResult | null>(null)
  const [code, setCode] = useState('')
  const [occupe, setOccupe] = useState(false)

  // Retour depuis le lien reçu par email : on termine tout seul si l'email a
  // été mémorisé sur cet appareil, sinon on le redemande (cas d'un lien ouvert
  // depuis un autre téléphone ou un autre navigateur).
  useEffect(() => {
    if (!lienDeConnexionRecu()) return
    const memorise = emailMemorise()
    if (!memorise) { setConfirmationEmail(true); return }
    setOccupe(true)
    terminerConnexionParEmail(memorise)
      .then(() => annonce('Connexion réussie. Vos données sont en cours de récupération.'))
      .catch(() => { setConfirmationEmail(true); annonce('Le lien a expiré. Recommencez.') })
      .finally(() => setOccupe(false))
  }, [])

  const proteger = async (action: () => Promise<void>, echec: string) => {
    setOccupe(true)
    try { await action() } catch { annonce(echec) } finally { setOccupe(false) }
  }

  /* ------------------------------------------------------- déjà connecté */
  if (utilisateur) {
    const identifiant = utilisateur.email ?? utilisateur.phoneNumber ?? 'compte'
    return (
      <Section title="Mon compte">
        <Card className="space-y-3 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-apex-green text-white">
              <UserCheck size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-apex-navy">{identifiant}</p>
              <p className="text-2xs text-surface-500">
                Sauvegarde en ligne active <Puce ton="ok">connecté</Puce>
              </p>
            </div>
          </div>

          <p className="text-2xs leading-relaxed text-surface-500">
            Vos saisies restent enregistrées sur cet appareil et sont recopiées dans votre
            espace privé. Sur un nouveau téléphone, connectez-vous avec le même email ou
            le même numéro : tout revient.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Btn
              variant="ghost"
              disabled={occupe}
              onClick={() => void proteger(async () => {
                await pousserTout(utilisateur.uid)
                await tirerTout(utilisateur.uid)
                annonce('Synchronisation terminée.')
              }, 'Synchronisation impossible — vérifiez votre connexion.')}
            >
              <RefreshCw size={16} /> Synchroniser
            </Btn>
            <Btn
              variant="ghost"
              disabled={occupe}
              onClick={() => void proteger(async () => {
                await seDeconnecter()
                annonce('Déconnecté. Vos données restent sur cet appareil.')
              }, 'Déconnexion impossible.')}
            >
              <LogOut size={16} /> Se déconnecter
            </Btn>
          </div>
        </Card>
      </Section>
    )
  }

  /* ------------------------------------------------------ non connecté */
  return (
    <Section title="Mon compte">
      <Card className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-200 text-surface-500">
            <CloudOff size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-apex-navy">Aucun compte</p>
            <p className="text-2xs text-surface-500">
              Vos données vivent uniquement sur cet appareil.
            </p>
          </div>
        </div>

        <p className="rounded-xl bg-apex-cream p-3 text-2xs leading-relaxed text-apex-navy">
          Créez un compte pour retrouver vos budgets si vous changez de téléphone,
          désinstallez l'application ou effacez les données du navigateur. Sans compte,
          seule la sauvegarde manuelle en fichier vous protège.
        </p>

        {confirmationEmail ? (
          <Field label="Confirmez votre email" hint="Le lien a été ouvert sur un autre appareil.">
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="email" value={email} placeholder="vous@exemple.com"
                onChange={(e) => setEmail(e.target.value)}
              />
              <Btn
                variant="gold" disabled={occupe || !email.includes('@')}
                onClick={() => void proteger(async () => {
                  await terminerConnexionParEmail(email.trim())
                  annonce('Connexion réussie.')
                }, 'Connexion impossible. Redemandez un lien.')}
              >
                Valider
              </Btn>
            </div>
          </Field>
        ) : (
          <Field label="Par email" hint="Vous recevrez un lien : un clic suffit, aucun mot de passe.">
            <div className="flex gap-2">
              <Input
                className="flex-1" inputMode="email" value={email} placeholder="vous@exemple.com"
                onChange={(e) => { setEmail(e.target.value); setLienEnvoye(false) }}
              />
              <Btn
                variant="primary" disabled={occupe || !email.includes('@')}
                onClick={() => void proteger(async () => {
                  await envoyerLienConnexion(email.trim())
                  setLienEnvoye(true)
                  annonce(`Lien envoyé à ${email.trim()}.`)
                }, 'Envoi impossible — vérifiez l’adresse et votre connexion.')}
              >
                <Mail size={16} />
              </Btn>
            </div>
            {lienEnvoye && (
              <span className="mt-1 block text-2xs font-semibold text-apex-green">
                Lien envoyé. Ouvrez votre boîte mail sur cet appareil, puis revenez ici.
              </span>
            )}
          </Field>
        )}

        {confirmationSms ? (
          <Field label="Code reçu par SMS">
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
                  annonce('Connexion réussie.')
                }, 'Code incorrect ou expiré.')}
              >
                Valider
              </Btn>
            </div>
          </Field>
        ) : (
          <Field label="Ou par SMS" hint="Numéro au format international, indicatif compris.">
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
                  annonce('Code envoyé par SMS.')
                }, 'Envoi impossible — vérifiez le numéro et son indicatif.')}
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
