import { useTheme } from '../ThemeContext'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button 
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        isDark ? 'bg-gray-500' : 'bg-gray-200'
      }`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full transition-transform flex items-center justify-center text-xs ${
          isDark ? 'translate-x-6 bg-gray-300' : 'translate-x-1 bg-white'
        }`}
      >
        <span className="text-[10px]">
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  )
}

export default ThemeToggle