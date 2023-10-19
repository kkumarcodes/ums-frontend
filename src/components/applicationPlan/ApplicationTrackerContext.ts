// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx } from 'components/administrator'
import useStickyState from 'hooks/useStickyState'
import { map, uniq, values } from 'lodash'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { CounselorTrackerApplicationStatus } from 'store/university/universityTypes'
import { getStudents } from 'store/user/usersSelector'
import { ActiveTrackerColumns, HeaderLabel, SingleTableHeaders } from './types'

/** Hook that creates context and provider for counselor Application Tracker */
export function useCreateApplicationTrackerCtx() {
  // State we share with our toolbar for filtering columns and such
  const students = useSelector(getStudents)
  const allUniqGradYears = uniq(
    values(students)
      .map(student => student.graduation_year)
      .sort(),
  )
  const [selectedStudents, setSelectedStudents] = useState(map(students, 'pk'))
  const stickyState = useStickyState<HeaderLabel[]>('counselor_tracker_headers_version05', values(HeaderLabel))
  const activeTrackerColumnsState = useStickyState<ActiveTrackerColumns>('counselor_tracker_active_columns', {})
  const activeGradYearsState = useStickyState<number[]>('counselor_tracker_active_grad_years', allUniqGradYears)
  // Couldn't get TS to work nicely with this hook
  const selectedHeaders = stickyState[0] as HeaderLabel[]
  const setSelectedHeaders = stickyState[1] as React.Dispatch<React.SetStateAction<HeaderLabel[]>>
  const activeTrackerColumns = activeTrackerColumnsState[0] as ActiveTrackerColumns
  const setActiveTrackerColumns = activeTrackerColumnsState[1] as React.Dispatch<
    React.SetStateAction<ActiveTrackerColumns>
  >
  const selectedGradYears = activeGradYearsState[0] as number[]
  const setSelectedGradYears = activeGradYearsState[1] as React.SetStateAction<number[]>

  const [separateStudents, setSeparateStudents] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedAppStatus, setSelectedAppStatus] = useState(values(CounselorTrackerApplicationStatus))

  // The headers to display, based on selectedHeaders and whether or not students are separated
  const displayHeaders = separateStudents
    ? selectedHeaders.filter(h => !SingleTableHeaders.includes(h))
    : selectedHeaders

  return {
    allUniqGradYears,
    selectedStudents,
    setSelectedStudents,
    selectedHeaders,
    setSelectedHeaders,
    selectedGradYears,
    setSelectedGradYears,
    separateStudents,
    setSeparateStudents,
    search,
    setSearch,
    selectedAppStatus,
    setSelectedAppStatus,
    displayHeaders,
    activeTrackerColumns,
    setActiveTrackerColumns,
  }
}

export const [useApplicationTrackerCtx, ApplicationTrackerContextProvider] = createCtx<
  ReturnType<typeof useCreateApplicationTrackerCtx>
>()
