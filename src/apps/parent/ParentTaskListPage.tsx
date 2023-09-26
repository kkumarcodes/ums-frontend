// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Empty } from 'antd'
import { getFullName } from 'components/administrator'
import WisernetSection from 'components/common/UI/WisernetSection'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import styles from './styles/ParentTaskListPage.scss'

const ParentTaskListPage = () => {
  const selectedStudent = useActiveStudent()

  if (!selectedStudent) {
    return <Empty description="Please select a student" />
  }

  return (
    <div className={`${styles.parentTaskListPage} app-white-container`}>
      <WisernetSection noPadding title="Your (parent) tasks">
        <CounselingStudentParentTaskList studentID={selectedStudent.pk} showParentTasks showStudentTasks={false} />
      </WisernetSection>
      <WisernetSection noPadding title={`${getFullName(selectedStudent)}'s Tasks`}>
        <CounselingStudentParentTaskList
          fetchTasks={false}
          studentID={selectedStudent.pk}
          showStudentTasks
          showParentTasks={false}
        />
      </WisernetSection>
    </div>
  )
}
export default ParentTaskListPage
