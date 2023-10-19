// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import { values } from 'lodash'
import API from 'store/api'
import { Platform } from 'store/common/commonTypes'
import errorHandler from 'store/errorHandler'
import { RootState } from 'store/rootReducer'
import { ReduxDispatch } from 'store/store'
import { addStudentAndNestedObjects, BackendStudent, fetchStudent } from 'store/user/usersThunks'
import {
  addCourse,
  addCourses,
  addGroupTutoringSession,
  addGroupTutoringSessions,
  addLocation,
  addLocations,
  addStudentTutoringSession,
  addStudentTutoringSessions,
  addTimeCard,
  addTimeCardLineItem,
  addTimeCards,
  addTutoringPackage,
  addTutoringPackagePurchase,
  addTutoringPackagePurchases,
  addTutoringPackages,
  addTutoringServices,
  addTutoringSessionNote,
  addTutoringSessionNotes,
  removeCourse,
  removeStudentTutoringSession,
  removeTimeCard,
  removeTimeCardLineItem,
} from './tutoringSlice'
import {
  Course,
  GroupTutoringSession,
  Location,
  StudentTutoringSession,
  TutoringPackage,
  TutoringPackagePurchase,
  TutoringService,
  TutoringSessionNote,
  TutorTimeCard,
  TutorTimeCardLineItem,
  TutorTutoringSession,
} from './tutoringTypes'

const LATE_CANCEL_CHARGE_ENDPOINT = '/cw/magento-late-cancel/'
const LOCATION_ENDPOINT = (pk?: number | string) => (pk ? `/tutoring/locations/${pk}/` : '/tutoring/locations/')
const STUDENT_TUTORING_SESSIONS_ENDPOINT = (pk?: number | string) =>
  pk ? `/tutoring/student-tutoring-sessions/${pk}/` : '/tutoring/student-tutoring-sessions/'
const GROUP_TUTORING_SESSIONS_ENDPOINT = (pk?: number | string, includeStudentNames?: boolean) => {
  if (pk) return `/tutoring/group-tutoring-sessions/${pk}/`
  if (includeStudentNames) return '/tutoring/group-tutoring-sessions/?include_student_names=true'
  return '/tutoring/group-tutoring-sessions/'
}

const TUTOR_TUTORING_SESSIONS_ENDPOINT = (pk?: number | string) =>
  pk ? `/tutoring/tutor-tutoring-sessions/${pk}/` : '/tutoring/tutor-tutoring-sessions/'
const TUTORING_SESSION_NOTES_ENDPOINT = (pk?: number | string) =>
  pk ? `/tutoring/tutoring-session-notes/${pk}/` : '/tutoring/tutoring-session-notes/'
const TUTORING_SESSION_NOTES_RESEND_ENDPOINT = (pk?: number | string) => `/tutoring/tutoring-session-notes/${pk}/send/`
const TUTORING_PACKAGE_ENDPOINT = (pk?: number) =>
  pk ? `/tutoring/tutoring-packages/${pk}/` : '/tutoring/tutoring-packages/'

const PURCHASEABLE_TUTORING_PACKAGES_ENDPOINT = (studentPK: number) =>
  `/tutoring/purchaseable-tutoring-packages/?student=${studentPK}`

const TUTORING_PACKAGE_PURCHASE_ENDPOINT = (pk?: number) =>
  pk ? `/tutoring/tutoring-package-purchases/${pk}/` : '/tutoring/tutoring-package-purchases/'

const TIME_CARD_ENDPOINT = (pk?: number) => (pk ? `/tutoring/time-cards/${pk}/` : '/tutoring/time-cards/')

const TIME_CARD_LINE_ITEM_ENDPOINT = (pk?: number) =>
  pk ? `/tutoring/time-card-line-items/${pk}/` : '/tutoring/time-card-line-items/'

const COURSE_ENDPOINT = (pk?: number) => (pk ? `/tutoring/courses/${pk}/` : '/tutoring/courses/')
const ENROLL_STUDENT_IN_COURSE_ENDPOINT = (coursePK: number) => `/tutoring/courses/${coursePK}/enroll/`
const UNENROLL_STUDENT_FROM_COURSE_ENDPOINT = (coursePK: number) => `/tutoring/courses/${coursePK}/unenroll/`

