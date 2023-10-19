// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import { TutoringSessionType } from 'store/tutoring/tutoringTypes'
import { Moment } from 'moment'

export type TutoringSessionModalContext = {
  studentID?: number
  loading: boolean
  sessionType: TutoringSessionType | null
  setSessionType: React.Dispatch<React.SetStateAction<TutoringSessionType | null>>
  selectedDuration: number
  setSelectedDuration: React.Dispatch<React.SetStateAction<number>>
  sessionLocation: 'null' | number | undefined
  setSessionLocation: React.Dispatch<React.SetStateAction<string | number | undefined>>
}

export const [
  useTutoringSessionModalCtx,
  TutoringSessionModalContextProvider,
] = createCtx<TutoringSessionModalContext>()
