"use client"

import * as React from "react"
import { Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <span className="absolute text-xl rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100">🍌</span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}