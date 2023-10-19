// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { message } from 'antd'
import Loading from 'components/common/Loading'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import { CounselorMeetingTable } from './CounselorMeetingTable'
import styles from './styles/CounselorMeetingPage.scss'

type Props = {
  studentID?: number
}

const CounselorMeetingPage = ({ studentID }: Props) => {
  const activeStudent = useActiveStudent()
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const [loadedMeetings, setLoadedMeetings] = useState(false)
  studentID = studentID || activeStudent?.pk
  const meetingsExist = !isEmpty(useSelector(selectCounselorMeetingsForStudent(studentID)))

  useEffect(() => {
    if (!meetingsExist && !loadedMeetings && !loading) {
      setLoading(true)
      dispatch(fetchCounselorMeetings({ student: studentID }))
        .then(() => setLoadedMeetings(true))
        .catch(() => message.warn('Unable to fetch meetings'))
        .finally(() => setLoading(false))
    }
  }, [dispatch, loadedMeetings, loading, meetingsExist, studentID])
  return (
    <div className={`app-white-container ${styles.counselorMeetingPage}`}>
      {loading && (
        <div className="center">
          <Loading message="Loading meetings..." />
        </div>
      )}
      {!loading && <CounselorMeetingTable studentID={studentID} />}
    </div>
  )
}
export default CounselorMeetingPage
