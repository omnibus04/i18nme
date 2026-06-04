// useT.tsx — convenience hook that returns just the t() function
// Requires <I18nProvider> somewhere above in the tree.
//
// Usage:
//   const t = useT()
//   return <p>{t('common.welcome')}</p>

import { useI18n } from './I18nProvider'

export function useT() {
  return useI18n().t
}
