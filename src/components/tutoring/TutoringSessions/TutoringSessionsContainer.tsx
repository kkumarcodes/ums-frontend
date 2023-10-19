// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { handleError } from 'components/administrator'
import {
  NoteStatus,
  SessionStatus,
  SessionType,
  TutoringSessionsContext,
  TutoringSessionsProvider,
} from 'components/tutoring/TutoringSessions'
import { values } from 'lodash'
import { Moment } from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import {
  fetchStudentTutoringSessions,
  fetchTutoringSessionNotes,
  fetchTutorTutoringSessions,
} from 'store/tutoring/tutoringThunks'
import { fetchStudents } from 'store/user/usersThunks'

export enum TimeRangeFilter {
  All = 'All',
  Today = 'Just Today',
  Week = 'This Week',
  Month = 'This Month',
}

type Props = {
  children: JSX.Element
  tutorID?: number
  studentID?: number
  isAdminSTSPage?: boolean
  isAdminStudentSessionsPage?: boolean
}

/**
 * Container component for Tutoring Sessions.
 * Manages filter context and facilitates passing props to TutoringSessionNotesModal
 * @param children rendered child component
 * @param tutorID defined on Admin ExpandedTutorRow or Tutor TutoringSessions
 * @param studentID  defined on Admin ExpandedStudentRow
 * @param isAdminSTSPage whether the current active page is Admin StudentTutoringSessions Page
 * @param isAdminStudentSessionsPage whether the current active page is the expanded student row, and this table
 *  lists sessions for a specific student
 */
export const TutoringSessionsContainer = ({
  children,
  tutorID,
  studentID,
  isAdminSTSPage = false,
  isAdminStudentSessionsPage = false,
}: Props) => {
  const dispatch = useReduxDispatch()

  const defaultSessionType = values(SessionType)
  const defaultSessionStatus = [SessionStatus.upcoming]
  const defaultNoteStatus = [NoteStatus.pending, NoteStatus.completed]

  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

  const [selectedTimeRange, setTimeRange] = useState(TimeRangeFilter.All)

  const [sessionType, setSessionType] = useState(defaultSessionType)
  const [sessionStatus, setSessionStatus] = useState(defaultSessionStatus)
  const [noteStatus, setNoteStatus] = useState(defaultNoteStatus)

  const studentCount = useSelector((state: RootState) => {
    return Object.keys(state.user.students).length
  })

  const [startRange, setStartRange] = useState<Moment | null>(null)
  const [endRange, setEndRange] = useState<Moment | null>(null)

  // Context value
  const value: TutoringSessionsContext = {
    isAdminSTSPage,
    isAdminStudentSessionsPage,
    tutorID,
    studentID,
    loading,
    setLoading,
    searchText,
    setSearchText,
    selectedTimeRange,
    setTimeRange,
    sessionType,
    setSessionType,
    sessionStatus,
    setSessionStatus,
    noteStatus,
    setNoteStatus,
    startRange,
    setStartRange,
    endRange,
    setEndRange,
  }

  useEffect(() => {
    const promises: Array<Promise<any>> = []
    if (isAdminSTSPage) {
      promises.push(dispatch(fetchStudentTutoringSessions({ future: true, individual: true })))
      if (studentCount === 0) {
        promises.push(dispatch(fetchStudents({})))
      }
      promises.push(dispatch(fetchTutoringSessionNotes({ all: true })))
    } else if (tutorID) {
      promises.push(dispatch(fetchTutoringSessionNotes({ tutor: tutorID })))
      if (studentCount === 0) {
        promises.push(dispatch(fetchStudents({ tutor: tutorID })))
      }
      promises.push(dispatch(fetchTutorTutoringSessions(tutorID, { include_past: true })))
    } else if (studentID) {
      promises.push(dispatch(fetchTutoringSessionNotes({ student: studentID })))
      promises.push(dispatch(fetchStudentTutoringSessions({ student: studentID })))
    } else {
      return
    }
    setLoading(true)
    Promise.all(promises)
      .catch(err => handleError('Failed to fetch data.'))
      .finally(() => setLoading(false))
  }, [dispatch, isAdminSTSPage, studentCount, studentID, tutorID])

  return <TutoringSessionsProvider value={value}>{children}</TutoringSessionsProvider>
}

export default TutoringSessionsContainer
