import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

function initialTheme() {
  try {
    const saved = localStorage.getItem('fps-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('fps-theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`}>
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
