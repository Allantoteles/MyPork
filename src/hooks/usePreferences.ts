"use client"

import { useMemo } from 'react'
import { usePreferencesContext } from '@/context/PreferencesContext'

const KG_TO_LB = 2.20462

export function usePreferences() {
  const { units, restSeconds, loading, updatePreferences, refreshPreferences } = usePreferencesContext()

  const isImperial = units.includes('lbs')

  const toDisplayWeight = (kg?: number | null) => {
    if (kg === null || kg === undefined) return ''
    const num = typeof kg === 'string' ? parseFloat(kg) : kg;
    if (isNaN(num)) return '';
    const value = isImperial ? num * KG_TO_LB : num
    return parseFloat(value.toFixed(1))
  }

  const toKg = (val: number) => {
    if (Number.isNaN(val)) return 0
    const value = isImperial ? val / KG_TO_LB : val
    return parseFloat(value.toFixed(3))
  }

  const formatWeight = (kg?: number | null) => {
    if (kg === null || kg === undefined) return '--'
    const value = toDisplayWeight(kg)
    const suffix = isImperial ? 'lbs' : 'kg'
    return `${value} ${suffix}`
  }

  return useMemo(() => ({
    units,
    restSeconds,
    isImperial,
    toDisplayWeight,
    toKg,
    formatWeight,
    loading,
    updatePreferences, // Exponemos esto para usarlo en settings
    refreshPreferences
  }), [units, restSeconds, isImperial, loading, updatePreferences, refreshPreferences])
}
