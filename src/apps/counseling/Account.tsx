// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarOutlined, MessageOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import PlanningPreference from 'apps/PlanningPreference'
import { NotificationList } from 'components/common'
import CalendarSettings from 'components/common/CalendarSettings'
import UpdatePhone from 'components/common/UpdatePhone'
import UpdateProfilePicture from 'components/common/UpdateProfilePicture'
import CounselorEmailSettings from 'components/counselor/CounselorEmailSettings'
import SMSSettingsManager from 'components/messages/SMSManager'
import ConfirmPhone from 'components/student/ConfirmPhone'
import React from 'react'
import { useSelector } from 'react-redux'
import { CounselorNotifications } from 'store/notification/notificationsTypes'
import { RootState } from 'store/rootReducer'
import { selectCounselor, selectCWUserID } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'

const CounselorAccount = () => {
  const counselorID = useSelector(selectCWUserID)
  const counselor = useSelector(selectCounselor(counselorID))
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
  const emailSettingsTab = (
    <span>
      <SendOutlined />
      Email and Messaging
    </span>
  )
  const profileTab = (
    <span>
      <UserOutlined />
      Profile
    </span>
  )

  return (
    <Tabs defaultActiveKey="profile">
      <Tabs.TabPane tab={profileTab} key="profile">
        <h1>Profile</h1>
        {counselorID && <UpdateProfilePicture cwUserID={counselorID} userType={UserType.Counselor} />}
      </Tabs.TabPane>
      <Tabs.TabPane tab={notificationsTab} key="notifications">
        <div>
          <div>
            <h1>Phone Number</h1>
            {counselor && <UpdatePhone notificationRecipientID={counselor.notification_recipient} />}
            <ConfirmPhone notificationRecipientID={counselor?.notification_recipient} />
            <br />
            <SMSSettingsManager />
            <br />
          </div>
          <h1>Notifications</h1>
          {counselor && (
            <NotificationList
              notificationRecipientID={counselor.notification_recipient}
              userType={UserType.Counselor}
              notifications={CounselorNotifications}
            />
          )}
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tab={calendarTab} key="calendar">
        <h1>Calendar Settings</h1>
        <CalendarSettings />
        <PlanningPreference />
      </Tabs.TabPane>
      <Tabs.TabPane tab={emailSettingsTab} key="email-settings">
        {counselorID && <CounselorEmailSettings counselorID={counselorID} />}
      </Tabs.TabPane>
    </Tabs>
  )
}

export default CounselorAccount
