# TypeScript / Next.js examples

## Files

| File | Description |
|---|---|
| `client.ts` | Typed i18nme client (plain TypeScript, no framework) |
| `nextjs/lib/i18n.ts` | Next.js App Router integration with ISR |
| `nextjs/hooks/useTranslations.ts` | Client-side hook for SPA pages |
| `nextjs/middleware.ts` | Locale detection middleware |

## Setup

```bash
# No extra packages needed — uses native fetch (Node 18+ / Next.js 13+)
export I18N_API_KEY="key_live_XXXX"
```

## Quick example — Next.js App Router

```tsx
// app/[locale]/layout.tsx
import { loadTranslations } from '@/lib/i18n'

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const t = await loadTranslations(params.locale)
  return (
    <html lang={params.locale}>
      <body>{children}</body>
    </html>
  )
}
```
