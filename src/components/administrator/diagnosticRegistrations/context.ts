// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import { Moment } from 'moment'

export type DiagnosticRegistrationsContext = {
  // Search on student/parent name/email
  // Also search on GTS title
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>

  // Filter for date when registration was `created`
  startRegistrationRange: Moment | null
  setStartRegistrationRange: React.Dispatch<React.SetStateAction<Moment | null>>
  endRegistrationRange: Moment | null
  setEndRegistrationRange: React.Dispatch<React.SetStateAction<Moment | null>>

  // Filter for date test is to take place
  startGTSRange: Moment | null
  setStartGTSRange: React.Dispatch<React.SetStateAction<Moment | null>>
  endGTSRange: Moment | null
  setEndGTSRange: React.Dispatch<React.SetStateAction<Moment | null>>
}
export const [useDiagnosticRegistrationContext, DiagnosticRegistrationContextProvider] = createCtx<
  DiagnosticRegistrationsContext
>()
