# React examples

A context provider + hook pattern for i18nme in React SPAs.

## Files

| File | Description |
|---|---|
| `I18nProvider.tsx` | Context provider — fetches translations once and makes them available globally |
| `useT.tsx` | Convenience hook for inline use |

## Usage

**1. Wrap your app**

```tsx
// main.tsx or App.tsx
import { I18nProvider } from './I18nProvider'

export default function App() {
  return (
    <I18nProvider locale="en" apiKey={import.meta.env.VITE_I18N_API_KEY}>
      <Router />
    </I18nProvider>
  )
}
```

**2. Use translations anywhere**

```tsx
import { useT } from './useT'

export function WelcomeBanner() {
  const t = useT()
  return <h1>{t('common.welcome')}</h1>
}
```

## Vite setup

Add your API key to `.env.local`:

```bash
VITE_I18N_API_KEY=key_live_XXXX
```
