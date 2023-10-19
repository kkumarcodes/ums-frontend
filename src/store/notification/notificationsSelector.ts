import { createSelector } from '@reduxjs/toolkit'
import { find, values } from 'lodash'
import { RootState } from 'store/rootReducer'

// Retrieve NotificationRecipient for active user
const getNotificationRecipients = (state: RootState) => state.notification.notificationRecipients
const getBulletins = (state: RootState) => state.notification.bulletins
export const getActiveNotificationRecipient = (state: RootState) =>
  Object.values(state.notification.notificationRecipients).find(nr => nr.user === state.user.activeUser?.userID)
export const selectActiveNotificationRecipient = createSelector(getActiveNotificationRecipient, x => x)
export const selectNotificationRecipient = (pk?: number) =>
  createSelector(getNotificationRecipients, nr => (pk ? find(nr, { pk }) : undefined))

// Bulletins
export const selectBulletin = (pk?: number) =>
  createSelector(getBulletins, bulls => (pk ? find(values(bulls), { pk }) : undefined))
export const selectBulletins = createSelector(getBulletins, bulls => values(bulls))

export const selectBulletinsForNotificationRecipient = (pk?: number) =>
  createSelector(getBulletins, bulls =>
    pk ? values(bulls).filter(b => b.visible_to_notification_recipients.includes(pk)) : [],
  )
