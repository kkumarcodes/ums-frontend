import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { map, zipObject } from 'lodash'
import { Bulletin, NotificationState } from './notificationsTypes'

const initialState: NotificationState = {
  notificationRecipients: {},
  bulletins: {},
}

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotificationRecipient(state, action) {
      state.notificationRecipients[action.payload.pk] = action.payload
    },
    addBulletins(state, action: PayloadAction<Bulletin[]>) {
      state.bulletins = { ...state.bulletins, ...zipObject(map(action.payload, 'pk'), action.payload) }
    },
    addBulletin(state, action: PayloadAction<Bulletin>) {
      state.bulletins[action.payload.pk] = action.payload
    },
    removeBulletin(state, action: PayloadAction<{ pk: number }>) {
      delete state.bulletins[action.payload.pk]
    },
  },
})

export const { addNotificationRecipient, addBulletin, addBulletins, removeBulletin } = notificationsSlice.actions

export default notificationsSlice.reducer