const TUTORING_SERVICES_ENDPOINT = (pk?: number) =>
  pk ? `/tutoring/tutoring-services/${pk}/` : '/tutoring/tutoring-services/'

const MAGENTO_PAYMENT_ENDPOINT = '/cw/magento-paygo-purchase/'

export type TutoringPackagesFilter = {
  location?: number
}
export const fetchTutoringPackages = (filterProps: TutoringPackagesFilter) => async (dispatch: Dispatch) => {
  try {
    const endpoint = TUTORING_PACKAGE_ENDPOINT()
    const { data }: { data: TutoringPackage[] } = await API.get(endpoint)
    dispatch(addTutoringPackages(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createTutoringPackage = (tutoringPackage: Partial<TutoringPackage>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TutoringPackage } = await API.post(TUTORING_PACKAGE_ENDPOINT(), tutoringPackage)
    dispatch(addTutoringPackage(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const updateTutoringPackage = (tutoringPackage: Partial<TutoringPackage>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TutoringPackage } = await API.patch(
      TUTORING_PACKAGE_ENDPOINT(tutoringPackage.pk),
      tutoringPackage,
    )
    dispatch(addTutoringPackage(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all tutoring package purchases for a student
 * @param studentPK
 * @param onlyCommitNew (false) if True, then we'll only commit if that data we get from the backend
 *  contains new package purchases. Used by purchase tutoring package modal which refreshes regularly waiting
 *  for confirmation that user purchased package through Magento
 */
export const fetchTutoringPackagePurchases = (studentPK: number, onlyCommitNew = false) => async (
  dispatch: Dispatch,
  getState: () => RootState,
) => {
  try {
    const { data }: { data: TutoringPackagePurchase[] } = await API.get(
      `${TUTORING_PACKAGE_PURCHASE_ENDPOINT()}?student=${studentPK}`,
    )
    if (onlyCommitNew) {
      // We only commit if there are more packages in data
      const existingPackages = values(getState().tutoring.tutoringPackagePurchases).filter(p => p.student === studentPK)
        .length
      if (data.length > existingPackages) {
        dispatch(addTutoringPackagePurchases(data))
      }
    } else {
      dispatch(addTutoringPackagePurchases(data))
    }

    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Retrieve the tutoring packages that can be purchased for a student (as determined by their location and/or tutor)
 * @param studentPK
 */
export const fetchPurchaseableTutoringPackages = (studentPK: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TutoringPackage[] } = await API.get(PURCHASEABLE_TUTORING_PACKAGES_ENDPOINT(studentPK))
    dispatch(addTutoringPackages(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a new TutoringPackagePurchase
 */
export type CreateTutoringPackagePurchasePayload = {
  student: number
  tutoring_package: number
  execute_charge: boolean
  price_paid?: number
  hours?: number // Only for paygo packages
  admin_note?: string
}
export const createTutoringPackagePurchase = (purchase: CreateTutoringPackagePurchasePayload) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data }: { data: TutoringPackagePurchase[] } = await API.post(TUTORING_PACKAGE_PURCHASE_ENDPOINT(), purchase)
    dispatch(addTutoringPackagePurchases(data))
    // We re-fetch student so their hours summary is correct, but don't wait on it
    dispatch(fetchStudent(purchase.student))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/** Update a TutoringPackagePurchase (includes reversing the purchase) */
export const reverseTutoringPackagePurchase = (purchasePK: number) => async (dispatch: ReduxDispatch) => {
  try {
    const { data }: { data: TutoringPackagePurchase } = await API.post(
      `${TUTORING_PACKAGE_PURCHASE_ENDPOINT(purchasePK)}reverse/`,
    )
    dispatch(addTutoringPackagePurchase(data))
    // We re-fetch student so their hours summary is correct, but don't wait on it
    dispatch(fetchStudent(data.student))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single location, identified by @param locationID
 */
export const fetchLocation = (locationID: number | string) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(LOCATION_ENDPOINT(locationID))
    return dispatch(addLocation(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch all locations
 */
export const fetchLocations = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Location[] } = await API.get(LOCATION_ENDPOINT())
    dispatch(addLocations(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a single location: @param newLocation
 */
export const createLocation = (newLocation: Partial<Location>) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(LOCATION_ENDPOINT(), newLocation)
    return dispatch(addLocation(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Updates a single location: @param location
 */
export const updateLocation = (location: Partial<Location>) => async (dispatch: Dispatch) => {
  try {
    const response = await API.patch(LOCATION_ENDPOINT(location.pk), location)
    return dispatch(addLocation(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

export const createStudentTutoringSession = (session: Partial<StudentTutoringSession>) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data }: { data: StudentTutoringSession } = await API.post(STUDENT_TUTORING_SESSIONS_ENDPOINT(), session)
    // Update our student's remaining hours
    dispatch(fetchStudent(session.student as number, Platform.CAS))
    dispatch(addStudentTutoringSession(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

export type TutoringSessionFilter = {
  student?: number
  tutor?: number
  group?: boolean
  individual?: boolean

  // Admin only
  future?: boolean
  past?: boolean
}

export const fetchStudentTutoringSessions = (filter: TutoringSessionFilter) => async (dispatch: Dispatch) => {
  try {
    // If all is truthy, fetch all StudentTutoringSessions (ADMIN only)
    const queryString: string = Object.keys(filter)
      .map(key => `${key}=${filter[key]}`)
      .join('&')
    const url = `${STUDENT_TUTORING_SESSIONS_ENDPOINT()}?${queryString}`
    const response = await API.get(url)

    return dispatch(addStudentTutoringSessions(response.data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single StudentTutoringSession identified by @param sessionID
 */
export const fetchStudentTutoringSession = (sessionID: number | string) => async (dispatch: Dispatch) => {
  try {
    const url = `${STUDENT_TUTORING_SESSIONS_ENDPOINT()}${sessionID}/`
    const { data }: { data: StudentTutoringSession } = await API.get(url)
    dispatch(addStudentTutoringSession(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update a StudentTutoringSession, identified by @param sessionID with @param editSession
 */
export const updateStudentTutoringSession = (
  sessionID: number | string,
  editSession: Partial<StudentTutoringSession>,
) => async (dispatch: ReduxDispatch, getState: () => RootState) => {
  try {
    const url = `${STUDENT_TUTORING_SESSIONS_ENDPOINT()}${sessionID}/`
    const existingSession = getState().tutoring.studentTutoringSessions[sessionID as number]
    const { data }: { data: StudentTutoringSession } = await API.patch(url, editSession)
    if (existingSession) {
      dispatch(fetchStudent(existingSession.student, Platform.CAS))
    }
    dispatch(addStudentTutoringSession(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const convertTentativeSessionToConfirmed = (sessionPK: number) => async (
  dispatch: ReduxDispatch,
  getState: () => RootState,
) => {
  const url = `/tutoring/student-tutoring-sessions/${sessionPK}/convert/`
  try {
    const { data }: { data: StudentTutoringSession } = await API.post(url)
    dispatch(removeStudentTutoringSession({ pk: sessionPK }))
    dispatch(addStudentTutoringSession(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

interface GTSWithLocation extends Omit<GroupTutoringSession, 'location'> {
  location: Location
}

/**
 * Create a GroupTutoringSession
 */
export const createGroupTutoringSession = (session: Partial<GroupTutoringSession>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: GTSWithLocation } = await API.post(GROUP_TUTORING_SESSIONS_ENDPOINT(), session)
    // Map location to just ID
    dispatch(addGroupTutoringSession({ ...data, location: data.location.pk }))
    dispatch(addLocation(data.location))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export interface FetchGroupTutoringSessionsFilter {
  start_date?: string
  end_date?: string
  location?: number | number[]
  include_cancelled?: boolean
  exclude_classes?: boolean
  diagnostic?: boolean
}

/**
 * Fetch GroupTutoringSessions that satisfy filter criteria
 * @param filter { FetchGroupTutoringSessionsFilter} filter is passed as query params
 */
// ref: GroupTutoringSessionViewset to learn about filter default values
export const fetchGroupTutoringSessions = (filter: FetchGroupTutoringSessionsFilter, isTutor?: string) => async (
  dispatch: Dispatch,
) => {
  try {
    const response = await API.get(GROUP_TUTORING_SESSIONS_ENDPOINT(isTutor), { params: filter })
    // Map location to just ID
    const locations: Location[] = []
    const sessions: GroupTutoringSession[] = response.data.map((s: GTSWithLocation) => {
      locations.push(s.location)
      const session: GroupTutoringSession = { ...s, location: s.location.pk }
      return session
    })
    dispatch(addLocations(locations))
    dispatch(addGroupTutoringSessions(sessions))
    return sessions
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a single GroupTutoringSession identified by @param sessionID
 */
export const fetchGroupTutoringSession = (sessionID: number | string) => async (dispatch: Dispatch) => {
  try {
    const response = await API.get(GROUP_TUTORING_SESSIONS_ENDPOINT(sessionID))
    const session: GTSWithLocation = response.data
    dispatch(addLocation(session.location))
    const newSession: GroupTutoringSession = { ...session, location: session.location.pk }
    dispatch(addGroupTutoringSession(newSession))
    return session
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update a GroupTutoringSession, identified by @param sessionID with @param editSession
 */
export const updateGroupTutoringSession = (
  sessionID: number | string,
  editSession: Partial<GroupTutoringSession>,
) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: GTSWithLocation } = await API.patch(
      GROUP_TUTORING_SESSIONS_ENDPOINT(sessionID),
      editSession,
    )
    dispatch(addLocation(data.location))
    const session: GroupTutoringSession = { ...data, location: data.location.pk }
    dispatch(addGroupTutoringSession(session))
    return session
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * @description Fetches all TutoringSessions (individual and group) for a tutor
 * @param tutorID
 * @param include_past determines if passed sessions are included in response
 * @returns data {TutorTutoringSession}
 */
export const fetchTutorTutoringSessions = (tutorID: number | string, filter?: { include_past: boolean }) => async (
  dispatch: Dispatch,
) => {
  if (!tutorID) {
    throw new Error('fetchTutorTutoringSessions thunk missing tutorID arg')
  }
  try {
    const url = TUTOR_TUTORING_SESSIONS_ENDPOINT(tutorID)
    const { data }: { data: TutorTutoringSession } = filter?.include_past
      ? await API.get(url, { params: filter })
      : await API.get(url)
    dispatch(addStudentTutoringSessions(data.individual_tutoring_sessions))
    // Need to pull locations off of these group sessions
    const gtsWithLocs: GTSWithLocation[] = data.group_tutoring_sessions
    const locations: Location[] = []
    const gts: GroupTutoringSession[] = gtsWithLocs.map(gtsWithLoc => {
      locations.push(gtsWithLoc.location)
      return { ...gtsWithLoc, location: gtsWithLoc.location.pk }
    })
    dispatch(addLocations(locations))
    dispatch(addGroupTutoringSessions(gts))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export interface TutoringSessionNoteFilter {
  student?: number | string
  tutor?: number | string
  all?: boolean
}

export const fetchTutoringSessionNotes = (filter: TutoringSessionNoteFilter) => async (dispatch: Dispatch) => {
  const { student, tutor, all } = filter
  if (!student && !tutor && !all) {
    throw new Error('fetchTutoringSessionNotes thunk missing tutorID, studentID or all')
  }
  try {
    const url = TUTORING_SESSION_NOTES_ENDPOINT()
    const { data }: { data: TutoringSessionNote[] } = await API.get(url, { params: filter })
    dispatch(addTutoringSessionNotes(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

export const fetchTutoringSessionNote = (pk: number | string) => async (dispatch: Dispatch) => {
  try {
    const url = TUTORING_SESSION_NOTES_ENDPOINT(pk)
    const { data }: { data: TutoringSessionNote } = await API.get(url)
    dispatch(addTutoringSessionNote(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

export interface TutoringSessionNotePayload
  extends Partial<Omit<TutoringSessionNote, 'file_uploads' | 'resources' | 'pk' | 'slug'>> {
  update_resources?: string[]
  update_file_uploads?: string[]
  individual_tutoring_session?: number
  group_tutoring_session?: number
  // author?: number
}

export const createTutoringSessionNote = (payload: TutoringSessionNotePayload) => async (dispatch: Dispatch) => {
  const { individual_tutoring_session, group_tutoring_session, author } = payload

  if ((!individual_tutoring_session && !group_tutoring_session) || !author) {
    throw new Error('tutoring session note payload must contain tutoring session pk and author')
  }
  try {
    const url = TUTORING_SESSION_NOTES_ENDPOINT()
    const { data }: { data: TutoringSessionNote } = await API.post(url, payload)
    dispatch(addTutoringSessionNote(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const updateTutoringSessionNote = (
  sessionNoteID: number | string,
  payload: TutoringSessionNotePayload,
) => async (dispatch: Dispatch) => {
  const { individual_tutoring_session, group_tutoring_session, author } = payload

  if ((!individual_tutoring_session && !group_tutoring_session) || !author) {
    throw new Error('tutoring session note payload must contain tutoring session pk and author')
  }
  try {
    const url = TUTORING_SESSION_NOTES_ENDPOINT(sessionNoteID)
    const { data }: { data: TutoringSessionNote } = await API.patch(url, payload)
    dispatch(addTutoringSessionNote(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

type FetchTimeCardsFilter = {
  start?: string
  end?: string
  tutor?: number
}

/**
 * @param params object with optional start, end, tutor fields
 * @returns TimeCards
 * @description Fetch all time cards (admin), or only those belonging to @param tutor
 * @param start and @param end are datetime strings (UTC); inclusive dates
 */
export const fetchTimeCards = (params: FetchTimeCardsFilter) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_ENDPOINT()
  try {
    const { data }: { data: TutorTimeCard[] } = await API.get(url, { params })
    dispatch(addTimeCards(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a single time card by @param pk
 */
export const fetchTimeCard = (pk: number) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_ENDPOINT(pk)
  try {
    const { data }: { data: TutorTimeCard } = await API.get(url)
    dispatch(addTimeCard(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a time card with @param payload
 */
export type CreateTimeCardPayload = {
  start: string
  end: string
  tutors: number[]
}
export const createTimeCard = (payload: CreateTimeCardPayload) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_ENDPOINT()
  try {
    const { data }: { data: TutorTimeCard[] } = await API.post(url, payload)
    dispatch(addTimeCards(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update time card with @param pk with @param payload data.
 */
export const updateTimeCard = (pk: number, payload: Partial<TutorTimeCard>) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_ENDPOINT(pk)
  try {
    const { data }: { data: TutorTimeCard } = await API.patch(url, payload)
    dispatch(addTimeCard(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Delete time card with @param pk
 */
export const deleteTimeCard = (pk: number) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_ENDPOINT(pk)
  try {
    await API.delete(url)
    return dispatch(removeTimeCard({ pk }))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a time card line item with @param payload on timeCard with @param timeCardID
 */
export const createTimeCardLineItem = (timeCardID: number, payload: Partial<TutorTimeCardLineItem>) => async (
  dispatch: Dispatch,
) => {
  const url = TIME_CARD_LINE_ITEM_ENDPOINT()
  try {
    const { data }: { data: TutorTimeCardLineItem } = await API.post(url, payload)
    dispatch(addTimeCardLineItem({ timeCardID, data }))
    const timeCardResponse = await API.get(TIME_CARD_ENDPOINT(timeCardID))
    // We also update time card to get new total
    const timeCard: TutorTimeCard = timeCardResponse.data
    dispatch(addTimeCard(timeCard))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update time card line item with @param pk on time card with @param timeCardID with @param payload data.
 */
export const updateTimeCardLineItem = (
  timeCardID: number,
  pk: number,
  payload: Partial<TutorTimeCardLineItem>,
) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_LINE_ITEM_ENDPOINT(pk)
  try {
    const { data }: { data: TutorTimeCardLineItem } = await API.patch(url, payload)
    dispatch(addTimeCardLineItem({ timeCardID, data }))
    const timeCardResponse = await API.get(TIME_CARD_ENDPOINT(timeCardID))
    // We also update time card to get new total
    const timeCard: TutorTimeCard = timeCardResponse.data
    dispatch(addTimeCard(timeCard))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Delete time card with @param pk
 */
export const deleteTimeCardLineItem = (timeCardID: number, pk: number) => async (dispatch: Dispatch) => {
  const url = TIME_CARD_LINE_ITEM_ENDPOINT(pk)
  try {
    await API.delete(url)
    const result = dispatch(removeTimeCardLineItem({ pk, timeCardID }))
    const timeCardResponse = await API.get(TIME_CARD_ENDPOINT(timeCardID))
    const timeCard: TutorTimeCard = timeCardResponse.data
    dispatch(addTimeCard(timeCard))
    return result
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Approve time card with @param pk (must be admin)
 */
export const adminApproveTimeCard = (pk: any) => async (dispatch: Dispatch) => {
  const url = `/tutoring/time-cards/${pk}/admin-approve/`
  try {
    const { data } = await API.post(url)
    dispatch(addTimeCard(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Approve time card with @param pk (must be tutor)
 */
export const tutorApproveTimeCard = (pk: any) => async (dispatch: Dispatch) => {
  const url = `/tutoring/time-cards/${pk}/tutor-approve/`
  try {
    const { data } = await API.post(url)
    dispatch(addTimeCard(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const resendTutoringSessionNote = (
  sessionNoteID: number | string,
  payload?: TutoringSessionNotePayload,
) => async () => {
  try {
    const url = TUTORING_SESSION_NOTES_RESEND_ENDPOINT(sessionNoteID)
    await API.post(url, payload ?? {})
    return true
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Create a new course (a bunch of GroupTutoringSessions) */
export const createCourse = (course: Partial<Course>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Course } = await API.post(COURSE_ENDPOINT(), course)
    dispatch(addCourse(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Delete a course */
export const deleteCourse = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(COURSE_ENDPOINT(pk))
    dispatch(removeCourse({ pk }))
    return true
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Update a course (a bunch of GroupTutoringSessions) */
export const updateCourse = (courseID: number, payload: Partial<Course>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Course } = await API.patch(COURSE_ENDPOINT(courseID), payload)
    dispatch(addCourse(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Fetch all courses */

export const fetchCourses = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Array<Course> } = await API.get(COURSE_ENDPOINT())
    dispatch(addCourses(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/** Fetch a single course course */
export const fetchCourse = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Course } = await API.get(COURSE_ENDPOINT(pk))
    dispatch(addCourse(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/** Enroll single student in specific course
 * Used by students/parents to purchase a course. Used by admins to enroll student in course
 * without purchase
 */
export const enrollStudentInCourse = (studentPK: number, coursePK: number, purchase = false) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data }: { data: BackendStudent } = await API.post(ENROLL_STUDENT_IN_COURSE_ENDPOINT(coursePK), {
      student: studentPK,
      purchase,
    })
    addStudentAndNestedObjects(data, dispatch)
    dispatch(fetchStudentTutoringSessions({ student: studentPK }))
    dispatch(fetchCourses())
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Disenroll (remove) single student from specific course */
export const unenrollStudentInCourse = (studentPK: number, coursePK: number) => async (dispatch: ReduxDispatch) => {
  try {
    const { data }: { data: BackendStudent } = await API.post(UNENROLL_STUDENT_FROM_COURSE_ENDPOINT(coursePK), {
      student: studentPK,
    })
    addStudentAndNestedObjects(data, dispatch)
    dispatch(fetchCourses())
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all of the tutoring services (subjects)
 */
export const fetchTutoringServices = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: TutoringService[] } = await API.get(TUTORING_SERVICES_ENDPOINT())
    dispatch(addTutoringServices(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Execute a paygo payment for a student tutoring session (using Magento payments API)
 * @param student_tutoring_session {PK of StudentTutoringSession being paid for}
 * @param tutoring_package {optional PK of package being purchased (will determine price)}
 * Updates STUDENT upon success (so student has proper hours remianing)
 */
export const magentoAPIPayment = (student_tutoring_session: number, tutoring_package?: number) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data }: { data: BackendStudent } = await API.post(MAGENTO_PAYMENT_ENDPOINT, {
      student_tutoring_session,
      tutoring_package,
    })
    // Update session
    await dispatch(fetchStudentTutoringSession(student_tutoring_session))
    addStudentAndNestedObjects(data, dispatch)
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Execute a late cancel charge */
export const magentoLateCancelCharge = (student_tutoring_session: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: StudentTutoringSession } = await API.post(LATE_CANCEL_CHARGE_ENDPOINT, {
      student_tutoring_session,
    })
    await dispatch(addStudentTutoringSession(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
