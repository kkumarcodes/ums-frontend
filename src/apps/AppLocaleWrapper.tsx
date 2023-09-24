// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { ReactNode } from 'react'
import { LocaleContextProvider, useCreateLocaleCtx } from './LocaleContext'

type Props = {
  children: ReactNode
}
const AppLocaleWrapper = ({ children }: Props) => {
  const ctxValue = useCreateLocaleCtx()
  return <LocaleContextProvider value={ctxValue}>{children}</LocaleContextProvider>
}

export default AppLocaleWrapper
