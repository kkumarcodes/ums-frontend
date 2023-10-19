// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import moment from 'moment'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty } from 'lodash'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectCMForStudentWithTransformedSemesters } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { selectStudent } from 'store/user/usersSelector'

export const useRoadmap = (studentID?: number) => {
  const [loading, setLoading] = useState(false)
  const [showPast, setShowPast] = useState(true)
  const dispatch = useReduxDispatch()
  const activeStudent = useActiveStudent()
  const propStudent = useSelector(selectStudent(studentID))
  const student = activeStudent || propStudent

  let meetings = useSelector(selectCMForStudentWithTransformedSemesters(student?.pk)).filter(m => m.grade && m.semester)
  if (!showPast) meetings = meetings.filter(m => !m.start || moment(m.start).isAfter())

  const loadMeetings = isEmpty(meetings)
  const studentPK = student?.pk
  useEffect(() => {
    if (loadMeetings && studentPK) {
      setLoading(true)
      dispatch(fetchCounselorMeetings({ student: studentPK })).then(() => setLoading(false))
    }
  }, [dispatch, loadMeetings, studentPK])

  return { loading, showPast, setShowPast, meetings, dispatch }
}
