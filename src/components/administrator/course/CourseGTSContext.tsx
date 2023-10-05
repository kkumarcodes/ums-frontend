// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import { createCtx } from '../utils'

// We use context to communicate with our course form
export type CourseGTSContext = {
  // We keep track of all the prospective courses, so we can show them on a calendar and whatnot
  GTSCourses: Partial<GroupTutoringSession>[]
  setGTSCourses: React.Dispatch<React.SetStateAction<Partial<GroupTutoringSession>[]>>
  timezone: string
  // startDate: string // Datetime string (obviously)
  // setStartDate: React.Dispatch<React.SetStateAction<string>>
  // numWeeks: number
  // setNumWeeks: React.Dispatch<React.SetStateAction<number>>
}

export const [useCourseGTSCtx, CourseGTSContextProvider] = createCtx<CourseGTSContext>()
