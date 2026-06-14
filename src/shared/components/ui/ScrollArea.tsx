import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div 
        ref={ref} 
        className={cn("h-full w-full overflow-y-auto scrollbar-custom", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = 'ScrollArea'
