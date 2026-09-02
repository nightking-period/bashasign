import { useState } from 'react'
import {
  Globe2, Accessibility, Volume2, Camera, Shield,
  RefreshCw, Check, Info, AlertCircle,
} from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { cn } from '@/utils/cn'
import { useAppStore } from '@/store/useAppStore'
import { ENABLED_LANGUAGES } from '@/data/languages'
import { TextToSpeechEngine } from '@/services/tts/TextToSpeechEngine'
import type { LanguageCode } from '@/types'

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-6 space-y-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Toggle({
  checked, onChange, label, description, disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  const id = `toggle-${Math.random().toString(36).slice(2)}`
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium text-gray-900 cursor-pointer">{label}</label>
        {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary' : 'bg-gray-200',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0',
            'transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}

export function Settings() {
  const { settings, updateSettings, resetSettings } = useAppStore()
  const toast = useToast()
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleUpdate = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSettings({ [key]: value })
    toast.success('Setting saved.')
  }

  const testTTS = () => {
    const lang = settings.language
    const texts: Record<string, string> = {
      en: 'BhashaSign is ready to assist you.',
      te: 'భాష సైన్ మీకు సేవ చేయడానికి సిద్ధంగా ఉంది.',
      hi: 'भाषासाइन आपकी सेवा के लिए तैयार है।',
    }
    const text = texts[lang] ?? texts['en']
    TextToSpeechEngine.speak(text, lang, { rate: settings.ttsSpeed, volume: settings.ttsVolume }, {
      onError: () => toast.error('TTS not available in this browser.'),
      onEnd: () => toast.success('Test complete.'),
    })
  }

  const handleReset = () => {
    resetSettings()
    setShowResetConfirm(false)
    toast.success('Settings reset to defaults.')
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-muted mt-1">Configure language, accessibility, audio, camera, and privacy</p>
      </div>

      {/* ── Language ─────────────────────────────────────────────────── */}
      <SectionCard title="Language" icon={<Globe2 size={18} />}>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Interface Language</label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select interface language">
            {ENABLED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleUpdate('language', lang.code as LanguageCode)}
                aria-pressed={settings.language === lang.code}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                  settings.language === lang.code
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-border hover:border-primary hover:text-primary',
                )}
              >
                <span lang={lang.code}>{lang.nativeName}</span>
                <span className="ml-1.5 text-xs opacity-60">({lang.name})</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">Additional languages will be available in future phases.</p>
        </div>
      </SectionCard>

      {/* ── Accessibility ─────────────────────────────────────────────── */}
      <SectionCard title="Accessibility" icon={<Accessibility size={18} />}>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Font Size</label>
          <div className="flex gap-2" role="group" aria-label="Font size">
            {([['normal', 'Normal'], ['large', 'Large'], ['xl', 'Extra Large']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => handleUpdate('fontSize', val)}
                aria-pressed={settings.fontSize === val}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
                  settings.fontSize === val
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-border hover:border-primary',
                  val === 'large' && 'text-base',
                  val === 'xl' && 'text-lg',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        <Toggle
          label="High Contrast Mode"
          description="Increases contrast for better readability"
          checked={settings.highContrast}
          onChange={v => handleUpdate('highContrast', v)}
        />
        <Toggle
          label="Reduced Motion"
          description="Disables non-essential animations"
          checked={settings.reducedMotion}
          onChange={v => handleUpdate('reducedMotion', v)}
        />
      </SectionCard>

      {/* ── Audio / TTS ───────────────────────────────────────────────── */}
      <SectionCard title="Audio" icon={<Volume2 size={18} />}>
        <Toggle
          label="Text-to-Speech"
          description="Read out translations in regional language"
          checked={settings.ttsEnabled}
          onChange={v => handleUpdate('ttsEnabled', v)}
        />

        {settings.ttsEnabled && (
          <>
            <hr className="border-border" />
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-2">
                Speech Speed
                <span className="text-xs text-muted">{settings.ttsSpeed}×</span>
              </label>
              <input
                type="range"
                min={0.5} max={2} step={0.25}
                value={settings.ttsSpeed}
                onChange={e => handleUpdate('ttsSpeed', parseFloat(e.target.value))}
                aria-label="Speech speed"
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>0.5× (Slow)</span><span>1× (Normal)</span><span>2× (Fast)</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center justify-between mb-2">
                Volume
                <span className="text-xs text-muted">{Math.round(settings.ttsVolume * 100)}%</span>
              </label>
              <input
                type="range"
                min={0} max={1} step={0.1}
                value={settings.ttsVolume}
                onChange={e => handleUpdate('ttsVolume', parseFloat(e.target.value))}
                aria-label="Volume"
                className="w-full accent-primary"
              />
            </div>
            <Button variant="outline" size="sm" onClick={testTTS} leftIcon={<Volume2 size={14} />}>
              Test Voice Output
            </Button>
            {!TextToSpeechEngine.isSupported() && (
              <div className="flex items-center gap-2 text-xs text-warning-dark bg-warning-light rounded-lg px-3 py-2">
                <AlertCircle size={12} />
                Web Speech API not supported in this browser. TTS unavailable.
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* ── Camera & Privacy ─────────────────────────────────────────── */}
      <SectionCard title="Camera & Privacy" icon={<Camera size={18} />}>
        <Toggle
          label="Enable Camera"
          description="Required for sign recognition (Citizen → Employee mode)"
          checked={settings.cameraEnabled}
          onChange={v => handleUpdate('cameraEnabled', v)}
        />
        <Toggle
          label="Local Processing Only"
          description="Camera frames are processed in the browser. No video is uploaded to any server."
          checked={settings.privacyLocalOnly}
          onChange={() => {}}
          disabled
        />
        <div className="flex items-start gap-2 text-xs text-muted bg-gray-50 rounded-lg p-3">
          <Info size={12} className="shrink-0 mt-0.5 text-info" />
          <p>Local processing is always enabled in this build. Video data is never stored or transmitted.</p>
        </div>

        <hr className="border-border" />

        <Toggle
          label="Demo Mode"
          description="Use simulated outputs for demonstration. Always enabled in Phase 1."
          checked={settings.demoMode}
          onChange={v => handleUpdate('demoMode', v)}
        />
      </SectionCard>

      {/* ── Privacy explanation ─────────────────────────────────────── */}
      <section className="card p-6 space-y-3">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <Shield size={18} className="text-secondary" />
          Privacy
        </h2>
        <ul className="text-sm text-muted space-y-2 list-disc list-inside">
          <li>No camera footage is stored or uploaded to any server.</li>
          <li>All sign recognition (Phase 3) will run locally in your browser using TensorFlow.js.</li>
          <li>No citizen information is logged or persisted between sessions.</li>
          <li>API keys (when used) are stored in environment variables and never exposed to the browser.</li>
          <li>This application does not use tracking cookies or analytics.</li>
        </ul>
      </section>

      {/* ── Reset ─────────────────────────────────────────────────────── */}
      <section className="card p-6">
        <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <RefreshCw size={18} /> Reset Settings
        </h2>
        {!showResetConfirm ? (
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowResetConfirm(true)}
            leftIcon={<RefreshCw size={14} />}
          >
            Reset All to Defaults
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-700">Are you sure? All settings will return to defaults.</p>
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleReset} leftIcon={<RefreshCw size={14} />}>
                Yes, Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowResetConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* App version */}
      <p className="text-xs text-muted text-center pb-4">
        BhashaSign v0.1.0-alpha · Phase 1 · Demo Build
      </p>
    </div>
  )
}

export default Settings
