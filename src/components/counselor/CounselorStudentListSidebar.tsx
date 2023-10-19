// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { getFullName } from 'components/administrator'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectCounselingStudents } from 'store/user/usersSelector'
import { Student } from 'store/user/usersTypes'
import styles from './styles/CounselorStudentListSidebar.scss'

const CounselorStudentListSidebar = () => {
  const students = useSelector(selectCounselingStudents)

  /** Renders an individual (clickable) student to display in our list */
  const renderStudent = (student: Student) => {
    return <div className="student">{getFullName(student)}</div>
  }

  return (
    <div className={styles.counselorStudentListSidebar}>
      <div className="search-container" />
      <div className="all-students-container" />
      <div className="student-list-container">{students.map(renderStudent)}</div>
    </div>
  )
}

export default CounselorStudentListSidebar
