import { useState, useEffect } from 'react'
import { PRESET_ICON_COLORS } from '../types'
import { Input } from '../../../shared/components/ui/Input'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleCustomColorChange = (val: string) => {
    setInputValue(val)
    // Regular expression to match standard hex color format (e.g., #ffffff, #fff, #ABC123)
    const validHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)
    if (validHex) {
      onChange(val)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          {label}
        </span>
      )}

      <div className="flex items-center gap-4">
        {/* Live Preview Circle */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 transition-transform duration-200 border border-[var(--color-border-subtle)]"
          style={{ backgroundColor: value }}
          title="Color Preview"
        />

        {/* Swatches Grid */}
        <div className="grid grid-cols-8 gap-2 flex-grow">
          {PRESET_ICON_COLORS.map((color) => {
            const isSelected = value.toLowerCase() === color.toLowerCase()
            return (
              <button
                key={color}
                type="button"
                onClick={() => onChange(color)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-all duration-150 hover:scale-110 active:scale-95 focus:outline-none`}
                style={{
                  backgroundColor: color,
                  boxShadow: isSelected
                    ? '0 0 0 2px var(--color-bg-elevated), 0 0 0 4px var(--color-accent-primary)'
                    : 'none',
                }}
                title={color}
              />
            )
          })}
        </div>
      </div>

      {/* Custom Hex Color Input */}
      <div className="mt-1 w-32">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleCustomColorChange(e.target.value)}
          placeholder="#HEX"
          className="font-mono text-xs"
        />
      </div>
    </div>
  )
}
