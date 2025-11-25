import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "shadcn/ui Boilerplate",
  description: "A simple shadcn/ui boilerplate",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('ui-theme') || 'system'
                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                  document.documentElement.classList.add(systemTheme)
                } else {
                  document.documentElement.classList.add(theme)
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <ThemeProvider defaultTheme="system">
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
