// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { isAfter, startOfDay } from 'date-fns'
import { toPairs } from 'lodash'
import moment, { Moment } from 'moment-timezone'
import { DateRange, DateRangeFormatFunction } from 'react-big-calendar'
import {
  Availabilities,
  Availability,
  MomentAvailabilities,
  MomentAvailability,
  Trimesters,
} from 'store/availability/availabilityTypes'

const time24Format = 'HH:mm'

const RECURRING_AVAILABILITY_SUMMER_START_MONTH = 6
const RECURRING_AVAILABILITY_FALL_START_MONTH = 9
/** Get the trimester, given a date. Defaults to today */
export const getTrimester = (date: Moment = moment()) => {
  const month = date.month() + 1
  if (month >= RECURRING_AVAILABILITY_FALL_START_MONTH) return Trimesters.FALL
  if (month >= RECURRING_AVAILABILITY_SUMMER_START_MONTH) return Trimesters.SUMMER
  return Trimesters.SPRING
}

// Helper function that uses date-fns methods to determine if a date is between two other dates
export const dateHourIsBetween = (start: Date, candidate: Date, end: Date): boolean =>
  (candidate.getTime() === start.getTime() || isAfter(candidate, start)) &&
  (candidate.getTime() === end.getTime() || isAfter(end, candidate))

export const dateIsBetween = (start: Date, candidate: Date, end: Date): boolean => {
  const startOfCandidate = startOfDay(candidate)
  const startOfStart = startOfDay(start)
  const startOfEnd = startOfDay(end)

  return (
    (startOfCandidate.getTime() === startOfStart.getTime() || isAfter(startOfCandidate, startOfStart)) &&
    (startOfCandidate.getTime() === startOfEnd.getTime() || isAfter(startOfEnd, startOfCandidate))
  )
}

export const timeIsBetween = (start: Date, candidate: Date, end: Date) =>
  candidate.getHours() >= start.getHours() && candidate.getHours() <= end.getHours()

export const eventTimeRangeFormat: DateRangeFormatFunction = (range: DateRange) =>
  `${moment(range.start).format('h:mma')} - ${moment(range.end).format('h:mma')}`

// use this for formats prop for react big calendar
export const calendarDateFormats = { timeGutterFormat: 'h:mma', eventTimeRangeFormat }

