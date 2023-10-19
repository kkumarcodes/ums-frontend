// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import moment from 'moment'
import { clone, orderBy, reduce } from 'lodash'
import { Availability, AvailabilityState, RecurringAvailability, TrimesterAvailabilities } from './availabilityTypes'

export type ClearAvailabilityPayload = {
  counselor?: number
  tutor?: number
  startRange: string
  endRange: string
}

const initialState: AvailabilityState = {
  availabilities: [],
  recurringAvailability: null,
}
const availabilitySlice = createSlice({
  name: 'availability',
  initialState,

  reducers: {
    // Clear availabilities for either a counselor or a tutor between two dates
    clearAvailabilities(state, action: PayloadAction<ClearAvailabilityPayload>) {
      state.availabilities = state.availabilities.filter(a => {
        if (action.payload.counselor && a.counselor !== action.payload.counselor) return true
        if (action.payload.tutor && a.tutor !== action.payload.tutor) return true
        // This availability is for our user. Remove if it's within our range
        return (
          moment(a.end).isBefore(moment(action.payload.startRange)) ||
          moment(a.start).isAfter(moment(action.payload.endRange))
        )
      })
    },
    // Replaces all availabilities (for tutor/counselor)
    // in our state between startRange and endRange with a new set of availabilities
    setAvailabilities(
      state,
      action: PayloadAction<{ availability: Availability[]; startRange: string; endRange: string }>,
    ) {
      // payload is empty, filter out tutor's availabilities between startRange and endRange (must have deleted)
      if (action.payload.availability.length === 0) {
        console.warn('Cannot set availabilities to empty payload. Use clearAvailabilities reducer instead')
        return
      }
      const mergedPayload: Availability[] = reduce(
        orderBy(action.payload.availability, 'start'),
        (arr: Availability[], current) => {
          if (arr.length === 0) return [current]
          if (arr[arr.length - 1].end === current.start && arr[arr.length - 1].location === current.location) {
            arr[arr.length - 1].end = current.end
          } else {
            arr.push(current)
          }
          return arr
        },
        [],
      )
      const { counselor, tutor } = action.payload.availability[0]
      // Keeps all availabilities for other tutors and filters out availabilities in the range of the payload for our tutor
      const filteredAvailabilities = state.availabilities.filter(a => {
        if (counselor && a.counselor !== counselor) return true
        if (tutor && a.tutor !== tutor) return true
        // This availability is for our user. Remove!
        return (
          moment(a.start).isAfter(moment(action.payload.endRange)) ||
          moment(a.end).isBefore(moment(action.payload.startRange))
        )
      })
      state.availabilities = filteredAvailabilities.concat(
        mergedPayload.map(({ tutor, counselor, start, end, location }) => ({
          tutor,
          start,
          end,
          location,
          counselor,
        })),
      )
    },
    setRecurringAvailability(state, action: PayloadAction<RecurringAvailability>) {
      state.recurringAvailability = action.payload
    },
    updateRecurringAvailability(state, action: PayloadAction<TrimesterAvailabilities>) {
      state.recurringAvailability = {
        ...(state.recurringAvailability as RecurringAvailability),
        availability: action.payload,
      }
    },
  },
})

export const {
  setRecurringAvailability,
  updateRecurringAvailability,
  setAvailabilities,
  clearAvailabilities,
} = availabilitySlice.actions

export default availabilitySlice.reducer
