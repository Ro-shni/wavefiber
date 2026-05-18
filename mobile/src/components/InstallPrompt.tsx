import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-blue-600 text-white rounded-xl p-4 shadow-xl z-50 flex items-center gap-3">
      <Download className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-sm">Install WaveFiber</p>
        <p className="text-xs text-blue-100">Add to home screen for the best experience</p>
      </div>
      <button onClick={handleInstall} className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold active:bg-blue-50">
        Install
      </button>
      <button onClick={() => setDismissed(true)} className="p-1 text-blue-200 active:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
