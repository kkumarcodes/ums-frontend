// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  ClockCircleOutlined,
  DollarCircleOutlined,
  EditOutlined,
  MessageOutlined,
  SettingOutlined,
  SnippetsOutlined,
} from '@ant-design/icons'
import { Skeleton, Tabs } from 'antd'
import { StudentHighSchoolCourseTabbedTable } from 'components/common/StudentHighSchoolCourse/StudentHighSchoolCourseTabbedTable'
import UpdateContactInfo from 'components/common/UpdateContactInfo'
import CounselingTimePage from 'components/counseling/TimeTracking/CounselingTimePage'
import { TestResultPage } from 'components/student/TestResultPage'
import ViewDiagnostics from 'components/student/ViewDiagnostics'
import ViewTutoringPurchases from 'components/student/ViewTutoringPurchases'
import ViewTutoringSessions from 'components/student/ViewTutoringSessions'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import { UserType } from 'store/user/usersTypes'
import EditParentForm from 'components/administrator/parents/EditParentForm'
import ParentInfoTab from './ParentInfoTab'

const { TabPane } = Tabs

const StudentAccount = () => {
  const student = useActiveStudent()

  const smsTab = (
    <span>
      <MessageOutlined />
      SMS Settings
    </span>
  )
  const accountTab = (
    <span>
      <SettingOutlined />
      Student Account Info (for {student?.first_name})
    </span>
  )
  const parentInfoTab = (
    <span>
      <SettingOutlined />
      Parent Account Info
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
  // TODO: Change Icon; Make DRY
  const testResultTab = (
    <span>
      <SnippetsOutlined />
      Test Results
    </span>
  )

  if (!student) {
    return <Skeleton />
  }

  return (
    <Tabs defaultActiveKey="account">
      <TabPane tab={accountTab} key="account">
        <UpdateContactInfo />
      </TabPane>
      <TabPane tab={parentInfoTab} key="parent">
        <ParentInfoTab />
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
        <CounselingTimePage studentID={student.pk} userType={UserType.Student} />
      </TabPane>
      <TabPane tab={tutoringPurchasesTab} key="spend">
        <ViewTutoringPurchases />
      </TabPane>
      <TabPane tab={viewDiagnosticsTab} key="diagnostics">
        <ViewDiagnostics studentID={student.pk} />
      </TabPane>
      <TabPane tab={courseworkTab} key="courses">
        <StudentHighSchoolCourseTabbedTable studentID={student.pk} />
      </TabPane>
      <TabPane tab={testResultTab} key="testResults">
        <TestResultPage student={student.pk} />
      </TabPane>
    </Tabs>
  )
}

export default StudentAccount
