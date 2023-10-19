// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { GoogleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'
import WisernetCalendar from 'components/common/WisernetCalendar'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty, some } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { fetchTasks } from 'store/task/tasksThunks'
import { selectSTSForStudent } from 'store/tutoring/tutoringSelectors'
import { fetchGroupTutoringSessions, fetchStudentTutoringSessions } from 'store/tutoring/tutoringThunks'
import { selectIsStudentOrParent, selectStudent } from 'store/user/usersSelector'
import styles from './styles/StudentCalendar.scss'

type Props = {
  studentID?: number
}

const StudentCalendar = ({ studentID }: Props) => {
  const activeStudent = useActiveStudent()
  const propStudent = useSelector(selectStudent(studentID))
  const student = propStudent || activeStudent
  // Event Datums
  const tutoringSessions = useSelector(selectSTSForStudent(student?.pk)).filter(s => !s.cancelled)
  const counselorMeetings = useSelector(selectCounselorMeetingsForStudent(student?.pk))
  const tasks = useSelector(selectTasksForStudent(student?.pk))
  const isStudentOrParent = useSelector(selectIsStudentOrParent)

  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const showCalModal = () => {
    if (student) {
      dispatch(
        showModal({
          modal: MODALS.GOOGLE_CAL_INSTRUCTIONS,
          props: { link: student.calendar_url },
        }),
      )
    }
  }

  // We always reload data, but we only show loading state if we dont have any
  // of one of our data types
  const missingData = some([tutoringSessions, counselorMeetings, tasks], isEmpty)
  const userID = activeStudent?.user_id
  const studentPK = activeStudent?.pk
  useEffect(() => {
    if (userID && studentPK) setLoading(missingData)
    Promise.all([
      dispatch(fetchStudentTutoringSessions({ student: studentPK })),
      dispatch(fetchTasks({ user: userID })),
      dispatch(fetchCounselorMeetings({ student: studentPK })),
      dispatch(fetchGroupTutoringSessions({})),
    ]).finally(() => setLoading(false))
  }, [dispatch, missingData, studentPK, userID])

  return (
    <div className={styles.studentCalendar}>
      {loading && <Skeleton loading />}
      {!loading && (
        <>
          {isStudentOrParent && (
            <div className="wisernet-toolbar">
              <Button className="addToGoogle" type="default" onClick={showCalModal}>
                <GoogleOutlined />
                <PlusCircleOutlined />
                Add to Google/Outlook Calendar
              </Button>
            </div>
          )}
          <WisernetCalendar
            studentTutoringSessions={tutoringSessions}
            tasks={tasks}
            counselorMeetings={student?.has_access_to_cap ? counselorMeetings : []}
          />
        </>
      )}
    </div>
  )
}
export default StudentCalendar
