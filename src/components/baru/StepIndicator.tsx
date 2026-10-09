'use client'

import React from 'react'

interface StepIndicatorProps {
  steps: string[]
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  const progress = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
        <span className="text-primary font-bold">
          LANGKAH {current + 1} DARI {steps.length}
        </span>
        <span>{steps[current]}</span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-surface-container overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
