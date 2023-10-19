// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createCtx, handleError } from 'components/administrator'
import { SessionType } from 'components/tutoring/TutoringSessions'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectTutors } from 'store/user/usersSelector'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchLocations, fetchStudentTutoringSessions, fetchGroupTutoringSessions } from 'store/tutoring/tutoringThunks'
import { fetchTutors, fetchZoomURLs } from 'store/user/usersThunks'
import moment from 'moment'
import { fetchAvailabilities } from 'store/availability/availabilityThunks'

export type OperationsCalendarContext = {
  // Filters for sessions
  locations: number[]
  setLocations: React.Dispatch<React.SetStateAction<number[]>>
  sessionType: SessionType
  setSessionType: React.Dispatch<React.SetStateAction<SessionType>>
  tutors: number[]
  setTutors: React.Dispatch<React.SetStateAction<number[]>>
  zoomURLs: string[]
  setZoomURLs: React.Dispatch<React.SetStateAction<string[]>>
  includeRemote: boolean
  setIncludeRemote: React.Dispatch<React.SetStateAction<boolean>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>

  // Filter for tutor availability
  includeTutorAvailability: boolean
  setIncludeTutorAvailability: React.Dispatch<React.SetStateAction<boolean>>
  // We only show availability for a single session at a time
  availabilityLocation: number | undefined
  setAvailabilityLocation: React.Dispatch<React.SetStateAction<number | undefined>>
  // Tutors for whome we are showing availability for
  availabilityTutors: number[]
  setAvailabilityTutors: React.Dispatch<React.SetStateAction<number[]>>
  useRecurring: boolean
  setUseRecurring: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * Custom hook for creating state and setters that comprise operations calendar context.
 * Returns object of type OperationsCalendarContext that can be used for context value
 */
export function useCreateOpsCalendarCtx() {
  const dispatch = useReduxDispatch()

  // Initialize our context
  const allTutors = useSelector(selectTutors).map(t => t.pk)
  const [tutors, setTutors] = useState<number[]>(allTutors)
  const [sessionType, setSessionType] = useState(SessionType.all)
  const [locations, setLocations] = useState<number[]>(useSelector(selectLocations).map(l => l.pk))
  const [zoomURLs, setZoomURLs] = useState<string[]>(useSelector((state: RootState) => state.user.proZoomURLs))
  const [includeRemote, setIncludeRemote] = useState(true)
  const [includeTutorAvailability, setIncludeTutorAvailability] = useState(false)
  const [availabilityTutors, setAvailabilityTutors] = useState<number[]>(allTutors)
  const [availabilityLocation, setAvailabilityLocation] = useState<number>()
  const [useRecurring, setUseRecurring] = useState(true)
  const [loading, setLoading] = useState(false)

  // Kep track of tutor availabilities that we've loaded
  // Below are state vars that AREN'T used for context
  const [loadedTutorAvailabilities, setLoadedTutorAvailabilities] = useState<number[]>([])

  // We need to load individual sessions and group sessions
  useEffect(() => {
    // Load our data
    setLoading(true)
    // Figure out what data to load then load it!!
    Promise.all([
      dispatch(fetchLocations()).then(locations => setLocations(locations.map(l => l.pk))),
      dispatch(fetchTutors()).then(tutors => setTutors(tutors.map(t => t.pk))),
      dispatch(fetchStudentTutoringSessions({ future: true, individual: true })),
      dispatch(
        fetchGroupTutoringSessions({
          start_date: moment().format('YYYY-MM-DD'),
          end_date: moment().add(3, 'month').format('YYYY-MM-DD'),
        }),
      ),
      dispatch(fetchZoomURLs()).then(setZoomURLs),
    ])
      .then(() => {
        setLoading(false)
      })
      .catch(() => handleError('Failed to load data :('))
  }, [dispatch])

  // When our set of selected tutors changes, we load tutor availability
  useEffect(() => {
    availabilityTutors.forEach(t => {
      if (!loadedTutorAvailabilities.includes(t)) {
        dispatch(
          fetchAvailabilities(
            { tutor: t },
            { start: moment().toISOString(), end: moment().add(3, 'month').toISOString() },
          ),
        ).then(() => setLoadedTutorAvailabilities([...loadedTutorAvailabilities, t]))
      }
    })
  }, [availabilityTutors, dispatch, loadedTutorAvailabilities])

  const contextValue: OperationsCalendarContext = {
    loading,
    setLoading,
    tutors,
    setTutors,
    sessionType,
    setSessionType,
    includeRemote,
    setIncludeRemote,
    locations,
    setLocations,
    zoomURLs,
    setZoomURLs,
    availabilityTutors,
    setAvailabilityTutors,
    includeTutorAvailability,
    setIncludeTutorAvailability,
    useRecurring,
    setUseRecurring,
    availabilityLocation,
    setAvailabilityLocation,
  }
  return contextValue
}

export const [useOperationsCalendarCtx, OperationsCalendarProvider] = createCtx<OperationsCalendarContext>()
