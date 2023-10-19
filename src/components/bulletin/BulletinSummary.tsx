// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ArrowDownOutlined, ArrowUpOutlined, NotificationFilled, PushpinFilled } from '@ant-design/icons'
import { Button, Skeleton, Tooltip } from 'antd'
import { isEmpty, orderBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectBulletinsForNotificationRecipient } from 'store/notification/notificationsSelector'
import { BulletinsFilter, fetchBulletins } from 'store/notification/notificationsThunks'
import { Bulletin } from 'store/notification/notificationsTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsAdmin, selectParent, selectStudent } from 'store/user/usersSelector'
import moment from 'moment'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import styles from './styles/BulletinSummary.scss'

type Props = {
  studentID?: number
  parentID?: number
}

const DEFAULT_TO_SHOW = 5

const BulletinSummary = ({ studentID, parentID }: Props) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const student = useSelector(selectStudent(studentID))
  const parent = useSelector(selectParent(parentID))
  const isAdmin = useSelector(selectIsAdmin)
  const [showAll, setShowAll] = useState(false)
  const notificationRecipientID = student?.notification_recipient || parent?.notification_recipient
  const bulletins = orderBy(
    useSelector(selectBulletinsForNotificationRecipient(notificationRecipientID)),
    ['pinned', 'created'],
    ['desc', 'desc'],
  )

  const hasBulletins = !isEmpty(bulletins)

  useEffect(() => {
    if (!hasBulletins) {
      setLoading(true)
      const filterData: BulletinsFilter = {}
      if (isAdmin && studentID) filterData.student = studentID
      if (parentID && isAdmin) filterData.parent = parentID
      dispatch(fetchBulletins(filterData)).then(() => setLoading(false))
    }
  }, [dispatch, hasBulletins, isAdmin, parentID, studentID])

  const showBulletin = (pk: number) => {
    dispatch(showModal({ modal: MODALS.VIEW_BULLETIN, props: { bulletinID: pk } }))
  }

  const renderBulletin = (bulletin: Bulletin) => {
    return (
      <div
        className="bulletin f-content flex"
        onClick={() => showBulletin(bulletin.pk)}
        onKeyPress={() => showBulletin(bulletin.pk)}
        role="button"
        tabIndex={0}
        key={bulletin.pk}
      >
        <div className="icon">
          {bulletin.pinned && (
            <Tooltip title="This announcement was pinned by your counselor">
              <PushpinFilled className="pin" />
            </Tooltip>
          )}
          <NotificationFilled />
        </div>
        <div className="content">
          <p>{bulletin.title}</p>
          <p className="date help">{moment(bulletin.created).format('MMM Do')} </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bulletinSummary}>
      {loading && <Skeleton loading={true} />}
      {!loading && (
        <div className="bulletins">
          {bulletins.slice(0, showAll ? bulletins.length : DEFAULT_TO_SHOW).map(renderBulletin)}
        </div>
      )}
      {!loading && bulletins.length > DEFAULT_TO_SHOW && (
        <div className="center show-more">
          <Button type="link" size="small" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            Show {showAll ? 'Fewer' : 'All'} Announcements
            {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          </Button>
        </div>
      )}
    </div>
  )
}
export default BulletinSummary
