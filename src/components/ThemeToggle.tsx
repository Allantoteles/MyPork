"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Evitar hidratación incorrecta
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-12 h-6 bg-white/10 rounded-full" /> // Placeholder
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
        isDark ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <div 
        className={`absolute top-1 size-4 bg-white rounded-full transition-transform duration-300 ${
          isDark ? 'right-1' : 'left-1'
        }`} 
      />
      <span className="sr-only">Cambiar tema</span>
    </button>
  )
}
