// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarOutlined, ReadOutlined, UserOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import { UserTable } from 'components/administrator'
import styles from 'components/administrator/styles/ExpandedRow.scss'
import { AdminAppTutoringSessions } from 'components/administrator/tutors/AdminAppTutoringSessions'
import InvitationStatus from 'components/administrator/users/InvitationStatus'
import { AvailabilitySummary } from 'components/common/Availability/AvailabilitySummary'
import { TutoringSessionsContainer } from 'components/tutoring/TutoringSessions'
import { useShallowSelector } from 'libs'
import React from 'react'
import { RootState } from 'store/rootReducer'
import { UserType } from 'store/user/usersTypes'

const { TabPane } = Tabs

type Props = {
  tutorID: number
}

/**
 * Component renders a set of Tabs/TabPane components containing
 * further details for tutor with @param tutorID
 */
export const ExpandedTutorRow = ({ tutorID }: Props) => {
  const tutor = useShallowSelector((state: RootState) => state.user.tutors[tutorID])

  return (
    <div className="expandedRowWrapper">
      {!tutor?.account_is_created && <InvitationStatus userID={tutorID} userType={UserType.Tutor} />}
      {tutor?.account_is_created && (
        <Tabs defaultActiveKey="students" animated={false} className={styles.tabContainer}>
          <TabPane
            key="students"
            tab={
              <span>
                <UserOutlined />
                Students
              </span>
            }
          >
            <UserTable userType={UserType.Student} tutorID={tutorID} isExpanded={true} />
          </TabPane>
          <TabPane
            key="sessions"
            tab={
              <span>
                <ReadOutlined />
                Sessions
              </span>
            }
          >
            <TutoringSessionsContainer tutorID={tutorID}>
              <AdminAppTutoringSessions />
            </TutoringSessionsContainer>
          </TabPane>
          <TabPane
            key="availability"
            tab={
              <span>
                <CalendarOutlined />
                Availability
              </span>
            }
          >
            <AvailabilitySummary tutor={tutorID} />
          </TabPane>
        </Tabs>
      )}
    </div>
  )
}
