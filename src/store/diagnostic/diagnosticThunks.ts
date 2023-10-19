// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import _ from 'lodash'
import API from 'store/api'
import { RootState } from 'store/rootReducer'
import { ReduxDispatch } from 'store/store'
import { addTask } from 'store/task/tasksSlice'
import { fetchTask } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { addGroupTutoringSessions } from 'store/tutoring/tutoringSlice'
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import errorHandler from '../errorHandler'
import {
  addDiagnostic,
  addDiagnosticResult,
  addDiagnosticResults,
  addDiagnostics,
  addTestResult,
  addTestResults,
  removeTestResult,
  addDiagnosticRegistration,
  addDiagnosticRegistrations,
} from './diagnosticSlice'
import {
  DiagnosticResult,
  DiagnosticStates,
  TransitionDiagnosticResultPayload,
  TestResult,
  DiagnosticRegistration,
} from './diagnosticTypes'

const DIAGNOSTIC_GTS_ENDPOINT = '/tutoring/diagnostic-group-tutoring-sessions/'
const DIAGNOSTIC_REGISTRATION_ENDPOINT = (pk?: number) =>
  pk ? `/tutoring/diagnostic/registration/${pk}/` : `/tutoring/diagnostic/registration/`
const DIAGNOSTIC_ENDPOINT = (id?: string | number) => (id ? `/tutoring/diagnostics/${id}/` : '/tutoring/diagnostics/')
const DIAGNOSTIC_RESULT_ENDPOINT = (id?: string | number) =>
  id ? `/tutoring/diagnostic-results/${id}/` : '/tutoring/diagnostic-results/'

const DIAGNOSTIC_RESULT_REASSIGN_ENDPOINT = (pk: number) => `${DIAGNOSTIC_RESULT_ENDPOINT(pk)}reassign/`

const DIAGNOSTIC_RESULT_TRANSITION_ENDPOINT = (id: number) => `/tutoring/diagnostic-results/${id}/transition-state/`
const ASSIGNED_DIAGNOSTICS_ENDPOINT = (studentID: number) => `/tutoring/diagnostics/assigned/?student=${studentID}`

const TEST_RESULT_ENDPOINT = (id?: number) => (id ? `/tutoring/test-results/${id}/` : `/tutoring/test-results/`)

/** Update the registration data associated with a diagnostic GTS */
export const updateDiagnosticGTSRegistrationData = (pk: number, registrationData: object) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: DiagnosticRegistration } = await API.patch(DIAGNOSTIC_REGISTRATION_ENDPOINT(pk), {
      registration_data: registrationData,
    })
    dispatch(addDiagnosticRegistration(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Retrieve all upcoming Diagnostic Group Tutoring Sessions to display on Diagnostics Landing Page */
export const fetchDiagnosticGTS = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: GroupTutoringSession[] } = await API.get(DIAGNOSTIC_GTS_ENDPOINT)
    dispatch(addGroupTutoringSessions(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Retreive all diagnostic registrations. Only admin authorized */
export const fetchDiagnosticRegistrations = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: DiagnosticRegistration[] } = await API.get(DIAGNOSTIC_REGISTRATION_ENDPOINT())
    dispatch(addDiagnosticRegistrations(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Create a DiagnosticRegistration from Diagnostic Landing Page */
export const createDiagnosticGTSRegistration = (diagnosticRegistration: Partial<DiagnosticRegistration>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: DiagnosticRegistration } = await API.post(
      DIAGNOSTIC_REGISTRATION_ENDPOINT,
      diagnosticRegistration,
    )
    dispatch(addDiagnosticRegistration(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Retrieve a single Diagnostic */
export const fetchDiagnostic = (diagnosticID: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(DIAGNOSTIC_ENDPOINT(diagnosticID))
    return dispatch(addDiagnostic(response.data))
  } catch (e) {
    return errorHandler(e)
  }
}

/** Retrieve all diagnostics */
export const fetchDiagnostics = () => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(DIAGNOSTIC_ENDPOINT())
    return dispatch(addDiagnostics(response.data))
  } catch (e) {
    return errorHandler(e)
  }
}

/**
 * Fetch the diagnostics that have been assigned to a student.
 * This view does put diagnostics in store, but also returns diagnostics
 * @param studentID
 * */
export const fetchAssignedDiagnostics = (studentID: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(ASSIGNED_DIAGNOSTICS_ENDPOINT(studentID))
    dispatch(addDiagnostics(response.data))
    return response.data
  } catch (e) {
    return errorHandler(e)
  }
}

/**
 * Utility method to take tasks off DiagnosticResult object and store them
 * @param diagnosticResult
 */
type BackendDiagnosticResult = DiagnosticResult & { tasks?: Task[] | number[] }
const extractDiagnosticResult = (
  diagnosticResult: BackendDiagnosticResult,
  dispatch: Dispatch,
  saveDiagnosticResult = true,
) => {
  if (diagnosticResult.tasks) {
    diagnosticResult.tasks.map(t => dispatch(addTask(t)))
    diagnosticResult.tasks = _.map(diagnosticResult.tasks, 'pk')
  }
  if (saveDiagnosticResult) {
    dispatch(addDiagnosticResult(diagnosticResult))
  }
  return diagnosticResult as DiagnosticResult
}

/** Retrieve a single DiagnosticResult */
export const fetchDiagnosticResult = (diagnosticResultID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: BackendDiagnosticResult } = await API.get(DIAGNOSTIC_RESULT_ENDPOINT(diagnosticResultID))
    extractDiagnosticResult(data, dispatch)
    return data
  } catch (e) {
    return errorHandler(e)
  }
}

