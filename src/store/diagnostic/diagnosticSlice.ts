// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _ from 'lodash'
import { Diagnostic, DiagnosticResult, DiagnosticState, TestResult, DiagnosticRegistration } from './diagnosticTypes'

const initialState: DiagnosticState = {
  diagnostics: {},
  diagnosticResults: {},
  testResults: {},
  diagnosticRegistrations: {},
}

const slice = createSlice({
  name: 'diagnostic',
  initialState,
  reducers: {
    addDiagnostic(state, action: PayloadAction<Diagnostic>) {
      state.diagnostics[action.payload.pk] = action.payload
    },
    addDiagnostics(state, action: PayloadAction<Array<Diagnostic>>) {
      state.diagnostics = { ...state.diagnostics, ..._.zipObject(_.map(action.payload, 'pk'), action.payload) }
    },
    addDiagnosticResult(state, action: PayloadAction<DiagnosticResult>) {
      state.diagnosticResults[action.payload.pk] = action.payload
    },
    addDiagnosticResults(state, action: PayloadAction<DiagnosticResult[]>) {
      state.diagnosticResults = {
        ...state.diagnosticResults,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTestResult(state, action: PayloadAction<TestResult>) {
      state.testResults[action.payload.pk] = action.payload
    },
    addTestResults(state, action: PayloadAction<Array<TestResult>>) {
      state.testResults = {
        ...state.testResults,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeTestResult(state, action: PayloadAction<{ pk: number }>) {
      delete state.testResults[action.payload.pk]
    },
    addDiagnosticRegistration(state, action: PayloadAction<DiagnosticRegistration>) {
      state.diagnosticRegistrations[action.payload.pk] = action.payload
    },
    addDiagnosticRegistrations(state, action: PayloadAction<DiagnosticRegistration[]>) {
      state.diagnosticRegistrations = {
        ...state.diagnosticRegistrations,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
  },
})

export const {
  addDiagnostic,
  addDiagnostics,
  addDiagnosticResult,
  addDiagnosticResults,
  addTestResult,
  addTestResults,
  removeTestResult,
  addDiagnosticRegistration,
  addDiagnosticRegistrations,
} = slice.actions
export default slice.reducer
