// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckSquareFilled, UserOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import styles from 'components/administrator/styles/ExpandedRow.scss'
import InvitationStatus from 'components/administrator/users/InvitationStatus'
import ApplicationTrackerPage from 'components/applicationPlan/ApplicationTrackerPage'
import { useShallowSelector } from 'libs/useShallowSelector'
import React from 'react'
import { RootState } from 'store/rootReducer'
import { UserType } from 'store/user/usersTypes'
import StudentTable from '../students/StudentTable'

const { TabPane } = Tabs

type Props = {
  counselorID: number
}

/**
 * Component renders a set of Tabs/TabPane components containing
 * further details for counselor with @param counselorID
 */
export const ExpandedCounselorRow = ({ counselorID }: Props) => {
  const counselor = useShallowSelector((state: RootState) => state.user.counselors[counselorID])

  return (
    <div className="expandedRowWrapper">
      {!counselor?.account_is_created && <InvitationStatus userID={counselorID} userType={UserType.Counselor} />}
      {counselor?.account_is_created && (
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
            <StudentTable counselorID={counselorID} />
          </TabPane>
          <TabPane
            key="tracker"
            tab={
              <span>
                <CheckSquareFilled />
                Tracker
              </span>
            }
          >
            <ApplicationTrackerPage counselorID={counselorID} />
          </TabPane>
        </Tabs>
      )}
    </div>
  )
}