/**
 * Retrieve all DiagnosticResults (Available to admins and tutors that are evaluators)
 * TODO: Update to allow filtering for students
 * */
export const fetchDiagnosticResults = (studentID?: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: BackendDiagnosticResult[] } = await API.get(DIAGNOSTIC_RESULT_ENDPOINT(), {
      params: { student: studentID },
    })
    data.map(dr => extractDiagnosticResult(dr, dispatch, false))
    dispatch(addDiagnosticResults(data))
    return data
  } catch (e) {
    throw errorHandler(e)
  }
}

/** Used exclusively for reassignment - performs no other update */
export const reassignDiagnosticResult = (pk: number, assignee: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: BackendDiagnosticResult } = await API.patch(DIAGNOSTIC_RESULT_REASSIGN_ENDPOINT(pk), {
      assigned_to: assignee,
    })
    dispatch(addDiagnosticResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Update a DiagnosticResult */
export const updateDiagnosticResult = (pk: number, diagnosticResult: Partial<DiagnosticResult>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data }: { data: BackendDiagnosticResult } = await API.patch(
      DIAGNOSTIC_RESULT_ENDPOINT(pk),
      diagnosticResult,
    )
    dispatch(addDiagnosticResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a DiagnosticResult (submit a diagnostic).
 * Will complete associated task
 */
export const saveDiagnosticResult = (diagnosticResult: Partial<DiagnosticResult>) => async (
  dispatch: ReduxDispatch,
  getState: () => RootState,
) => {
  try {
    if (diagnosticResult.pk) {
      const { data }: { data: BackendDiagnosticResult } = await API.patch(
        DIAGNOSTIC_RESULT_ENDPOINT(diagnosticResult.pk),
        diagnosticResult,
      )
      extractDiagnosticResult(data, dispatch)
      return data
    }
    const { data }: { data: BackendDiagnosticResult } = await API.post(DIAGNOSTIC_RESULT_ENDPOINT(), diagnosticResult)
    // Look for tasks that need to be updated. Non-blocking
    Object.values(getState().task.tasks).forEach((t: Task) => {
      if (t.diagnostic === diagnosticResult.diagnostic && !t.completed) {
        dispatch(fetchTask(t.pk))
      }
    })
    extractDiagnosticResult(data, dispatch)
    return data
  } catch (e) {
    return errorHandler(e)
  }
}

/**
 * Update the state of a DiagnosticResult
 * @param diagnosticResultID {Number}
 * @param state {DiagnosticStates}
 * @param data {return_to_student, recommendationfile_upload, score}
 */

export const transitionDiagnosticResultState = (
  diagnosticResultID: number,
  state: DiagnosticStates,
  data: TransitionDiagnosticResultPayload,
) => async (dispatch: Dispatch) => {
  try {
    const response = await API.patch(DIAGNOSTIC_RESULT_TRANSITION_ENDPOINT(diagnosticResultID), { ...data, state })
    const responseData: BackendDiagnosticResult = response.data
    extractDiagnosticResult(responseData, dispatch)
    return responseData
  } catch (e) {
    throw errorHandler(e)
  }
}

// TODO: Delete if not used before PR
type FetchTestResultFilter = {
  student?: number
  tutor?: number
}

/**
 * @returns TestResults
 * @description Fetch all test results (admin), or only test results for students that are associated with Tutor, Parent
 */
export const fetchTestResults = (params?: FetchTestResultFilter) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT()
  try {
    const { data }: { data: TestResult[] } = await API.get(url, { params })
    dispatch(addTestResults(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a single test result by @param pk
 */
export const fetchTestResult = (pk: number) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT(pk)
  try {
    const { data }: { data: TestResult } = await API.get(url)
    dispatch(addTestResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a test result with @param payload
 */
export const createTestResult = (payload: Partial<TestResult>) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT()
  try {
    const { data }: { data: TestResult } = await API.post(url, payload)
    dispatch(addTestResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update a test result identified by @param pk with @param payload
 */
export const updateTestResult = (pk: number, payload: Partial<TestResult>) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT(pk)
  try {
    const { data }: { data: TestResult } = await API.patch(url, payload)
    dispatch(addTestResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Delete a test result with @param pk
 */
export const deleteTestResult = (pk: number) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT(pk)
  try {
    const { data }: { data: TestResult } = await API.delete(url)
    dispatch(removeTestResult({ pk }))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update test result with @param pk with @param payload data.
 */
export const updateTimeCard = (pk: number, payload: Partial<TestResult>) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT(pk)
  try {
    const { data }: { data: TestResult } = await API.patch(url, payload)
    dispatch(addTestResult(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Delete test result with @param pk
 */
export const deleteTimeCard = (pk: number) => async (dispatch: Dispatch) => {
  const url = TEST_RESULT_ENDPOINT(pk)
  try {
    await API.delete(url)
    return dispatch(removeTestResult({ pk }))
  } catch (err) {
    throw errorHandler(err)
  }
}
