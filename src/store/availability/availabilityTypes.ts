// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Moment } from 'moment'

export interface AvailabilityState {
  availabilities: Availability[]
  recurringAvailability: RecurringAvailability | null
}

export interface Availability {
  // Either tutor or counselor must be set
  tutor?: number
  counselor?: number
  start: string
  end: string
  location: number | null
  // On the backend, we use AvailableTimespanSerializer objects, which don't correspond
  // exactly to TutorAvailability objects, and thus don't have a PK
  pk?: number
  slug?: string
  startRange?: string // needed for filtering availabilities after a fetch/post
  endRange?: string // needed for filtering availabilities after a fetch/post
}

export interface AvailabilityTimespan {
  start: string
  end: string
  location?: number | null
}

export interface Availabilities {
  [datestring: string]: AvailabilityTimespan[]
}
export enum Trimesters {
  FALL = 'fall',
  SUMMER = 'summer',
  SPRING = 'spring',
}

export enum Weekdays {
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
  Sunday,
}

export interface TrimesterAvailabilities {
  [Trimesters.SPRING]: Availabilities
  [Trimesters.SUMMER]: Availabilities
  [Trimesters.FALL]: Availabilities
}

export interface MomentAvailability {
  start: Moment
  end: Moment
}

export interface MomentAvailabilities {
  [datestring: string]: MomentAvailability[]
}

export type RecurringAvailabilityLocations = {
  [day: string]: number | null
}

export type TrimesterLocations = {
  [Trimesters.SPRING]: RecurringAvailabilityLocations
  [Trimesters.SUMMER]: RecurringAvailabilityLocations
  [Trimesters.FALL]: RecurringAvailabilityLocations
}
// In RecurringAvailability, Availabilities keys are days of the week; not datestrings
// start, end are 24hour timestrings (e.g start="8:00", end="14:00")
export interface RecurringAvailability {
  // Either tutor or counselor must be set
  tutor?: number
  counselor?: number
  id: number
  pk: number
  slug: string
  active: boolean
  created: string
  updated: string
  availability: TrimesterAvailabilities
  locations: TrimesterLocations
}
export interface BackendAvailability {
  // Either tutor or counselor must be set
  tutor?: number
  counselor?: number
  timezone_offset?: number
  availability: Availabilities
}
