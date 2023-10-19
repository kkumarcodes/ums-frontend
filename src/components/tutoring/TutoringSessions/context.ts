import { createCtx } from 'components/administrator'
import { NoteStatus, SessionStatus, SessionType, TimeRangeFilter } from 'components/tutoring/TutoringSessions'
import { Moment } from 'moment'

export type TutoringSessionsContext = {
  isAdminSTSPage?: boolean
  isAdminStudentSessionsPage?: boolean
  tutorID?: number
  studentID?: number
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  searchText: string
  setSearchText: React.Dispatch<React.SetStateAction<string>>
  selectedTimeRange: TimeRangeFilter
  setTimeRange: React.Dispatch<React.SetStateAction<TimeRangeFilter>>
  sessionType: SessionType[]
  setSessionType: React.Dispatch<React.SetStateAction<SessionType[]>>
  sessionStatus: SessionStatus[]
  setSessionStatus: React.Dispatch<React.SetStateAction<SessionStatus[]>>
  noteStatus: NoteStatus[]
  setNoteStatus: React.Dispatch<React.SetStateAction<NoteStatus[]>>
  startRange: Moment | null
  setStartRange: React.Dispatch<React.SetStateAction<Moment | null>>
  endRange: Moment | null
  setEndRange: React.Dispatch<React.SetStateAction<Moment | null>>
}

export const [useTutoringSessionsCtx, TutoringSessionsProvider] = createCtx<TutoringSessionsContext>()
