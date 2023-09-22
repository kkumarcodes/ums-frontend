// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import _ from 'lodash'
import API from 'store/api'
import { FileUpload, Platform } from 'store/common/commonTypes'
import { addCounselingFileUpload, addCounselingFileUploads } from 'store/counseling/counselingSlice'
import errorHandler from 'store/errorHandler'
import { RootState } from 'store/rootReducer'
import { ReduxDispatch } from 'store/store'
import { addLocation, addLocations } from 'store/tutoring/tutoringSlice'
import { Location } from 'store/tutoring/tutoringTypes'
import {
  Counselor,
  Parent,
  Student,
  StudentHighSchoolCourse,
  StudentUpdate,
  Tutor,
  User,
  UserType,
} from 'store/user/usersTypes'
import {
  addAdministrators,
  addCounselor,
  addCounselors,
  addCourse,
  addCourses,
  addParent,
  addParents,
  addStudent,
  addStudents,
  addTutor,
  addTutors,
  removeCourse,
  setProZoomURLs,
} from './usersSlice'

const TUTOR_ENDPOINT = (pk?: number) => (pk ? `/user/tutors/${pk}/` : '/user/tutors/')
const TUTOR_ZOOM_INVITE_ENDPOINT = (pk: number) => `/user/tutors/${pk}/invite-zoom/`
const STUDENT_ENDPOINT = (pk?: number) => (pk ? `/user/students/${pk}/` : '/user/students/')
const STUDENT_LAST_PAID_SESSION_ENDPOINT = '/user/students/last-paid-meeting/'
const COUNSELOR_ENDPOINT = (pk?: number) => (pk ? `/user/counselors/${pk}/` : '/user/counselors/')
const PARENT_ENDPOINT = (pk?: number) => (pk ? `/user/parents/${pk}/` : '/user/parents/')
const ADMINISTRATOR_ENDPOINT = (pk?: number) => (pk ? `/user/administrators/${pk}/` : '/user/administrators/')
const INVITE_USER_ENDPOINT = '/user/invite/'
const HS_COURSE_ENDPOINT = (pk?: number) => (pk ? `/user/high-school-courses/${pk}/` : `/user/high-school-courses/`)
const ZOOM_URLS_ENDPOINT = '/user/zoom-urls/'

/**
 * Utility method that adds nested objects on student to store, replaces them with PK, then adds student to store
 * @param student
 */
export type BackendStudent = Omit<Student, 'counseling_file_uploads'> & {
  hours: {
    individual_curriculum: number
    individual_test_prep: number
    group_test_prep: number
    total_individual_curriculum: number
    total_individual_test_prep: number
    total_group_test_prep: number
  }
  file_uploads: FileUpload[]
}

/**
 * Our student serializer on the backend includes some nested data (location, hours, counseling_file_uploads)
 * We pull off and flatten that nested data before putting it in store
 */
export const addStudentAndNestedObjects = (student: BackendStudent, dispatch: Dispatch) => {
  if (typeof student.location === 'object' && student.location) {
    dispatch(addLocation(student.location))
    student.location = student.location.pk
  }
  student.individual_curriculum_hours = student.hours?.individual_curriculum
  student.individual_test_prep_hours = student.hours?.individual_test_prep
  student.group_test_prep_hours = student.hours?.group_test_prep
  student.total_group_test_prep_hours = student.hours?.total_group_test_prep
  student.total_individual_curriculum_hours = student.hours?.total_individual_curriculum
  student.total_individual_test_prep_hours = student.hours?.total_individual_test_prep

  if (student.hasOwnProperty('hours')) {
    delete student.hours
  }

  // Create file uploads
  if (student.file_uploads?.length) {
    // Pull off the file uploads and add our student as their counselor_student
    student.file_uploads.forEach(cfu => dispatch(addCounselingFileUpload(cfu)))
  }

  const newStudent = student as Student
  newStudent.counseling_file_uploads = (student.file_uploads || []).map(c => c.slug)

  dispatch(addStudent(newStudent))
}

/**
 * Fetch a single student, identified by @param studentID
 * @param platform identifies which serializer (counseling or tutoring) will be used to retrieve data
 * See StudentViewset
 */
