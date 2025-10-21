import { useTheme } from '../ThemeContext'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}

export default ThemeToggle