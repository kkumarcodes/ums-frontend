// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { map, zipObject } from 'lodash'
import { UniversityState, University, StudentUniversityDecision, Deadline } from './universityTypes'

const initialState: UniversityState = {
  universities: {},
  studentUniversityDecisions: {},
  deadlines: {},
  loadedAllUniversities: false,
}

const universitySlice = createSlice({
  name: 'university',
  initialState,
  reducers: {
    addUniversity(state, action: PayloadAction<University>) {
      state.universities[action.payload.pk] = action.payload
    },
    addUniversities(state, action: PayloadAction<University[]>) {
      state.loadedAllUniversities = true
      state.universities = { ...state.universities, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addStudentUniversityDecision(state, action: PayloadAction<StudentUniversityDecision>) {
      state.studentUniversityDecisions[action.payload.pk] = action.payload
    },
    addStudentUniversityDecisions(state, action: PayloadAction<StudentUniversityDecision[]>) {
      state.studentUniversityDecisions = {
        ...state.studentUniversityDecisions,
        ...zipObject(map(action.payload, 'pk'), action.payload),
      }
    },
    removeStudentUniversityDecision(state, action: PayloadAction<number>) {
      delete state.studentUniversityDecisions[action.payload]
    },
    addDeadline(state, action: PayloadAction<Deadline>) {
      state.deadlines[action.payload.pk] = action.payload
    },
    addDeadlines(state, action: PayloadAction<Deadline[]>) {
      state.deadlines = {
        ...state.deadlines,
        ...zipObject(map(action.payload, 'pk'), action.payload),
      }
    },
  },
})

export const {
  addUniversity,
  addUniversities,
  addStudentUniversityDecision,
  addStudentUniversityDecisions,
  removeStudentUniversityDecision,
  addDeadline,
  addDeadlines,
} = universitySlice.actions
export default universitySlice.reducer
