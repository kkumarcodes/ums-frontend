// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { RootState } from 'store/rootReducer'
import { values } from 'lodash'

export const getTestResults = (state: RootState) => state.diagnostic.testResults
export const getDiagnostics = (state: RootState) => state.diagnostic.diagnostics
export const getDiagnosticResults = (state: RootState) => state.diagnostic.diagnosticResults

export const selectTestResults = createSelector(getTestResults, testResults => values(testResults))
export const selectDiagnostics = createSelector(getDiagnostics, diagnostics => values(diagnostics))
export const selectDiagnosticResults = createSelector(getDiagnosticResults, values)

export const selectDiagnosticResult = (pk?: number) =>
  createSelector(getDiagnosticResults, d => (pk ? d[pk] : undefined))
