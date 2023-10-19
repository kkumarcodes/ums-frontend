// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import {
  Course,
  GroupTutoringSession,
  Location,
  StudentTutoringSession,
  TutoringPackage,
  TutoringPackagePurchase,
  TutoringService,
  TutoringSessionNote,
  TutoringState,
  TutorTimeCard,
  TutorTimeCardLineItem,
} from './tutoringTypes'

const initialState: TutoringState = {
  timeCards: {},
  studentTutoringSessions: {},
  groupTutoringSessions: {},
  tutoringSessionNotes: {},
  tutoringPackages: {},
  tutoringPackagePurchases: {},
  locations: {},
  courses: {},
  tutoringServices: {},
}

const tutoringSlice = createSlice({
  name: 'tutoring',
  initialState,
  reducers: {
    addLocation(state, action: PayloadAction<Location>) {
      state.locations[action.payload.pk] = action.payload
    },
    addLocations(state, action: PayloadAction<Array<Location>>) {
      state.locations = { ...state.locations, ..._.zipObject(_.map(action.payload, 'pk'), action.payload) }
    },
    addStudentTutoringSession(state, action: PayloadAction<StudentTutoringSession>) {
      state.studentTutoringSessions[action.payload.pk] = action.payload
    },
    addStudentTutoringSessions(state, action: PayloadAction<Array<StudentTutoringSession>>) {
      state.studentTutoringSessions = {
        ...state.studentTutoringSessions,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addGroupTutoringSession(state, action: PayloadAction<GroupTutoringSession>) {
      state.groupTutoringSessions[action.payload.pk] = action.payload
    },
    addGroupTutoringSessions(state, action: PayloadAction<Array<GroupTutoringSession>>) {
      state.groupTutoringSessions = {
        ...state.groupTutoringSessions,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTutoringSessionNote(state, action: PayloadAction<TutoringSessionNote>) {
      state.tutoringSessionNotes[action.payload.pk] = action.payload
      if (action.payload.group_tutoring_session) {
        state.groupTutoringSessions[action.payload.group_tutoring_session].tutoring_session_notes = action.payload.pk
      }
      if (action.payload.student_tutoring_sessions.length) {
        state.studentTutoringSessions[action.payload.student_tutoring_sessions[0]].tutoring_session_notes =
          action.payload.pk
      }
    },
    addTutoringSessionNotes(state, action: PayloadAction<Array<TutoringSessionNote>>) {
      state.tutoringSessionNotes = {
        ...state.tutoringSessionNotes,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTutoringPackage(state, action: PayloadAction<TutoringPackage>) {
      state.tutoringPackages[action.payload.pk] = action.payload
    },
    addTutoringPackages(state, action: PayloadAction<Array<TutoringPackage>>) {
      state.tutoringPackages = {
        ...state.tutoringPackages,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTutoringPackagePurchase(state, action: PayloadAction<TutoringPackagePurchase>) {
      state.tutoringPackagePurchases[action.payload.pk] = action.payload
    },
    addTutoringPackagePurchases(state, action: PayloadAction<Array<TutoringPackagePurchase>>) {
      state.tutoringPackagePurchases = {
        ...state.tutoringPackagePurchases,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTimeCard(state, action: PayloadAction<TutorTimeCard>) {
      state.timeCards[action.payload.pk] = action.payload
    },
    addTimeCards(state, action: PayloadAction<Array<TutorTimeCard>>) {
      state.timeCards = {
        ...state.timeCards,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeTimeCard(state, action: PayloadAction<{ pk: number }>) {
      delete state.timeCards[action.payload.pk]
    },
    addTimeCardLineItem(
      state,
      action: PayloadAction<{ data: Partial<TutorTimeCardLineItem> } & { timeCardID: number }>,
    ) {
      if (!action.payload.timeCardID) {
        state.timeCards[action.payload.data.pk as number] = action.payload.data
        return
      }
      state.timeCards[action.payload.timeCardID].line_items = [
        action.payload.data,
        ...state.timeCards[action.payload.timeCardID].line_items.filter(ele => ele.pk !== action.payload.data.pk),
      ]
    },
    removeTimeCardLineItem(state, action: PayloadAction<{ timeCardID: number; pk: number }>) {
      state.timeCards[action.payload.timeCardID].line_items = state.timeCards[
        action.payload.timeCardID
      ].line_items.filter(ele => ele.pk !== action.payload.pk)
    },
    addCourse(state, action: PayloadAction<Course>) {
      state.courses[action.payload.pk] = action.payload
    },
    addCourses(state, action: PayloadAction<Array<Course>>) {
      state.courses = {
        ...state.courses,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCourse(state, action: PayloadAction<{ pk: number }>) {
      delete state.courses[action.payload.pk]
    },
    removeStudentTutoringSession(state, action: PayloadAction<{ pk: number }>) {
      delete state.studentTutoringSessions[action.payload.pk]
    },
    addTutoringServices(state, action: PayloadAction<TutoringService[]>) {
      state.tutoringServices = {
        ...state.tutoringServices,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
  },
})

export const {
  addLocation,
  addLocations,
  addStudentTutoringSession,
  addStudentTutoringSessions,
  addGroupTutoringSession,
  addGroupTutoringSessions,
  addTutoringSessionNote,
  addTutoringSessionNotes,
  addTutoringPackage,
  addTutoringPackages,
  addTutoringPackagePurchase,
  addTutoringPackagePurchases,
  addTimeCard,
  addTimeCards,
  removeTimeCard,
  addTimeCardLineItem,
  removeTimeCardLineItem,
  addCourse,
  addCourses,
  removeCourse,
  removeStudentTutoringSession,
  addTutoringServices,
} = tutoringSlice.actions

export default tutoringSlice.reducer
