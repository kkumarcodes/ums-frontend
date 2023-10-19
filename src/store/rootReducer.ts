// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { combineReducers } from '@reduxjs/toolkit'
import counselingReducer from './counseling/counselingSlice'
import diagnosticReducer from './diagnostic/diagnosticSlice'
import displayReducer from './display/displaySlice'
import messageReducer from './message/messageSlice'
import notificationReducer from './notification/notificationsSlice'
import resourceReducer from './resource/resourcesSlice'
import taskReducer from './task/tasksSlice'
import tutoringReducer from './tutoring/tutoringSlice'
import userReducer from './user/usersSlice'
import universityReducer from './university/universitySlice'
import availabilityReducer from './availability/availabilitySlice'

const rootReducer = combineReducers({
  task: taskReducer,
  resource: resourceReducer,
  user: userReducer,
  display: displayReducer,
  tutoring: tutoringReducer,
  message: messageReducer,
  diagnostic: diagnosticReducer,
  notification: notificationReducer,
  university: universityReducer,
  counseling: counselingReducer,
  availability: availabilityReducer,
})

export type RootState = ReturnType<typeof rootReducer>
export default rootReducer
