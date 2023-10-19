// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CounselingCalendar } from 'components/counseling/CounselingCalendar'
import React from 'react'
import { CounselorMeetingTable } from '../counseling/CounselorMeeting/CounselorMeetingTable'
import CounselorStudentList from './CounselorStudentList'
import styles from './styles/CounselorDashboard.scss'

const CounselorDashboard = () => {
  return (
    <div className={styles.counselorDashboard}>
      <CounselorMeetingTable onlyUpcoming />
      <br />
      <CounselorStudentList />
      <br />
      <CounselingCalendar />
    </div>
  )
}

export default CounselorDashboard
