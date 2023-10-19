// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Notification } from 'store/notification/notificationsTypes'
import styles from 'components/common/styles/ActivityLog.scss'
import React from 'react'
import moment from 'moment'
import { NotificationOutlined, PhoneOutlined, SendOutlined, StopOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import { selectIsAdmin } from 'store/user/usersSelector'

type Props = {
  activityLog: Notification
}

// The date on which we should start displaying email and text noti status
const NOTIFICATION_START_DATE = moment('2021-03-02')

export const UserLogItem = ({ activityLog }: Props) => {
  const { activity_log_title, activity_log_description, actor_name, created } = activityLog
  const isAdmin = useSelector(selectIsAdmin)
  return (
    <div className={styles.UserLogItem}>
      <div className="activity-item-top-panel">
        {isAdmin && (
          <div className="created-container">
            <span className="created-by-header">Creator:</span>
            <span className="created-by-name">{actor_name || 'Unknown'}</span>
          </div>
        )}
      </div>
      <div className="activity-item-bottom-panel">
        {activity_log_title && (
          <>
            <div className="icon-wrapper">
              <NotificationOutlined />
            </div>
            {created && <div className="time">{moment(created).format('h:mm a')}</div>}
            <div className="activity-details">
              <div className="title">{activity_log_title}</div>
              {activity_log_description && <div className="description">{activity_log_description}</div>}
            </div>
          </>
        )}
      </div>
      {moment(activityLog.created).isAfter(NOTIFICATION_START_DATE) && (
        <div className="sent-details help flex">
          <div className="emailed">
            {activityLog.emailed ? (
              <>
                <SendOutlined />
                &nbsp;Email Notification Sent
              </>
            ) : (
              <>
                <StopOutlined />
                &nbsp;No Email Notification Sent
              </>
            )}
          </div>
          <div className="texted">
            {activityLog.texted ? (
              <>
                <PhoneOutlined />
                &nbsp;Text Notification Sent
              </>
            ) : (
              <>
                <StopOutlined />
                &nbsp;No Text Notification Sent
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
