// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { ActivityLog } from 'components/common/ActivityLog'
import styles from 'components/common/styles/ActivityLog.scss'
import React from 'react'
import moment from 'moment'
import { NotificationOutlined } from '@ant-design/icons'

enum SystemNotification {
  ops_paygo_payment_success = 'Paygo Payment Success',
  ops_paygo_payment_failure = 'Paygo Payment Failure',
  ops_magento_webhook = 'Magento Webhook',
  ops_magento_webhook_failure = 'Magento Webhook Failure',
}

type Props = {
  activityLog: ActivityLog
}

export const SystemLogItem = ({ activityLog }: Props) => {
  const { activity_log_title, activity_log_description, notification_type, created } = activityLog
  return (
    <div className={styles.SystemLogItem}>
      <div className="activity-item-top-panel">
        <div className="notification-type-container">
          <span className="notification-type-header">Type:</span>
          <span className="notification-type-value">{SystemNotification[notification_type] || 'Unknown'}</span>
        </div>
        {created && <div className="time">{moment(created).format('h:mm a')}</div>}
      </div>
      <div className="activity-item-bottom-panel">
        {activity_log_title && (
          <>
            <div className="icon-wrapper">
              <NotificationOutlined />
            </div>
            <div className="activity-details">
              <div className="title">{activity_log_title}</div>
              {activity_log_description && <div className="description">{activity_log_description}</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
