import React from 'react'
import { Eye, Type, ZapOff, Check } from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'
import { Theme, FontSize } from '../../../shared/types/common'

const THEME_OPTIONS: { id: Theme; name: string; desc: string; colors: string }[] = [
  {
    id: 'dark',
    name: 'Deep Space',
    desc: 'Default dark tech navy canvas with rich accent colors.',
    colors: 'bg-[#13131F] border-[#1A1A28]',
  },
  {
    id: 'darker',
    name: 'Abyssal Black',
    desc: 'Deep pitch charcoal black layout designed for extreme eye safety.',
    colors: 'bg-[#0A0A12] border-[#111118]',
  },
  {
    id: 'midnight',
    name: 'Midnight Slate',
    desc: 'Warm titanium/ocean hybrid slate design with dynamic contrast.',
    colors: 'bg-[#070E1A] border-[#0D1520]',
  },
]

const FONT_OPTIONS: { id: FontSize; name: string; sizePx: string }[] = [
  { id: 'compact', name: 'Compact', sizePx: '13px' },
  { id: 'default', name: 'Default', sizePx: '14px' },
  { id: 'relaxed', name: 'Relaxed', sizePx: '15px' },
]

export const AppearanceSection: React.FC = () => {
  const { theme, fontSize, reducedMotion, setTheme, setFontSize } = useSettingsStore()
  const setReducedMotion = (val: boolean) => useSettingsStore.setState({ reducedMotion: val })

  return (
    <div className="flex flex-col gap-8">
      {/* THEME SELECTION */}
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
          <Eye size={16} className="text-[var(--color-accent-primary)]" />
          Theme Profiles
        </h3>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
          Select your visual environment background state. Theme changes apply instantly to all layouts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {THEME_OPTIONS.map((opt) => {
            const isSelected = theme === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className={`text-left p-4 rounded-xl border transition-all relative ${opt.colors} cursor-pointer focus:outline-none ${
                  isSelected
                    ? 'border-[var(--color-accent-primary)] ring-1 ring-[var(--color-accent-primary)]/40 shadow-lg'
                    : 'border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-[var(--color-accent-highlight)] bg-[var(--color-accent-primary-dim)] p-0.5 rounded-full">
                    <Check size={12} />
                  </span>
                )}
                <span className="text-[13px] font-semibold text-[var(--color-text-primary)] block mb-1">
                  {opt.name}
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed block">
                  {opt.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* FONT SIZE SELECTION */}
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
          <Type size={16} className="text-[var(--color-accent-primary)]" />
          Application Text Scale
        </h3>
        <p className="text-[12px] text-[var(--color-text-muted)] mb-4">
          Adjust general text spacing and reading dimensions to fit your display configuration.
        </p>

        <div className="flex items-center bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] p-1 rounded-xl w-fit mb-4">
          {FONT_OPTIONS.map((opt) => {
            const isSelected = fontSize === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFontSize(opt.id)}
                className={`px-4 py-2 text-[12px] font-semibold rounded-lg transition-all cursor-pointer focus:outline-none ${
                  isSelected
                    ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {opt.name} ({opt.sizePx})
              </button>
            )
          })}
        </div>

        {/* Live Typography Preview widget */}
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-xl p-4 max-w-xl">
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase block mb-2 tracking-wide font-mono">
            Reading Size Preview
          </span>
          <p className="text-[var(--color-text-primary)] leading-relaxed select-none">
            "They moved through the silence of the orbital rail, the dark horizon of the ring world glowing in faint purple neon. Step by step, the relationship matrix recalibrated itself."
          </p>
        </div>
      </div>

      {/* REDUCED MOTION TOGGLE */}
      <div className="border-t border-[var(--color-border-subtle)]/60 pt-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center h-5 mt-0.5">
            <input
              id="reduced-motion-cb"
              type="checkbox"
              checked={reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
              className="h-4 w-4 bg-[var(--color-bg-base)] border-[var(--color-border-strong)]/50 text-[var(--color-accent-primary)] rounded focus:ring-[var(--color-accent-primary)]/40 focus:ring-offset-0 focus:outline-none cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="reduced-motion-cb"
              className="text-[13px] font-semibold text-[var(--color-text-primary)] cursor-pointer"
            >
              Enable Low-spec Responsiveness (Reduced Motion)
            </label>
            <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
              Disables cosmetic transitions, hover scaling, and animation keyframes to prioritize prompt responsiveness on resource-constrained devices.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
