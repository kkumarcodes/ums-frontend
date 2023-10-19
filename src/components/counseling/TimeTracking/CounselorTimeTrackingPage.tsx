// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'
import { Tabs } from 'antd'
import { UserType } from 'store/user/usersTypes'
import { ClockCircleOutlined, IdcardOutlined } from '@ant-design/icons'
import CounselingTimePage from './CounselingTimePage'
import CounselorTimeCardPage from './CounselorTimeCardPage'

type Props = {
  counselorID: number
}

const CounselorTimeTrackingPage = ({ counselorID }: Props) => {
  return (
    <div>
      <Tabs defaultActiveKey="time-entries">
        <Tabs.TabPane
          tab={
            <span>
              <ClockCircleOutlined /> Time Log
            </span>
          }
          key="time-entries"
        >
          <CounselingTimePage counselorID={counselorID} userType={UserType.Counselor} />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <span>
              <IdcardOutlined />
              Time Cards
            </span>
          }
          key="time-cards"
        >
          <CounselorTimeCardPage counselorIDProp={counselorID} />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}
export default CounselorTimeTrackingPage
