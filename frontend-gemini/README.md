# shadcn/ui Boilerplate

A minimal shadcn/ui boilerplate built with Next.js, React, TypeScript, and Tailwind CSS.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Adding shadcn/ui Components

Install any shadcn/ui component:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
# ... etc
```

Components will be added to the `components/ui` directory.

## Project Structure

```
├── app/
│   ├── globals.css      # Global styles with CSS variables
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/          # shadcn/ui components will go here
├── lib/
│   └── utils.ts         # Utility functions (cn helper)
├── components.json      # shadcn/ui configuration
├── tailwind.config.ts   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Migration Notes

This boilerplate is designed to be easily migrated into an existing project:

1. **Core files to copy:**
   - `lib/utils.ts` - Utility functions
   - `components.json` - shadcn/ui config
   - CSS variables from `app/globals.css`
   - Tailwind config from `tailwind.config.ts`

2. **Components:**
   - All shadcn/ui components are in `components/ui/`
   - Each component is self-contained and can be copied individually

3. **Dependencies to install:**
   - `class-variance-authority`
   - `clsx`
   - `tailwind-merge`
   - `lucide-react` (for icons)

## Learn More

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
