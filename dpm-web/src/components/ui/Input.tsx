import React from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

/**
 * Adaptive Input — works in both light and dark environments.
 * Uses explicit bg/text/border classes rather than inheriting the
 * parent's text-white to avoid the white-on-white bug.
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-white/70"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          // Base: always use explicit colors so inheritance from Layout.tsx text-white doesn't bleed in
          'block w-full px-3 py-2 rounded-md sm:text-sm',
          // Background & text — adaptive
          'bg-white text-gray-900 placeholder-gray-400',
          'dark:bg-[#1C1C1F] dark:text-white/90 dark:placeholder-white/30',
          // Border
          'border border-gray-300 dark:border-[#2A2A2A]',
          // Focus ring
          'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
          'dark:focus:ring-white/20 dark:focus:border-white/20',
          // Transitions
          'transition-colors',
          // Error state overrides border
          error && 'border-red-400 focus:ring-red-500 focus:border-red-500 dark:border-red-500/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-white/40">{helperText}</p>
      )}
    </div>
  )
}