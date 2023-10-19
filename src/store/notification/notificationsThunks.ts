// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import API from 'store/api'
import errorHandler from 'store/errorHandler'
import {
  addBulletin,
  addBulletins,
  addNotificationRecipient,
  removeBulletin,
} from 'store/notification/notificationsSlice'
import { Bulletin, NotificationRecipient } from './notificationsTypes'

const NOTIFICATION_RECIPIENT_ENDPOINT = (pk: number) => `/notification/notification-recipients/${pk}/`
const VERIFICATION_ENDPOINT = (pk: number) =>
  pk ? `/notification/notification-recipients/${pk}/send-verification/` : '/notifications/'
const CONFIRMATION_ENDPOINT = (pk: number) =>
  pk ? `/notification/notification-recipients/${pk}/attempt-verify/` : '/notifications/'

const CREATE_NOTI_ENDPOINT = (notiType: string) => `/notification/create-notification/${notiType}/`
const BULLETIN_ENDPOINT = (pk?: number) => (pk ? `/notification/bulletins/${pk}/` : '/notification/bulletins/')
const BULLET_READ_ENDPOINT = (pk: number) => `${BULLETIN_ENDPOINT(pk)}read/`

/** BULLETINS! 🎯 */
export type BulletinsFilter = {
  student?: number
  parent?: number
  tutor?: number
  counselor?: number
}
export const fetchBulletins = (params: BulletinsFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Bulletin[] } = await API.get(BULLETIN_ENDPOINT(), { params })
    dispatch(addBulletins(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createBulletin = (createData: Partial<Bulletin>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Bulletin } = await API.post(BULLETIN_ENDPOINT(), createData)
    dispatch(addBulletin(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const updateBulletin = (updateData: Partial<Bulletin> & { pk: number }) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Bulletin } = await API.patch(BULLETIN_ENDPOINT(updateData.pk), updateData)
    dispatch(addBulletin(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const deleteBulletin = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(BULLETIN_ENDPOINT(pk))
    dispatch(removeBulletin({ pk }))
  } catch (err) {
    throw errorHandler(err)
  }
}

// Current user gets added to Bulletin's read_notification_recipients
export const readBulletin = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Bulletin } = await API.post(BULLET_READ_ENDPOINT(pk))
    dispatch(addBulletin(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 *  Method retrieves boolean indicating whether user has confirmed their phone number
 */
export const fetchNotificationRecipient = (recipientID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: NotificationRecipient } = await API.get(NOTIFICATION_RECIPIENT_ENDPOINT(recipientID))
    dispatch(addNotificationRecipient(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Update a notification recipient */
export const updateNotificationRecipient = (
  recipientID: number,
  update: Partial<NotificationRecipient>,
  // If True, then updating phone number WONT result in a verification SMS getting sent
  dontSendVerification = false,
) => async (dispatch: Dispatch) => {
  try {
    let url = NOTIFICATION_RECIPIENT_ENDPOINT(recipientID)
    if (dontSendVerification) {
      url += '?dont_send_verification=true'
    }
    const { data }: { data: NotificationRecipient } = await API.patch(url, update)
    dispatch(addNotificationRecipient(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * @param notification_id resends verification code to confirm user phone number
 */
export const resendVerification = (notification_id: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(VERIFICATION_ENDPOINT(notification_id))
    return response
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Sends post request to confirm user phone number.
 * @param notification_id
 * @param confCode
 */
export const confirmPhoneNumber = (notification_id: number, confCode: number) => async (dispatch: Dispatch) => {
  try {
    const response = await API.post(CONFIRMATION_ENDPOINT(notification_id), { code: confCode.toString() })
    dispatch(addNotificationRecipient(response.data))
    return response.data
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Interfaces with CreateNotificationView on the backend */
export enum CreateableNotification {
  DiagnosticInvite = 'diagnostic_invite',
}
export const createNotification = async (
  notificationRecipient: number,
  notificationType: CreateableNotification,
  ...additionalArgs
) => {
  try {
    const response = await API.post(CREATE_NOTI_ENDPOINT(notificationType), {
      recipient: notificationRecipient,
      ...additionalArgs,
    })
    return response.data
  } catch (err) {
    throw errorHandler(err)
  }
}
