// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { compact, flatten, map, pick, values } from 'lodash'
import { getDisplay } from 'store/display/displaySelectors'
import { CreateTutoringSessionNoteModalProps, EditTutoringSessionNoteModalProps } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { GroupTutoringSession, StudentTutoringSession, TutoringSessionNote } from 'store/tutoring/tutoringTypes'
import { getTutors } from 'store/user/usersSelector'

export const getLocations = (state: RootState) => state.tutoring.locations
export const getGroupTutoringSessions = (state: RootState) => state.tutoring.groupTutoringSessions
export const getStudentTutoringSessions = (state: RootState) => state.tutoring.studentTutoringSessions
export const getTutoringSessionNotes = (state: RootState) => state.tutoring.tutoringSessionNotes
export const getTimeCards = (state: RootState) => state.tutoring.timeCards
export const getTutoringPackages = (state: RootState) => state.tutoring.tutoringPackages
export const getCourses = (state: RootState) => state.tutoring.courses
export const getTutoringServices = (state: RootState) => state.tutoring.tutoringServices

export const selectCourse = (pk?: number) => createSelector(getCourses, courses => (pk ? courses[pk] : undefined))
export const selectLocations = createSelector(getLocations, locations => values(locations))
export const selectLocationsObject = createSelector(getLocations, l => l)
export const selectGroupTutoringSessions = createSelector(getGroupTutoringSessions, sessions => values(sessions))
export const selectStudentTutoringSessions = createSelector(getStudentTutoringSessions, sessions => values(sessions))
export const selectSTSForStudent = (student?: number) =>
  createSelector(getStudentTutoringSessions, sessions =>
    student ? values(sessions).filter(s => s.student === student) : [],
  )

// THIS Selector should only be used on the admin platform as enrolled students is not on GTS for other users
export const selectGTSForStudent = (studentSlug?: string) =>
  createSelector(getGroupTutoringSessions, sessions =>
    studentSlug ? values(sessions).filter(s => (s.enrolled_students ?? []).includes(studentSlug)) : [],
  )

export const selectTimeCards = createSelector(getTimeCards, timeCards => values(timeCards))
export const selectTutoringPackages = createSelector(getTutoringPackages, packages => {
  return values(packages)
})
export const selectTutoringServices = createSelector(getTutoringServices, s => values(s))

export const selectSessionTutors = createSelector([getGroupTutoringSessions, getTutors], (sessions, tutors) => {
  const primaryIDs = map(sessions, 'primary_tutor')
  const supportIDs = flatten(map(sessions, 'support_tutors'))
  const tutorIDs = compact(primaryIDs.concat(supportIDs))

  return pick(tutors, tutorIDs)
})

export const selectTutoringSessions = createSelector(
  [getStudentTutoringSessions, getGroupTutoringSessions],
  (groupTutoringSessions, studentTutoringSessions) => {
    return values(studentTutoringSessions as Array<Partial<GroupTutoringSession | StudentTutoringSession>>).concat(
      values(groupTutoringSessions),
    )
  },
)

export const studentTutoringSessionSelectorFactory = (pk?: number) =>
  createSelector(getStudentTutoringSessions, sessions => (pk ? sessions[pk] : undefined))
export const groupTutoringSessionSelectorFactory = (pk?: number) =>
  createSelector(getGroupTutoringSessions, sessions => (pk ? sessions[pk] : undefined))

export const selectTutoringSessionNoteAndModalProps = createSelector(
  [getTutoringSessionNotes, getDisplay],
  (tutoringSessionNotes, display) => {
    const modalProps: EditTutoringSessionNoteModalProps | CreateTutoringSessionNoteModalProps | undefined =
      display.modals[display.activeModalIndex]?.modalProps
    const sessionNoteID = (modalProps as EditTutoringSessionNoteModalProps)?.sessionNoteID || null
    const sessionNote: TutoringSessionNote | null = sessionNoteID ? tutoringSessionNotes[sessionNoteID] : null
    return { sessionNote, modalProps }
  },
)