export const fetchStudent = (studentID: number, platform?: Platform) => async (
  dispatch: Dispatch,
  getState: () => RootState,
) => {
  try {
    let url = STUDENT_ENDPOINT(studentID)
    // Determine which type of serializer to use on the backend
    if (platform === Platform.CAS) url += '?platform=tutoring'
    else if (platform === Platform.CAP) url += '?platform=counseling'
    const { data }: { data: BackendStudent } = await API.get(url)
    const state = getState()
    if (
      platform === Platform.CAS ||
      (state.user.activeUser?.userType === UserType.Student && state.user.activeUser?.platform === Platform.CAS)
    ) {
      data.loaded_tutoring_data = true
    }
    addStudentAndNestedObjects(data, dispatch)
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// See StudentViewset. Two different serializers are supported
export enum StudentSerializerPlatform {
  Counseling = 'counseling',
  Tutoring = 'tutoring',
}
export type FetchStudentsFilter = {
  tutor?: number
  counselor?: number
  condensed?: boolean
  platform?: StudentSerializerPlatform
}
/**
 * Fetch all students who meet filter criteria
 * @param filter { FetchStudentsFilter } Passed directly as query params to endpoint
 */
export const fetchStudents = (filter: FetchStudentsFilter) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(STUDENT_ENDPOINT(), { params: filter })
    const locations: Location[] = []
    const fileUploads: FileUpload[] = []
    const students = data.map((stud: BackendStudent) => {
      if (stud.location && typeof stud.location === 'object') {
        locations.push(stud.location)
        stud.location = stud.location.pk
      }
      stud.individual_curriculum_hours = stud.hours?.individual_curriculum
      stud.individual_test_prep_hours = stud.hours?.individual_test_prep
      stud.group_test_prep_hours = stud.hours?.group_test_prep
      stud.total_group_test_prep_hours = stud.hours?.total_group_test_prep
      stud.total_individual_curriculum_hours = stud.hours?.total_individual_curriculum
      stud.total_individual_test_prep_hours = stud.hours?.total_individual_test_prep

      if (stud.hasOwnProperty('hours')) {
        delete stud.hours
      }
      if (stud.file_uploads) {
        fileUploads.push(...stud.file_uploads)
        stud.counseling_file_uploads = stud.file_uploads.map(fu => fu.slug)
        delete stud.file_uploads
      }

      return stud
    })
    dispatch(addLocations(locations))
    dispatch(addCounselingFileUploads(fileUploads))
    return dispatch(addStudents(students))
  } catch (err) {
    return errorHandler(err)
  }
}

// Fetch last_paid_meeting for all students, then augment our existing students in store with this new field
type LastPaidMeetingStudent = {
  pk: number
  last_paid_meeting: string
}
export const fetchStudentLastMeeting = () => async (dispatch: Dispatch, getState: () => RootState) => {
  try {
    const { data }: { data: LastPaidMeetingStudent[] } = await API.get(STUDENT_LAST_PAID_SESSION_ENDPOINT)
    const groupedData = _.groupBy(data, 'pk')
    const existingStudents = _.values(getState().user.students)
    const augmentedStudents = existingStudents.map(s => {
      return { ...s, last_paid_meeting: groupedData[s.pk][0].last_paid_meeting }
    })
    dispatch(addStudents(augmentedStudents))
    return augmentedStudents
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a single student: @param newStudent
 */
export const createStudent = (newStudent: Partial<Student>) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.post(STUDENT_ENDPOINT(), newStudent)
    addStudentAndNestedObjects(data, dispatch)
    return data
  } catch (err) {
    errorHandler(err)
    return err
  }
}

/**
 * Send invitation to a user (to create their account and join platform)
 * @param slug {string} Slug of CW User object (Student/Tutor/Parent/Counselor) to be invited
 * We also update the user in store (with correct last invite datetime)
 */
export const inviteUser = (slug: string, userType: UserType) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.post(INVITE_USER_ENDPOINT, { uuid: slug })
    // Update user in store
    if (userType === UserType.Student) {
      addStudentAndNestedObjects(data, dispatch)
    } else if (userType === UserType.Tutor) {
      dispatch(addTutor(data))
    } else if (userType === UserType.Counselor) {
      dispatch(addCounselor(data))
    } else if (userType === UserType.Parent) {
      dispatch(addParent(data))
    } else {
      throw new Error('Invalid user type')
    }
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a student, identified by @param studentID with @param editStudent
 */
export const updateStudent = (studentID: number, editStudent: Partial<StudentUpdate>) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.patch(STUDENT_ENDPOINT(studentID), editStudent)
    return addStudentAndNestedObjects(data, dispatch)
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single tutor, identified by @param tutorID
 */
