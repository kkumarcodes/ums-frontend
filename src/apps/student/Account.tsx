// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ClockCircleOutlined,
  DollarCircleOutlined,
  EditOutlined,
  MessageOutlined,
  SettingOutlined,
  SnippetsOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Skeleton, Tabs } from 'antd'
import { NotificationList } from 'components/common'
import { StudentHighSchoolCourseTabbedTable } from 'components/common/StudentHighSchoolCourse/StudentHighSchoolCourseTabbedTable'
import WisernetSection, { WisernetSectionContrast } from 'components/common/UI/WisernetSection'
import UpdateContactInfo from 'components/common/UpdateContactInfo'
import UpdatePhone from 'components/common/UpdatePhone'
import UpdateProfilePicture from 'components/common/UpdateProfilePicture'
import CounselingTimePage from 'components/counseling/TimeTracking/CounselingTimePage'
import SMSSettingsManager from 'components/messages/SMSManager'
import ConfirmPhone from 'components/student/ConfirmPhone'
import { TestResultPage } from 'components/student/TestResultPage'
import ViewDiagnostics from 'components/student/ViewDiagnostics'
import ViewTutoringPurchases from 'components/student/ViewTutoringPurchases'
import ViewTutoringSessions from 'components/student/ViewTutoringSessions'
import React from 'react'
import { useSelector } from 'react-redux'
import { StudentNotifications } from 'store/notification/notificationsTypes'
import { RootState } from 'store/rootReducer'
import { UserType } from 'store/user/usersTypes'

const { TabPane } = Tabs

const StudentAccount = () => {
  const { cwUserID, student } = useSelector((state: RootState) => {
    const cwUserID = state.user.activeUser?.cwUserID
    return {
      cwUserID,
      student: cwUserID && state.user.activeUser?.userType === UserType.Student ? state.user.students[cwUserID] : null,
    }
  })

  const notificationsTab = (
    <span>
      <MessageOutlined />
      Notifications
    </span>
  )
  const accountTab = (
    <span>
      <SettingOutlined />
      Account Info
    </span>
  )
  const tutoringTab = (
    <span>
      <ClockCircleOutlined />
      Tutoring Hours
    </span>
  )
  const tutoringPurchasesTab = (
    <span>
      <DollarCircleOutlined />
      Tutoring Spend
    </span>
  )
  const viewDiagnosticsTab = (
    <span>
      <EditOutlined />
      Diagnostics
    </span>
  )
  const courseworkTab = (
    <span>
      <SnippetsOutlined />
      Coursework
    </span>
  )

  const testResultTab = (
    <span>
      <SnippetsOutlined />
      Test Results
    </span>
  )
  const profileTab = (
    <span>
      <UserOutlined />
      Profile
    </span>
  )

  if (!student || !cwUserID) {
    return <Skeleton />
  }

  return (
    <Tabs defaultActiveKey="account">
      <TabPane tab={accountTab} key="account">
        <h1>Account Details</h1>
        <UpdateContactInfo />
      </TabPane>
      <TabPane tab={profileTab} key="profile">
        <h1>Profile</h1>
        {student && <UpdateProfilePicture cwUserID={student.pk} userType={UserType.Student} />}
      </TabPane>
      <TabPane tab={notificationsTab} key="notifications">
        <div className="notifications-container">
          <WisernetSection title="Phone Number" contrast={WisernetSectionContrast.Low}>
            <UpdatePhone notificationRecipientID={student?.notification_recipient} />
            <ConfirmPhone notificationRecipientID={student?.notification_recipient} />
          </WisernetSection>
          <br />
          <br />
          <br />
          <SMSSettingsManager />
          <br />
          <br />
          <br />
          <WisernetSection title="Notification Settings" contrast={WisernetSectionContrast.Low}>
            <NotificationList
              notificationRecipientID={student.notification_recipient}
              userType={UserType.Student}
              notifications={StudentNotifications}
            />
          </WisernetSection>
        </div>
      </TabPane>
      <TabPane tab={tutoringTab} key="hours">
        <ViewTutoringSessions />
      </TabPane>
      <TabPane
        tab={
          <span>
            <ClockCircleOutlined />
            Counseling Hours
          </span>
        }
        key="cap-hours"
      >
        <CounselingTimePage studentID={cwUserID} userType={UserType.Student} />
      </TabPane>
      <TabPane tab={tutoringPurchasesTab} key="spend">
        <ViewTutoringPurchases />
      </TabPane>
      <TabPane tab={viewDiagnosticsTab} key="diagnostics">
        <ViewDiagnostics studentID={cwUserID} />
      </TabPane>
      <TabPane tab={courseworkTab} key="courses">
        <StudentHighSchoolCourseTabbedTable studentID={student.pk} />
      </TabPane>
      <TabPane tab={testResultTab} key="testResults">
        <TestResultPage />
      </TabPane>
    </Tabs>
  )
}

export default StudentAccount
