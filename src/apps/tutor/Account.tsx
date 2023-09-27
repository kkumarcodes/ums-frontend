// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarOutlined, MessageOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import PlanningPreference from 'apps/PlanningPreference'
import { NotificationList } from 'components/common'
import CalendarSettings from 'components/common/CalendarSettings'
import UpdateContactInfo from 'components/common/UpdateContactInfo'
import UpdateProfilePicture from 'components/common/UpdateProfilePicture'
import React from 'react'
import { useSelector } from 'react-redux'
import { TutorNotifications } from 'store/notification/notificationsTypes'
import { selectActiveUser, selectTutor } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'

type Props = {
  tutorID: number
}
const TutorAccount = ({ tutorID }: Props) => {
  const tutor = useSelector(selectTutor(tutorID))
  const accountTab = (
    <span>
      <SettingOutlined />
      Account Info
    </span>
  )
  const notificationsTab = (
    <span>
      <MessageOutlined />
      Notifications
    </span>
  )
  const calendarTab = (
    <span>
      <CalendarOutlined />
      Calendar (Outlook) &amp; Scheduling
    </span>
  )
  const profileTab = (
    <span>
      <UserOutlined />
      Profile
    </span>
  )

  return (
    <Tabs defaultActiveKey="account">
      <Tabs.TabPane tab={accountTab} key="account">
        <h1>Account Details</h1>
        <h2>User Details</h2>
        <UpdateContactInfo />
      </Tabs.TabPane>
      <Tabs.TabPane tab={profileTab} key="profile">
        <h1>Profile</h1>
        {tutor && <UpdateProfilePicture userType={UserType.Tutor} cwUserID={tutor.pk} />}
      </Tabs.TabPane>
      <Tabs.TabPane tab={notificationsTab} key="notifications">
        <h1>Notifications</h1>
        {tutor && (
          <NotificationList
            notificationRecipientID={tutor.notification_recipient}
            userType={UserType.Tutor}
            notifications={TutorNotifications}
          />
        )}
      </Tabs.TabPane>
      <Tabs.TabPane tab={calendarTab} key="calendar">
        <h1>Calendar Settings</h1>
        <CalendarSettings />
        <PlanningPreference />
      </Tabs.TabPane>
    </Tabs>
  )
}

export default TutorAccount
