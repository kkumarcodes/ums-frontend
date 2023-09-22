// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { assign, map, zipObject } from 'lodash'
import {
  Administrator,
  Counselor,
  Parent,
  SetCurrentUserPayload,
  Student,
  StudentHighSchoolCourse,
  Tutor,
  UsersState,
} from './usersTypes'

const initialState: UsersState = {
  students: {},
  counselors: {},
  tutors: {},
  parents: {},
  administrators: {},
  courses: {},
  activeUser: null,
  selectedStudent: null,
  proZoomURLs: [],
  // Recent students for counselor platform
  recentStudents: [],
}

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setActiveUser(state, action: PayloadAction<SetCurrentUserPayload>) {
      state.activeUser = action.payload
    },
    setSelectedStudent(state, action: PayloadAction<Student>) {
      state.selectedStudent = action.payload
    },
    addStudent(state, action: PayloadAction<Student>) {
      // We overwrite existing student with new data
      if (state.students[action.payload.pk]) {
        const existingStudent = state.students[action.payload.pk]
        // We don't overwrite counseling file uploads with an empty list in case we're going from having counseling
        // data for a student to adding their tutoring data (which excludes file uploads)
        let fileUploads = action.payload.counseling_file_uploads
        if (!fileUploads?.length && existingStudent) fileUploads = existingStudent.counseling_file_uploads

        // We merge properties on action.payload into existingStudent so that we don't
        // remove properties that already exist on student when switching between counseling/tutoring payloads
        assign(existingStudent, action.payload)
        state.students[action.payload.pk] = {
          ...existingStudent,
          counseling_file_uploads: fileUploads,
        }
      } else {
        state.students[action.payload.pk] = action.payload
      }
    },
    addStudents(state, action: PayloadAction<Array<Student>>) {
      state.students = { ...state.students, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addTutor(state, action: PayloadAction<Tutor>) {
      state.tutors[action.payload.pk] = action.payload
    },
    addTutors(state, action: PayloadAction<Array<Tutor>>) {
      state.tutors = { ...state.tutors, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addCounselor(state, action: PayloadAction<Counselor>) {
      state.counselors[action.payload.pk] = action.payload
    },
    addCounselors(state, action: PayloadAction<Array<Counselor>>) {
      state.counselors = { ...state.counselors, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addAdministrators(state, action: PayloadAction<Administrator[]>) {
      state.administrators = { ...state.administrators, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addParent(state, action: PayloadAction<Parent>) {
      state.parents[action.payload.pk] = action.payload
    },
    addParents(state, action: PayloadAction<Array<Parent>>) {
      state.parents = { ...state.parents, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addCourse(state, action: PayloadAction<StudentHighSchoolCourse>) {
      state.courses[action.payload.pk] = action.payload
    },
    addCourses(state, action: PayloadAction<Array<StudentHighSchoolCourse>>) {
      state.courses = { ...state.courses, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    removeCourse(state, action: PayloadAction<{ pk: number }>) {
      delete state.courses[action.payload.pk]
    },
    setProZoomURLs(state, action: PayloadAction<string[]>) {
      state.proZoomURLs = action.payload
    },
    addRecentStudent(state, action: PayloadAction<number>) {
      if (state.recentStudents.length && state.recentStudents[0] === action.payload) {
        return
      }
      // Filter out existing instance of student so they don't appear twice in list
      state.recentStudents = state.recentStudents.filter(s => s !== action.payload)
      state.recentStudents.splice(0, 0, action.payload)
      if (state.recentStudents.length > 5) {
        state.recentStudents.splice(4, state.recentStudents.length - 5)
      }
    },
  },
})

export const {
  setActiveUser,
  setSelectedStudent,
  addStudent,
  addTutor,
  addCounselor,
  addParent,
  addCourse,
  addStudents,
  addTutors,
  addCounselors,
  addParents,
  addAdministrators,
  addCourses,
  removeCourse,
  setProZoomURLs,
  addRecentStudent,
} = usersSlice.actions
export default usersSlice.reducer
