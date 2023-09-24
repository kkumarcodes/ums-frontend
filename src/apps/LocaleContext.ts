// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import useStickyState from 'hooks/useStickyState'

/** Hook that creates context and provider for counselor Application Tracker */
export function useCreateLocaleCtx() {
  const [locale, setLocale] = useStickyState('localePreference', 'enUS')

  return {
    locale,
    setLocale,
  }
}

export const [useLocaleCtx, LocaleContextProvider] = createCtx<ReturnType<typeof useCreateLocaleCtx>>()
