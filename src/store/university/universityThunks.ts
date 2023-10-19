// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import errorHandler from 'store/errorHandler'

import { StudentUniversityDecision, University, Deadline } from './universityTypes'
import {
  addStudentUniversityDecision,
  addStudentUniversityDecisions,
  addUniversities,
  addDeadlines,
  removeStudentUniversityDecision,
} from './universitySlice'

const STUDENT_UNIVERSITY_DECISION_ENDPOINT = (pk?: number) =>
  pk ? `/university/student-university-decisions/${pk}/` : '/university/student-university-decisions/'

const UNIVERSITY_ENDPOINT = (pk?: number) => (pk ? `/university/universities/${pk}/` : '/university/universities/')
const DEADLINE_ENDPOINT = (pk?: number) => (pk ? `/university/deadlines/${pk}/` : '/university/deadlines/')

// Query params that can be used to filter deadlines we get from backend
export type FetchDeadlinesFilter = {
  student?: number
  university?: number
  counselor?: number
}
export const fetchDeadlines = (filter?: FetchDeadlinesFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Deadline[] } = await API.get(DEADLINE_ENDPOINT(), { params: filter })
    dispatch(addDeadlines(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createStudentUniversityDecision = (sud: Partial<StudentUniversityDecision>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: StudentUniversityDecision } = await API.post(STUDENT_UNIVERSITY_DECISION_ENDPOINT(), sud)
    dispatch(addStudentUniversityDecision(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const updateStudentUniversityDecision = (pk: number | string, sud: Partial<StudentUniversityDecision>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: StudentUniversityDecision } = await API.patch(STUDENT_UNIVERSITY_DECISION_ENDPOINT(pk), sud)
    dispatch(addStudentUniversityDecision(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export type StudentUniversityDecisionFilter = {
  student?: number
  is_applying?: string
  counselor?: number
}
export const fetchStudentUniversityDecisions = (filter?: StudentUniversityDecisionFilter) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: StudentUniversityDecision[] } = await API.get(STUDENT_UNIVERSITY_DECISION_ENDPOINT(), {
      params: filter,
    })
    dispatch(addStudentUniversityDecisions(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const deleteStudentUniversityDecision = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(STUDENT_UNIVERSITY_DECISION_ENDPOINT(pk))
    dispatch(removeStudentUniversityDecision(pk))
    return true
  } catch (err) {
    throw errorHandler(err)
  }
}

// Fetch all of our universities. Note that this also sets state.loadedAllUniversities = true
export const fetchUniversities = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: University[] } = await API.get(UNIVERSITY_ENDPOINT())
    dispatch(addUniversities(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
