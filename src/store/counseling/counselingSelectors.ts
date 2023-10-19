// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import moment from 'moment'
import { findIndex, findLast, isEmpty, orderBy, values } from 'lodash'
import { RootState } from 'store/rootReducer'
import { getStudents } from 'store/user/usersSelector'
import { RoadmapSemesters } from './counselingTypes'

// Months in which different semesters start
const FALL_START = 9
const SUMMER_START = 6

export const getCounselorMeetings = (state: RootState) => state.counseling.counselorMeetings
export const getCounselorMeetingTemplates = (state: RootState) => state.counseling.counselorMeetingTemplates
export const getCounselorNotes = (state: RootState) => state.counseling.counselorNotes
export const getRoadmaps = (state: RootState) => state.counseling.roadmaps
export const getAgendaItems = (state: RootState) => state.counseling.agendaItems
export const getCounselingHoursGrants = (state: RootState) => state.counseling.counselingHoursGrants
export const getAgendaItemTemplates = (state: RootState) => state.counseling.agendaItemTemplates
export const getStudentActivities = (state: RootState) => state.counseling.studentActivities
const getTimeCards = (state: RootState) => state.counseling.counselorTimeCards

export const selectCounselorTimeCards = createSelector(getTimeCards, v => values(v))
export const selectCounselorTimeEntries = createSelector(
  (state: RootState) => state.counseling.counselorTimeEntries,
  v => values(v),
)

// Counselor Notes
export const selectCounselorNotes = createSelector(getCounselorNotes, counselorNotes => values(counselorNotes))
export const selectCounselorNotesForStudent = (pk?: number) =>
  createSelector(getCounselorNotes, n => (pk ? values(n).filter(note => note.student === pk) : []))
export const selectCOunselorNotesForMeeting = (mtgPK?: number) =>
  createSelector(getCounselorNotes, notes => (mtgPK ? values(notes).filter(n => n.counselor_meeting === mtgPK) : []))

export const selectRoadmaps = createSelector(getRoadmaps, roadmaps => values(roadmaps))
export const selectRoadmap = (pk?: number) => createSelector(getRoadmaps, roads => (pk ? roads[pk] : undefined))
export const selectStudentActivities = createSelector(getStudentActivities, studentActivities =>
  values(studentActivities),
)

// CounselorMeetings
export const selectCounselorMeetings = createSelector(getCounselorMeetings, counselorMeetings =>
  values(counselorMeetings),
)
export const selectCounselorMeetingsObject = createSelector(getCounselorMeetings, k => k)
export const selectCounselorMeeting = (pk?: number) =>
  createSelector(getCounselorMeetings, m => (pk ? m[pk] : undefined))

export const selectCounselorMeetingTemplates = createSelector(getCounselorMeetingTemplates, counselorMeetingTemplates =>
  values(counselorMeetingTemplates),
)

export const selectCounselorMeetingTemplate = (pk: number | undefined) =>
  createSelector(getCounselorMeetingTemplates, meetings => (pk ? meetings[pk] : undefined))

export const selectCounselorMeetingTemplatesForRoadmap = (roadmap?: number) =>
  createSelector([getRoadmaps, getCounselorMeetingTemplates], (roads, temps) =>
    roadmap ? roads[roadmap].counselor_meeting_templates.map(t => temps[t]) : [],
  )

export const selectCounselorMeetingsForStudent = (studentPK?: number) =>
  createSelector(getCounselorMeetings, m => (studentPK ? values(m).filter(a => a.student === studentPK) : []))

// CounselingHoursGrants
export const selectCounselingHoursGrant = (pk?: number) =>
  createSelector(getCounselingHoursGrants, g => (pk ? g[pk] : undefined))
export const selectCounselingHoursGrants = createSelector(getCounselingHoursGrants, values)

/** This is a very special selector. We return all of the counselor meetings for a student, but we adjust the semester
 * and grade for meetings if they have a date set so that the grade/semester matches the date set relative
 * to the student's graduation year
 */
export const selectCMForStudentWithTransformedSemesters = (studentPK?: number) =>
  createSelector([selectCounselorMeetingsForStudent(studentPK), getStudents], (meetings, students) => {
    if (!studentPK) return []
    const student = students[studentPK]
    return meetings.map(m => {
      if (!m.start) return m
      let { grade, semester } = m
      const yearDiff = student.graduation_year - moment(m.start).year()
      grade = moment(m.start).month() >= FALL_START ? 13 - yearDiff : 12 - yearDiff
      semester = RoadmapSemesters.Two
      if (moment(m.start).month() >= SUMMER_START) semester = RoadmapSemesters.Summer
      if (moment(m.start).month() >= FALL_START) semester = RoadmapSemesters.One
      return { ...m, grade, semester }
    })
  })

// Returns next (future or unscheduled) meeting AFTER the most recent meeting with notes finalized
// Only returns the meeting if it is unscheduled or in the future
export const selectNextCounselorMeetingForStudent = (studentPK?: number, lastMeetingPK?: number) =>
  createSelector(getCounselorMeetings, meetings => {
    if (!studentPK) return undefined
    const orderedMeetings = orderBy(values(meetings), ['start', 'order'], ['asc', 'asc'])
      .filter(m => m.student === studentPK)
      .filter(m => !m.cancelled)
    const lastFinalizedMeeting = lastMeetingPK
      ? meetings[lastMeetingPK]
      : findLast(orderedMeetings, m => m.notes_finalized)
    const futureOrUnscheduled = orderedMeetings.filter(m => !m.start || moment(m.start).isAfter())
    if (!lastFinalizedMeeting) return isEmpty(futureOrUnscheduled) ? undefined : futureOrUnscheduled[0]
    const lastFinalizedMeetingIdx = findIndex(orderedMeetings, m => m.pk === lastFinalizedMeeting.pk)
    return lastFinalizedMeetingIdx < orderedMeetings.length - 2
      ? orderedMeetings[lastFinalizedMeetingIdx + 1]
      : undefined
  })

// Agenda Items
export const selectAgendaItemsForMeeting = (meetingPK?: number) =>
  createSelector(getAgendaItems, ai => (meetingPK ? values(ai).filter(a => a.counselor_meeting === meetingPK) : []))

// Agenda Item Templates by CMT pk
export const selectAgendaItemTemplatesForMeetingTemplate = (meetingID: number) =>
  createSelector(getAgendaItemTemplates, ait => values(ait).filter(t => t.counselor_meeting_template === meetingID))

export const selectAgendaItemTemplate = (pk?: number) =>
  createSelector(getAgendaItemTemplates, agendaItems => (pk ? agendaItems[pk] : undefined))

export const selectAgendaItemTemplates = () =>
  createSelector(getAgendaItemTemplates, agendaItems => values(agendaItems))
/**
 * Return list of student activities for given student
 */
export const selectStudentActivitiesForStudent = (studentID: number) =>
  createSelector(selectStudentActivities, studentActivities => studentActivities.filter(sa => sa.student === studentID))
