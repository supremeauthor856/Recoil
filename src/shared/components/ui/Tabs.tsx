import { useState, ReactElement, Children, isValidElement, cloneElement } from 'react'
import { cn } from '../../utils/cn'

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs = ({ defaultValue, value, onValueChange, children, className }: TabsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue)
  
  const currentValue = value !== undefined ? value : internalValue
  
  const handleValueChange = (newValue: string) => {
    if (value === undefined) setInternalValue(newValue)
    if (onValueChange) onValueChange(newValue)
  }

  return (
    <div className={cn("w-full flex flex-col", className)}>
      {Children.map(children, child => {
        if (isValidElement(child)) {
          return cloneElement(child as ReactElement<any>, { 
            activeValue: currentValue, 
            onValueChange: handleValueChange 
          })
        }
        return child
      })}
    </div>
  )
}

export const TabsList = ({ children, activeValue, onValueChange, className }: any) => {
  return (
    <div className={cn("flex flex-row border-b border-[var(--color-border-subtle)]", className)}>
      {Children.map(children, child => {
        if (isValidElement(child)) {
          return cloneElement(child as ReactElement<any>, { activeValue, onValueChange })
        }
        return child
      })}
    </div>
  )
}

export const TabsTrigger = ({ value, children, activeValue, onValueChange, className }: any) => {
  const isActive = activeValue === value
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        "px-4 py-2 text-base font-medium transition-colors relative border-b-2",
        isActive 
          ? "border-[var(--color-accent-primary)] text-[var(--color-text-primary)]" 
          : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
        className
      )}
    >
      {children}
    </button>
  )
}

export const TabsContent = ({ value, children, activeValue, className }: any) => {
  if (value !== activeValue) return null
  return <div className={cn("py-4", className)}>{children}</div>
}
