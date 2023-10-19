// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import moment, { Moment } from 'moment'
import { TutorAvailability } from 'store/tutoring/tutoringTypes'

export type TimeInterval = {
  start: string
  end: string
}

/**
 * Given a bunch of TimeInterval objects, return moment objects representing the _start_ of meetings
 * of duration @param duration minutes. @granularity determines min amount of time between successive
 * meeting starts.
 * This algorithm is greedy ;)
 * @param intervals
 * @param granularity
 * @param duration
 */
const extractSessionTimes = (
  intervals: (TimeInterval | TutorAvailability)[],
  granularity = 30,
  duration = 60,
): Moment[] => {
  const times: Moment[] = []
  const sortedIntervals = intervals
    .map(i => ({
      start: moment(i.start),
      end: moment(i.end),
    }))
    .sort(i => i.end.valueOf())

  /**
   * Here we connect intervals that don't have any time between them, and
   * create start times from each interval.
   * All while looping over sortedIntervals just the one time.
   */
  let intervalIdx = 0
  while (sortedIntervals.length > intervalIdx) {
    // Check to see if interval butts up against next interval. If it does, connect them.
    const interval = sortedIntervals[intervalIdx]
    if (interval.end.minute() === 59) {
      interval.end = interval.end.add(1, 'm')
    }
    const nextInterval = sortedIntervals.length > intervalIdx ? sortedIntervals[intervalIdx + 1] : null
    if (nextInterval && nextInterval.start === interval.end) {
      interval.end = nextInterval.end
      sortedIntervals.splice(intervalIdx + 1, 1)
    } else {
      // Once we've connected interval to as many as possible, create start times from interval.
      intervalIdx += 1
      const currentTime = interval.start
      while (currentTime < interval.end) {
        if (moment(currentTime).add(duration, 'm') <= interval.end) {
          times.push(moment(currentTime.valueOf()))
        }

        currentTime.add(granularity, 'm')
      }
    }
  }

  return times.sort((a: Moment, b: Moment) => a.valueOf() - b.valueOf())
}

export default extractSessionTimes
