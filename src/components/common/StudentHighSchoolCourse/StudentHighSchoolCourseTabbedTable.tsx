// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Skeleton, Tabs } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { selectCWUserID, selectIsStudent, selectStudent } from 'store/user/usersSelector'
import { fetchHSCourses } from 'store/user/usersThunks'
import { StudentHighSchoolCourseTable } from './StudentHighSchoolCourseTable'

type Props = {
  studentID: number
  coursePlanning?: boolean // Whether we are showing courses for course planning section
}

export const StudentHighSchoolCourseTabbedTable = ({ studentID, coursePlanning = false }: Props) => {
  const dispatch = useReduxDispatch()
  const student = useSelector(selectStudent(studentID))

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (studentID) {
      setLoading(true)
      dispatch(fetchHSCourses(studentID)).finally(() => setLoading(false))
    }
  }, [dispatch, studentID])

  const gradYear = student?.graduation_year || new Date().getFullYear() + 4

  if (loading) return <Skeleton loading />

  const getTabName = (gradeString: string) => (coursePlanning ? `${gradeString} - Planning` : gradeString)

  return (
    <div>
      <Tabs defaultActiveKey="9">
        <Tabs.TabPane tab={getTabName('9th Grade')} key="9">
          <StudentHighSchoolCourseTable
            coursePlanning={coursePlanning}
            studentID={studentID as number}
            year={gradYear - 4}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={getTabName('10th Grade')} key="10">
          <StudentHighSchoolCourseTable
            coursePlanning={coursePlanning}
            studentID={studentID as number}
            year={gradYear - 3}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={getTabName('11th Grade')} key="11">
          <StudentHighSchoolCourseTable
            coursePlanning={coursePlanning}
            studentID={studentID as number}
            year={gradYear - 2}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab={getTabName('12th Grade')} key="12">
          <StudentHighSchoolCourseTable
            coursePlanning={coursePlanning}
            studentID={studentID as number}
            year={gradYear - 1}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  )
}