// Utility functions for localizing and de-localizing recurring availability (Availability objects)
// For use with recurring availability modal
export const localizeAvailability = (availabilities: Availabilities, start?: Moment) => {
  const returnAvailability: MomentAvailabilities = {}
  // Pairs where first value is weekday and second value is an array of availability ({ start, end }) time
  // strings in UTC
  const availabilityPairs: [string, Availability[]][] = toPairs(availabilities)

  // We need to convert availability from UTC. This means we may need to break availabilities that span midnight
  // Into two availability objects
  const orderedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  orderedDays.forEach(d => {
    returnAvailability[d] = []
  })

  const sunday = moment(start).subtract(moment(start).isoWeekday(), 'day')
  availabilityPairs.forEach(pair => {
    const weekday = pair[0]
    const availabilities = pair[1]
    const dayIdx = orderedDays.indexOf(weekday)
    const day = moment(moment(sunday).add(dayIdx, 'day'))
    availabilities.forEach(ava => {
      let start = moment.tz(`${day.format('YYYY-MM-DD')} ${ava.start}`, 'UTC').local()
      let end = moment.tz(`${day.format('YYYY-MM-DD')} ${ava.end}`, 'UTC').local()

      // We have to adjust for DST (since fall times are)
      // if (getTrimester(start) === Trimesters.SPRING && start.isDST()) {
      //   start = start.subtract(1, 'h')
      //   end = end.subtract(1, 'h')
      // }

      // If they're on the same day, we add this availability object to that day in our return availabilities
      if (start.day() === end.day()) {
        // The EXCEPTION to that rule is if the days are in different trimesters
        if (getTrimester(start) === getTrimester(day)) {
          const weekday = start.format('dddd').toLowerCase()
          returnAvailability[weekday].push({ start, end })
        }
      } else {
        returnAvailability[start.format('dddd').toLowerCase()].push({ start, end: moment(start).endOf('day') })
        returnAvailability[end.format('dddd').toLowerCase()].push({ start: moment(end).startOf('day'), end })
        // Start to midnight, midnight to end
      }
    })
  })
  Object.keys(returnAvailability).forEach(k => {
    // Sort
    returnAvailability[k].sort((a, b) => {
      return (
        moment.duration(a.start.diff(moment(a.start).startOf('day'))).asMinutes() -
        moment.duration(b.start.diff(moment(b.start).startOf('day'))).asMinutes()
      )
    })
    // // Then join abutting slots
    const mergedAvailability: MomentAvailability[] = []
    returnAvailability[k].forEach(a => {
      if (mergedAvailability.length) {
        const currentEnd = mergedAvailability[mergedAvailability.length - 1].end
        const currentEndMinutes = moment.duration(currentEnd.diff(moment(currentEnd).startOf('day'))).asMinutes()
        const newStartMinutes = moment.duration(a.start.diff(moment(a.start).startOf('day'))).asMinutes()
        // We can't use typical diff because the days may be in different local weeks (i.e. later hour but earlier week)
        const diff = currentEndMinutes - newStartMinutes
        if (diff >= -1) {
          mergedAvailability[mergedAvailability.length - 1].end.set({ hours: a.end.hour(), minutes: a.end.minute() })
        } else {
          mergedAvailability.push(a)
        }
      } else {
        mergedAvailability.push(a)
      }
    })
    returnAvailability[k] = mergedAvailability
  })

  return returnAvailability
}

export const delocalizeAvailability = (availabilities: MomentAvailabilities) => {
  const returnAvailability: Availabilities = {}
  // Pairs where first value is weekday and second value is an array of availability ({ start, end }) time
  // strings in UTC
  const availabilityPairs: [string, MomentAvailability[]][] = toPairs(availabilities)

  // We need to convert availability from UTC. This means we may need to break availabilities that span midnight
  // Into two availability objects
  const orderedDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  orderedDays.forEach(d => {
    returnAvailability[d] = []
  })

  availabilityPairs.forEach(pair => {
    const availabilities = pair[1]
    availabilities.forEach(ava => {
      const start = moment(ava.start).utc()
      // const start = moment(`${day.format('YYYY-MM-DD')} ${ava.start.format(time24Format)}`).utc()
      const end = moment(ava.end).utc()
      // If they're on the same day, we add this availability object to that day in our return availabilities
      if (start.day() === end.day()) {
        const weekday = start.format('dddd').toLowerCase()
        const availability = { start: start.format(time24Format), end: end.format(time24Format) }
        if (availability.start !== availability.end) {
          returnAvailability[weekday].push(availability)
        }
      } else {
        // Start to midnight, midnight to end
        const firstAvailability = {
          start: start.format(time24Format),
          end: moment(start).endOf('day').format(time24Format),
        }
        if (firstAvailability.start !== firstAvailability.end) {
          returnAvailability[start.format('dddd').toLowerCase()].push(firstAvailability)
        }
        const secondAvailability = {
          start: moment(end).startOf('day').format(time24Format),
          end: end.format(time24Format),
        }
        if (secondAvailability.start !== secondAvailability.end) {
          returnAvailability[end.format('dddd').toLowerCase()].push(secondAvailability)
        }
      }
    })
  })

  return returnAvailability
}

// Given a date string, assume it's a deadline and return a value that we can use to sort deadlines.
// Note that for deadlines, all dates in the first half of the year come AFTER dates in the second half of the
// year. But the actual year on the date is irrelevant, so we use a static year to get the sorting right
export const extractDeadlineSortDate = (date: string) => {
  const momentedDate = moment(date)
  return momentedDate.year(momentedDate.month() < 5 ? 2001 : 2000)
}
