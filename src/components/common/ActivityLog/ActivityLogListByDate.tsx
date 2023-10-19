// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { UserLogItem } from 'components/common/ActivityLog/UserLogItem'
import React from 'react'
import styles from 'components/common/styles/ActivityLog.scss'
import { SystemLogItem } from 'components/common/ActivityLog/SystemLogItem'
import { Notification } from 'store/notification/notificationsTypes'

type Props = {
  systemLogs?: boolean
  currentDate: string // datetime
  batch: Notification[]
}
export const ActivityLogListByDate = ({ systemLogs = false, currentDate, batch }: Props) => {
  return (
    <div className={styles.ActivityLogListByDate}>
      <h3 className="list-header f-subtitle-2">{currentDate}</h3>
      <div className="list-body">
        {batch.map(activityLog =>
          systemLogs ? (
            <SystemLogItem key={activityLog.slug} activityLog={activityLog} />
          ) : (
            <UserLogItem key={activityLog.slug} activityLog={activityLog} />
          ),
        )}
      </div>
    </div>
  )
}
