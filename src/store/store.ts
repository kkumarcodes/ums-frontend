// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Action, configureStore, getDefaultMiddleware, PayloadAction } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { ThunkAction, ThunkDispatch } from 'redux-thunk'
import rootReducer, { RootState } from './rootReducer'

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware({
    immutableCheck: false,
  }),
})
export type AppThunk = ThunkAction<Promise<PayloadAction<any>>, RootState, null, Action<string>>

export type ReduxDispatch = ThunkDispatch<RootState, any, Action>
export function useReduxDispatch(): ReduxDispatch {
  return useDispatch<ReduxDispatch>()
}

export default store
