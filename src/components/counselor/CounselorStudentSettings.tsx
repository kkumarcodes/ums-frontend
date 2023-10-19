// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react'
import _ from 'lodash'

import useActiveStudent from 'libs/useActiveStudent'
import { StudentProfile } from 'components/common/StudentProfile'
import { Skeleton } from 'antd'
import styles from './styles/CounselorStudentSettings.scss'

const CounselorStudentSettings = () => {
  const activeStudent = useActiveStudent()

  if (!activeStudent) return <Skeleton />
  return (
    <div className={styles.CounselorStudentSettings}>
      <StudentProfile
        studentID={activeStudent.pk}
        showActivityLog={true}
        hideCoursework={true}
        hideTestResults={true}
        allowEdit={true}
      />
    </div>
  )
}
export default CounselorStudentSettings
