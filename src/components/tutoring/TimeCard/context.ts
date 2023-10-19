import { createCtx } from 'components/administrator'
import { Moment } from 'moment'

export type TimeCardContext = {
  tutorID?: number
  adminID?: number
  search: string
  setSearch: React.Dispatch<React.SetStateAction<string>>
  selectedStart: Moment
  setStart: React.Dispatch<React.SetStateAction<Moment>>
  selectedEnd: Moment
  setEnd: React.Dispatch<React.SetStateAction<Moment>>
}

export const [useTimeCardCtx, TimeCardProvider] = createCtx<TimeCardContext>()
