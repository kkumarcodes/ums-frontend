// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { find, values } from 'lodash'
import { RootState } from 'store/rootReducer'

export const getStudentUniversityDecisions = (state: RootState) => state.university.studentUniversityDecisions
export const getUniversities = (state: RootState) => state.university.universities
export const getDeadlines = (state: RootState) => state.university.deadlines

// University
export const selectUniversities = createSelector(getUniversities, values)
export const selectUniversitiesObject = createSelector(getUniversities, u => u)
export const selectUniversity = (universityPK?: number) =>
  createSelector(getUniversities, u => (universityPK ? u[universityPK] : undefined))
export const selectUniversityByIPED = (iped?: string | number) =>
  createSelector(getUniversities, unis => (iped ? values(unis).find(u => u.iped === iped.toString()) : undefined))

// Student University Decisions (won't return undefined values)
export const selectSUDs = (sudPKs: number[]) =>
  createSelector(getStudentUniversityDecisions, suds => sudPKs.map(s => suds[s]).filter(s => s))
export const selectSUDsForStudent = (studentPK?: number) =>
  createSelector(getStudentUniversityDecisions, suds => values(suds).filter(s => s.student === studentPK))
export const selectSUD = (sudPK?: number) =>
  createSelector(getStudentUniversityDecisions, u => (sudPK ? u[sudPK] : undefined))
export const selectSUDPKByUniStudent = (student?: number, university?: number) =>
  createSelector(getStudentUniversityDecisions, unis =>
    student && university ? find(values(unis), { student, university })?.pk : undefined,
  )

export const selectSUDsForTask = (taskID?: number) =>
  createSelector(
    getStudentUniversityDecisions,
    (state: RootState) => (taskID ? state.task.tasks[taskID] : undefined),
    (suds, task) => {
      if (!task) return []
      return values(suds).filter(s => task.student_university_decisions.includes(s.pk))
    },
  )

// Deadlines
export const selectDeadlinesForUniversity = (universityPK?: number) =>
  createSelector(getDeadlines, d => (universityPK ? values(d).filter(a => a.university === universityPK) : []))
