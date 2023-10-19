// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import Roadmap from '../Roadmap/Roadmap'
import styles from './styles/StudentRoadmapPage.scss'

type Props = {
  studentID?: number
}

const StudentRoadmapPage = ({ studentID }: Props) => {
  const activeStudent = useActiveStudent()
  studentID = studentID || activeStudent?.pk
  return (
    <div className={styles.studentRoadmapPage}>
      <Roadmap studentID={studentID} />
    </div>
  )
}
export default StudentRoadmapPage
