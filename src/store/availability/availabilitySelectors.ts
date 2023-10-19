import { createSelector } from '@reduxjs/toolkit'
import { getTrimester, localizeAvailability } from 'libs/ScheduleSelector/date-utils'
import { isEmpty, range } from 'lodash'
import moment, { Moment } from 'moment'
import { RootState } from 'store/rootReducer'
import { Availabilities, MomentAvailabilities, Trimesters } from './availabilityTypes'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export const getAvailabilities = (state: RootState) => state.availability.availabilities
export const getRecurringAvailability = (state: RootState) => state.availability.recurringAvailability

export const selectAvailabilityForTutor = (pk?: number) =>
  createSelector(getAvailabilities, avails => (pk ? avails.filter(a => a.tutor === pk) : []))
export const selectAvailabilityForCounselor = (pk?: number) =>
  createSelector(getAvailabilities, avails => (pk ? avails.filter(a => a.counselor === pk) : []))
export const selectAvailability = ({ counselor, tutor }: { counselor?: number; tutor?: number }) =>
  createSelector(getAvailabilities, avails => {
    if (counselor) return avails.filter(a => a.counselor === counselor)
    if (tutor) return avails.filter(a => a.tutor === tutor)
    return []
  })

export const selectLocalizedRecurringAvailability = (startDate: Moment) =>
  createSelector(getRecurringAvailability, ra => {
    const availability: Availabilities = {}
    range(7).forEach(idx => {
      const day = moment(startDate).add(idx, 'd')
      const dayName = day.format('dddd').toLowerCase()
      const trimester = getTrimester(day)
      availability[dayName] = ra?.availability ? ra.availability[trimester as Trimesters][dayName] : []
    })
    if (!isEmpty(availability)) {
      return localizeAvailability(availability, startDate)
    }
    const blankReturn: MomentAvailabilities = {}
    return blankReturn
  })

export const selectLocalizedRecurringAvailabilityTrimester = (trimester: Trimesters) =>
  createSelector(getRecurringAvailability, ra => (ra ? localizeAvailability(ra.availability[trimester]) : []))
