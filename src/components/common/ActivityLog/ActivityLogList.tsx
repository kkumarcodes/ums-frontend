// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Empty, Spin } from 'antd'
import { ActivityLogListByDate } from 'components/common/ActivityLog'
import styles from 'components/common/styles/ActivityLog.scss'
import { groupBy, keys, orderBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import API from 'store/api'
import { Notification } from 'store/notification/notificationsTypes'

const ACTIVITY_LOG_ENDPOINT = (pk: number) =>
  pk ? `/notification/activity-log/${pk}/` : ' /notification/activity-log/'

type Props = {
  userPK: number
  systemLogs?: boolean
}

export const ActivityLogList = ({ userPK, systemLogs = false }: Props) => {
  const activityLogContainerRef = useRef(null)
  const allActivityLogs = useRef<Notification[]>([])
  const [visibleActivityLogs, setVisibleActivityLog] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    API.get(ACTIVITY_LOG_ENDPOINT(userPK))
      .then(res => {
        // most recent logs on top
        allActivityLogs.current = orderBy(res.data, 'created', 'desc')
      })
      .finally(() => setLoading(false))
  }, [userPK])

  const handleLoadMore = (page: number) => {
    const currentIndex = page - 1
    const LOGS_PER_STEP = 5
    setVisibleActivityLog(prev =>
      prev.concat(
        allActivityLogs.current.slice(currentIndex * LOGS_PER_STEP, currentIndex * LOGS_PER_STEP + LOGS_PER_STEP),
      ),
    )
  }

  // Creates object where keys are LL formatted dates with activity logs, and values are arrays of activity logs for the date
  const groupedLogItems = groupBy(visibleActivityLogs, log => moment(log.created).format('LL'))

  // Now we need to get a sorted list of dates that have activity log items
  const activityDates = keys(groupedLogItems)

  return (
    <div className={styles.ActivityLogList}>
      <div className={systemLogs ? 'system-log-list' : 'user-log-list'}>
        <InfiniteScroll
          pageStart={0}
          loadMore={handleLoadMore}
          hasMore={visibleActivityLogs.length !== allActivityLogs.current.length}
          threshold={100}
          getScrollParent={() => activityLogContainerRef.current}
          useWindow={false}
        >
          {/* Success Case */}
          {!!visibleActivityLogs.length &&
            activityDates.map(currentDate => (
              <ActivityLogListByDate
                key={currentDate}
                systemLogs={systemLogs}
                currentDate={currentDate}
                batch={groupedLogItems[currentDate]}
              />
            ))}
          {/* Empty Case */}
          {!visibleActivityLogs.length && !loading && <Empty />}
          {/* Loading Case */}
          {loading && (
            <div className="loading-container">
              <Spin delay={500} spinning tip="Loading..." />
            </div>
          )}
        </InfiniteScroll>
      </div>
    </div>
  )
}