export const fetchTutor = (tutorID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Tutor } = await API.get(TUTOR_ENDPOINT(tutorID))
    dispatch(addTutor(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all tutors
 */
export const fetchTutors = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Tutor[] } = await API.get(TUTOR_ENDPOINT())
    dispatch(addTutors(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Send tutor zoom invite. If zoom account already existed for tutor, then we'll get back a tutor
 * obj with updated zoom details
 */
export const sendTutorZoomInvite = (tutorPK: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Tutor } = await API.post(TUTOR_ZOOM_INVITE_ENDPOINT(tutorPK))
    dispatch(addTutor(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a single tutor: @param newTutor
 */
export const createTutor = (newTutor: Partial<Tutor>) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.post(TUTOR_ENDPOINT(), newTutor)
    const zoom_error = data.zoom_error
    if (zoom_error !== '') console.error(zoom_error)
    dispatch(addTutor(data.tutor))
    return data.tutor as Tutor
  } catch (err) {
    errorHandler(err)
  }
}

/**
 * Update a tutor, identified by @param tutorID with @param editTutor
 */
export const updateTutor = (tutorID: number, editTutor: Partial<Tutor>) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.patch(TUTOR_ENDPOINT(tutorID), editTutor)
    return dispatch(addTutor(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single counselor, identified by @param counselorID
 */
export const fetchCounselor = (counselorID: number) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(COUNSELOR_ENDPOINT(counselorID))
    return dispatch(addCounselor(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch all counselors
 */
export const fetchCounselors = () => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(COUNSELOR_ENDPOINT())
    return dispatch(addCounselors(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch all administrators (must be an admin)
 */
export const fetchAdministrators = () => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(ADMINISTRATOR_ENDPOINT())
    return dispatch(addAdministrators(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a single counselor: @param newCounselor
 */
export const createCounselor = (newCounselor: Partial<Counselor>) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.post(COUNSELOR_ENDPOINT(), newCounselor)
    return dispatch(addCounselor(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a counselor, identified by @param counselorID with @param editCounselor
 */
export const updateCounselor = (counselorID: number, editCounselor: Partial<Counselor>) => async (
  dispatch: Dispatch,
) => {
  try {
    const { data } = await API.patch(COUNSELOR_ENDPOINT(counselorID), editCounselor)
    return dispatch(addCounselor(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single parent, identified by @param parentID
 */
export const fetchParent = (parentID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Parent } = await API.get(PARENT_ENDPOINT(parentID))
    dispatch(addParent(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all parents
 */
export const fetchParents = () => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(PARENT_ENDPOINT())
    return dispatch(addParents(data))
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a single parent: @param newParent
 */
export const createParent = (newParent: Partial<Parent>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Parent } = await API.post(PARENT_ENDPOINT(), newParent)
    dispatch(addParent(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Update a parent, identified by @param parentID with @param editParent
 */
export const updateParent = (parentID: number, editParent: Partial<Parent>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Parent } = await API.patch(PARENT_ENDPOINT(parentID), editParent)
    dispatch(addParent(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Helper function to call the appropriate thunk to fetch any user
 * @param studentID
 */
export const fetchUser = (userType: UserType, userID: number) => {
  switch (userType) {
    case UserType.Counselor:
      return fetchCounselor(userID)
    case UserType.Student:
      return fetchStudent(userID)
    case UserType.Tutor:
      return fetchTutor(userID)
    case UserType.Parent:
      return fetchParent(userID)
    default:
      throw new Error('Attempting to fetch unsupported user type')
  }
}

/** Helper function to call the appropriate thunk to create any user
 * @param userType
 * @param newUser
 */
export const createUser = (userType: UserType, newUser: Partial<User>) => {
  switch (userType) {
    case UserType.Counselor:
      return createCounselor(newUser as Counselor)
    case UserType.Student:
      return createStudent(newUser as Student)
    case UserType.Tutor:
      return createTutor(newUser as Tutor)
    case UserType.Parent:
      return createParent(newUser as Parent)
    default:
      throw new Error('Attempting to create unsupported user type')
  }
}

/**
 * Fetch all courses for a student with @param studentID
 */
export const fetchHSCourses = (studentID: number | string) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(HS_COURSE_ENDPOINT(), { params: { student: studentID } })
    dispatch(addCourses(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Fetch a single course identified by @param courseID
 */
export const fetchHSCourse = (courseID: number) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.get(HS_COURSE_ENDPOINT(courseID))
    dispatch(addCourse(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Create a single course: @param newCourse
 */
export const createHSCourse = (newCourse: Partial<StudentHighSchoolCourse>) => async (dispatch: ReduxDispatch) => {
  try {
    const { data } = await API.post(HS_COURSE_ENDPOINT(), newCourse)
    dispatch(addCourse(data))
    if (newCourse.student) await dispatch(fetchStudent(newCourse.student, Platform.CAP))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a course, identified by @param courseID with @param editCourse
 */
export const updateHSCourse = (courseID: number, editCourse: Partial<StudentHighSchoolCourse>) => async (
  dispatch: ReduxDispatch,
) => {
  try {
    const { data } = await API.patch(HS_COURSE_ENDPOINT(courseID), editCourse)
    dispatch(addCourse(data))
    if (editCourse.student) await dispatch(fetchStudent(editCourse.student, Platform.CAP))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Delete a course, identified by @param pk
 */
export const deleteHSCourse = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data } = await API.delete(HS_COURSE_ENDPOINT(pk))
    dispatch(removeCourse({ pk }))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/** Fetch all pro zoom URLs and stick 'em in the store */
export const fetchZoomURLs = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: string[] } = await API.get(ZOOM_URLS_ENDPOINT)
    dispatch(setProZoomURLs(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}
