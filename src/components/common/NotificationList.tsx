// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Checkbox, Switch } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import styles from 'components/common/styles/NotificationList.scss'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectNotificationRecipient } from 'store/notification/notificationsSelector'
import { fetchNotificationRecipient, updateNotificationRecipient } from 'store/notification/notificationsThunks'
import { useReduxDispatch } from 'store/store'
import { selectCWUserID, selectIsCounselor, selectIsTutor } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'

type Props = {
  userType: UserType
  notifications: any
  notificationRecipientID: number
}

/**
 * Component allows a user to subscribe/unsubscribe from a set of @param notifications (email/text)
 * @param usersType plural userType (used to access proper state.user slice)
 * @param notifications enum of unsubscriable_notifications for given usersType
 */
export const NotificationList = ({ userType, notifications, notificationRecipientID }: Props) => {
  const dispatch = useReduxDispatch()

  const cwUserID = useSelector(selectCWUserID)
  const isTutor = useSelector(selectIsTutor)
  const isCounselor = useSelector(selectIsCounselor)

  const notificationRecipient = useSelector(selectNotificationRecipient(notificationRecipientID))
  useEffect(() => {
    if (notificationRecipientID) {
      dispatch(fetchNotificationRecipient(notificationRecipientID))
    }
  }, [dispatch, notificationRecipientID])

  const unsubscribable_notifications = notificationRecipient?.unsubscribable_notifications
  const email_notifications = notificationRecipient?.unsubscribed_email_notifications
  const text_notifications = notificationRecipient?.unsubscribed_text_notifications

  const handleEmailChange = (e: CheckboxChangeEvent, notificationType: string) => {
    let payload = [...(email_notifications as string[])]
    if (!e.target.checked) {
      payload.push(notificationType)
    } else {
      payload = payload.filter(nt => nt !== notificationType)
    }
    dispatch(
      updateNotificationRecipient(notificationRecipientID as number, { unsubscribed_email_notifications: payload }),
    )
  }

  const handleTextChange = (e: CheckboxChangeEvent, notificationType: string) => {
    let payload = [...(text_notifications as string[])]
    if (!e.target.checked) {
      payload.push(notificationType)
    } else {
      payload = payload.filter(nt => nt !== notificationType)
    }
    dispatch(
      updateNotificationRecipient(notificationRecipientID as number, { unsubscribed_text_notifications: payload }),
    )
  }

  const toggleReceiveEmails = () => {
    dispatch(
      updateNotificationRecipient(notificationRecipientID, { receive_emails: !notificationRecipient?.receive_emails }),
    )
  }
  const toggleReceiveTexts = () => {
    dispatch(
      updateNotificationRecipient(notificationRecipientID, { receive_texts: !notificationRecipient?.receive_texts }),
    )
  }

  return (
    <section className={styles.notificationListContainer}>
      <div className="killswitch-container">
        <Switch checked={notificationRecipient?.receive_emails} onChange={toggleReceiveEmails} />
        Receive emails from UMS
        {userType === UserType.Student && (
          <>
            <Switch checked={notificationRecipient?.receive_texts} onChange={toggleReceiveTexts} />
            Receive texts from UMS
          </>
        )}
      </div>
      {notifications && (
        <ul className="notification-list">
          <li key="headers" className="list-header-row">
            <div className="header-type">Notification</div>
            <div className="header-item">Email</div>
            {!(isTutor || isCounselor) && <div className="header-item">Text</div>}
          </li>
          {unsubscribable_notifications?.map((un: any) => (
            <li key={un} className="list-item-row">
              <div className="notification-type">{notifications[un]}</div>
              <div className="notification-checkbox">
                <Checkbox
                  checked={!email_notifications?.includes(un)}
                  onChange={(e: CheckboxChangeEvent) => handleEmailChange(e, un)}
                />
              </div>
              {!(isTutor || isCounselor) && (
                <div className="notification-checkbox">
                  <Checkbox
                    checked={!text_notifications?.includes(un)}
                    onChange={(e: CheckboxChangeEvent) => handleTextChange(e, un)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
