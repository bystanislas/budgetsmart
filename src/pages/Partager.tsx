import { useEffect, useState } from 'react'
import { Check, Copy, MessageCircle, QrCode, Share2, Smartphone } from 'lucide-react'
import QRCode from 'qrcode'
import { Btn, Card, Section } from '../components/kit'
import { APP_NAME, APP_URL } from '../data/refs'
import { useLangue, useT } from '../i18n'

export default function Partager() {
  const t = useT()
  const langue = useLangue()
  const [qr, setQr] = useState('')
  const [copie, setCopie] = useState(false)

  const message = t('partage.message', { nom: APP_NAME, lien: APP_URL })

  // Le QR est fabriqué sur l'appareil : rien n'est demandé à un serveur, et
  // il s'affiche donc aussi bien hors connexion, à montrer de vive voix.
  useEffect(() => {
    void QRCode.toDataURL(APP_URL, {
      width: 640, margin: 1,
      color: { dark: '#1A3557', light: '#FFFFFF' },
    }).then(setQr).catch(() => setQr(''))
  }, [])

  const partageNatif = typeof navigator !== 'undefined' && 'share' in navigator

  const partager = async () => {
    try {
      await navigator.share({ title: APP_NAME, text: message, url: APP_URL })
    } catch {
      /* partage annulé par l'utilisateur : rien à signaler */
    }
  }

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopie(true)
      setTimeout(() => setCopie(false), 2500)
    } catch {
      /* presse-papiers refusé : le lien reste visible et sélectionnable */
    }
  }

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(message)}`

  return (
    <div className="space-y-5 animate-fade-in">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 bg-apex-navy px-4 py-4 text-white">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
            <Share2 size={20} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight">{t('partage.titre')}</p>
            <p className="mt-0.5 text-2xs text-white/70">{t('partage.sousTitre')}</p>
          </div>
        </div>
        <div className="h-1 bg-apex-gold" />
      </Card>

      <Card className="space-y-3 p-4">
        <div className="grid gap-2">
          {partageNatif && (
            <Btn variant="gold" className="w-full" onClick={() => void partager()}>
              <Share2 size={16} /> {t('partage.partager')}
            </Btn>
          )}
          <a href={whatsapp} target="_blank" rel="noreferrer"
             className="flex w-full items-center justify-center gap-2 rounded-xl bg-apex-green
                        px-4 py-2.5 text-sm font-bold text-white transition active:opacity-80">
            <MessageCircle size={16} /> {t('partage.whatsapp')}
          </a>
          <Btn variant="ghost" className="w-full" onClick={() => void copier()}>
            {copie ? <Check size={16} /> : <Copy size={16} />}
            {copie ? t('partage.copie') : t('partage.copier')}
          </Btn>
        </div>

        <div className="rounded-xl bg-surface-100 p-3">
          <p className="text-2xs font-bold uppercase tracking-wider text-surface-500">
            {t('partage.lien')}
          </p>
          <p className="mt-1 select-all break-all text-xs font-semibold text-apex-navy">
            {APP_URL}
          </p>
        </div>
      </Card>

      <Section title={t('partage.enPersonne')}>
        <Card className="space-y-3 p-4 text-center">
          {qr ? (
            <img
              src={qr} alt={t('partage.qrAlt')}
              className="mx-auto h-52 w-52 rounded-xl border border-surface-200 bg-white p-2"
            />
          ) : (
            <div className="mx-auto grid h-52 w-52 place-items-center rounded-xl
                            border border-surface-200 text-surface-400">
              <QrCode size={40} />
            </div>
          )}
          <p className="text-2xs leading-relaxed text-surface-500">{t('partage.qrAide')}</p>
        </Card>
      </Section>

      <Section title={t('partage.installer')}>
        <Card className="space-y-2.5 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg
                            bg-apex-navy text-white">
              <Smartphone size={16} strokeWidth={2.4} />
            </div>
            <div className="space-y-1.5 text-xs leading-relaxed text-surface-600">
              <p><span className="font-bold text-apex-navy">Android :</span> {t('partage.android')}</p>
              <p><span className="font-bold text-apex-navy">iPhone :</span> {t('partage.iphone')}</p>
            </div>
          </div>
          <p className="rounded-xl bg-apex-cream p-2.5 text-2xs leading-relaxed text-apex-navy">
            {t('partage.gratuit')}
          </p>
        </Card>
      </Section>

      <p className="pb-2 text-center text-2xs text-surface-400">
        {langue === 'en' ? 'Share freely.' : 'Partagez librement.'}
      </p>
    </div>
  )
}
