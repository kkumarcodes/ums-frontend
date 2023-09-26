// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { MailFilled } from '@ant-design/icons'
import { Button, Empty, Skeleton } from 'antd'
import BulletinSummary from 'components/bulletin/BulletinSummary'
import WisernetSection, { WisernetSectionContrast } from 'components/common/UI/WisernetSection'
import WisernetCalendar from 'components/common/WisernetCalendar'
import CondensedRoadmap from 'components/counseling/StudentRoadmap/CondensedRoadmap'
import usePlatformLoad from 'hooks/usePlatformLoad'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { fetchAgendaItems, fetchCounselorMeetings, fetchCounselorNotes } from 'store/counseling/counselingThunks'
import { selectActiveNotificationRecipient } from 'store/notification/notificationsSelector'
import { fetchNotificationRecipient } from 'store/notification/notificationsThunks'
import { useReduxDispatch } from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { selectCWUserID, selectParent } from 'store/user/usersSelector'
import ParentCounselorMeetingNotes from './ParentCounselorMeetingNotes'
import styles from './styles/ParentCounselingHome.scss'

const ParentCounselingHome = () => {
  const dispatch = useReduxDispatch()
  const activeStudent = useActiveStudent() // uses state's selectedSTudent

  const parentID = useSelector(selectCWUserID)
  const parent = useSelector(selectParent(parentID))
  const counselorMeetings = useSelector(selectCounselorMeetingsForStudent(activeStudent?.pk))
  const unreadConversations = useSelector(selectActiveNotificationRecipient)?.unread_conversations
  const platformLoad = usePlatformLoad()

  // Load! That! Data!
  const studentID = activeStudent?.pk
  const studentUserID = activeStudent?.user_id
  const notiRecipientID = parent?.notification_recipient
  useEffect(() => {
    // We always fetch parent's NotificationRecipient so we have proper unread conversation count
    if (notiRecipientID) dispatch(fetchNotificationRecipient(notiRecipientID))
    if (studentID) {
      dispatch(fetchCounselorMeetings({ student: studentID }))
      dispatch(fetchTasks({ user: studentUserID }))
      dispatch(fetchAgendaItems())
      dispatch(fetchCounselorNotes({ student: studentID }))
      platformLoad() // We have to call this here since parentApp is a class component and doesn't support the hook
    }
  }, [dispatch, notiRecipientID, studentID, studentUserID]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`${styles.parentCounselingHome} flex app-white-container responsive`}>
      <div className="container-left">
        <WisernetSection title="Roadmap" contrast={WisernetSectionContrast.High}>
          {!activeStudent && <Skeleton />}
          {activeStudent && <CondensedRoadmap studentID={activeStudent?.pk} />}
        </WisernetSection>
        <WisernetSection title="Counselor Notes" contrast={WisernetSectionContrast.Low}>
          <ParentCounselorMeetingNotes />
        </WisernetSection>
        <WisernetSection title="Messages" contrast={WisernetSectionContrast.Low}>
          <div className="messages">
            <MailFilled />
            &nbsp;
            {unreadConversations}&nbsp;unread conversation{unreadConversations !== 1 ? 's' : ''}
            <Button size="small" href="#/messages/">
              Open Messaging
            </Button>
          </div>
        </WisernetSection>
      </div>
      <div className="container-right">
        <WisernetSection title="Announcements" noPadding>
          {parentID && <BulletinSummary parentID={parentID} />}
        </WisernetSection>
        <WisernetSection title="Calendar" className="wisernet-calendar-container">
          <WisernetCalendar condensed counselorMeetings={counselorMeetings} />
        </WisernetSection>
      </div>
    </div>
  )
}
export default ParentCounselingHome
