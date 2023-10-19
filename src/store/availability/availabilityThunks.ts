// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import moment from 'moment'
import API from 'store/api'
import errorHandler from 'store/errorHandler'
import { ReduxDispatch } from 'store/store'
import { UserType } from 'store/user/usersTypes'
import {
  clearAvailabilities,
  setAvailabilities,
  setRecurringAvailability,
  updateRecurringAvailability,
} from './availabilitySlice'
import {
  Availabilities,
  Availability,
  RecurringAvailability,
  RecurringAvailabilityLocations,
  TrimesterAvailabilities,
  Trimesters,
} from './availabilityTypes'

const AVAILABILITY_ENDPOINT = (id: number, userType: UserType) =>
  userType === UserType.Counselor
    ? `/cw/counseling/counselor-availability/${id}/`
    : `/cw/tutoring/tutor-availability/${id}/`

const RECURRING_AVAILABILITY_ENDPOINT = (pk: number, userType: UserType) =>
  userType === UserType.Counselor
    ? `/cw/counseling/counselor-availability/recurring/${pk}/`
    : `/cw/tutoring/tutor-availability/recurring/${pk}/`

export type AvailabilitiesFilter = {
  start?: string
  end?: string
  exclude_sessions?: boolean
  use_recurring_availability?: boolean
  location?: number | 'null'
  for_availability_view?: boolean
}

/**
 * Fetches all TutorAvailabilities for @param tutorID, if omitted fetches all TutorAvailabilities (must be admin)
 * @param start defaults to current_datetimeUTC if omitted, @param end defaults to two_weeks from current_datetimeUTC if omitted
 * @param exclude_sessions controls whether or not scheduled sessions are removed from tutor's availability
 */
export const fetchAvailabilities = (
  { tutor, counselor }: { tutor?: number; counselor?: number },
  params: AvailabilitiesFilter = {},
) => async (dispatch: Dispatch) => {
  const id = tutor || counselor
  if (!id) {
    console.warn('Must specify tutor or counselor to fetch availability for')
    return false
  }
  try {
    const range = {
      startRange: params.start || moment().toISOString(),
      endRange: params.end || moment().add(14, 'd').toISOString(),
    }
    const { data }: { data: Availability[] } = await API.get(
      AVAILABILITY_ENDPOINT(id, tutor ? UserType.Tutor : UserType.Counselor),
      { params },
    )
    if (data.length > 0) {
      dispatch(setAvailabilities({ availability: data, ...range }))
    } else {
      dispatch(clearAvailabilities({ counselor, tutor, ...range }))
    }
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Creates availability for tutor or counselor
 */
export type CreateAvailabilityPayload = {
  availability: Availabilities
  startRange: string
  endRange: string
  tutor?: number
  counselor?: number
  exclude_sessions?: boolean
}
export const createAvailability = ({
  availability,
  startRange,
  endRange,
  tutor,
  counselor,
  exclude_sessions = false,
}: CreateAvailabilityPayload) => async (dispatch: Dispatch) => {
  try {
    const range = { startRange, endRange }
    // Tack on our timezone offset so backend can validate with real gusto and purpose
    const id = tutor || counselor
    if (!id) {
      throw new Error('Must specify tutor or counselor to create availability for')
    }

    const { data }: { data: Availability[] } = await API.post(
      AVAILABILITY_ENDPOINT(id, tutor ? UserType.Tutor : UserType.Counselor),
      {
        tutor,
        counselor,
        availability,
        timezone_offset: new Date().getTimezoneOffset(),
      },
      { params: { exclude_sessions } },
    )
    if (data.length > 0) {
      dispatch(setAvailabilities({ availability: data, ...range }))
    } else {
      dispatch(clearAvailabilities({ counselor, tutor, ...range }))
    }
    return true
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch recurring availability for tutor with @param tutorID
 */
export const fetchRecurringAvailability = ({ tutor, counselor }: { tutor?: number; counselor?: number }) => async (
  dispatch: Dispatch,
) => {
  const id = tutor || counselor
  if (!id) {
    throw new Error('Must specify tutor or counselor to fetch availability for')
  }
  const url = RECURRING_AVAILABILITY_ENDPOINT(id, tutor ? UserType.Tutor : UserType.Counselor)
  try {
    const { data }: { data: RecurringAvailability } = await API.get(url)
    dispatch(setRecurringAvailability(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create/Update recurring availability for tutor with @param tutorID
 */
export type CreateRecurringAvailabilityPayload = {
  tutor?: number
  counselor?: number
  trimester: Trimesters
  availability: Availabilities
  locations?: RecurringAvailabilityLocations
}
export const createRecurringAvailability = ({
  tutor,
  counselor,
  trimester,
  availability,
  locations,
}: CreateRecurringAvailabilityPayload) => async (dispatch: Dispatch) => {
  const id = tutor || counselor
  if (!id) {
    console.warn('Tutor/Counselor ID required to create recurring availability')
    return false
  }
  const url = RECURRING_AVAILABILITY_ENDPOINT(id, tutor ? UserType.Tutor : UserType.Counselor)
  try {
    const { data }: { data: TrimesterAvailabilities } = await API.post(url, { trimester, availability, locations })
    dispatch(updateRecurringAvailability(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Resets all recurring availabilities for tutor with @param tutorID
 */
export type DeleteRecurringAvailabilityPayload = Omit<CreateRecurringAvailabilityPayload, 'availability'>
export const deleteRecurringAvailability = ({
  counselor,
  tutor,
  trimester,
}: DeleteRecurringAvailabilityPayload) => async (dispatch: ReduxDispatch) => {
  try {
    const blankAvailability: Availabilities = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }
    dispatch(createRecurringAvailability({ counselor, tutor, trimester, availability: blankAvailability }))
    return blankAvailability
  } catch (err) {
    throw errorHandler(err)
  }
}
