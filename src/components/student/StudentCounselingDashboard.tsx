// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Button, Empty } from 'antd'
import { getFullName } from 'components/administrator'
import BulletinSummary from 'components/bulletin/BulletinSummary'
import WisernetSection, { WisernetSectionContrast } from 'components/common/UI/WisernetSection'
import { CounselorMeetingTable } from 'components/counseling/CounselorMeeting'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import ChatConversation from 'components/messages/ChatConversation'
import { StudentUniversityDecisionListView } from 'components/schools/StudentUniversityDecisionListView'
import usePlatformLoad from 'hooks/usePlatformLoad'
import useActiveStudent from 'libs/useActiveStudent'
import { isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ConversationType } from 'store/message/messageTypes'
import { useReduxDispatch } from 'store/store'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import styles from './styles/StudentCounselingDashboard.scss'

const StudentCounselingDashboard = () => {
  const student = useActiveStudent()
  const [fetchedSUDs, setFetchedSUDs] = useState(false)
  const [loadingSUDs, setLoadingSUDs] = useState(false)
  const dispatch = useReduxDispatch()
  const platformLoad = usePlatformLoad()

  // We may need to load student's University Choices
  const SUDs = useSelector(selectSUDsForStudent(student?.pk))
  const noSUDs = isEmpty(SUDs)
  const studentID = student?.pk
  useEffect(() => {
    if (noSUDs && studentID && !fetchedSUDs) {
      setLoadingSUDs(true)
      dispatch(fetchStudentUniversityDecisions({ student: studentID }))
        .then(() => {
          setFetchedSUDs(true)
        })
        .finally(() => setLoadingSUDs(false))
    }
  }, [dispatch, fetchedSUDs, noSUDs, studentID])

  useEffect(() => {
    platformLoad()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Empty state - shouldn't ever really happen. We prompt user to log in (perhaps again)
  if (!student) {
    return (
      <div className={`app-white-container ${styles.studentCounselingDashboard}`}>
        <Empty>
          Please <Button href="/users/login/">login</Button> to view this page
        </Empty>
      </div>
    )
  }

  return (
    <div className={`app-white-container flex ${styles.studentCounselingDashboard}`}>
      <div className="left-container">
        <WisernetSection title="Tasks" contrast={WisernetSectionContrast.Low}>
          <CounselingStudentParentTaskList showParentTasks={false} alwaysLoad={false} studentID={student.pk} />
        </WisernetSection>
        <WisernetSection title="Meetings" contrast={WisernetSectionContrast.Low}>
          <CounselorMeetingTable studentID={student.pk} showStudentName={false} showToolbar={false} />
        </WisernetSection>
        <WisernetSection title="Messages" contrast={WisernetSectionContrast.Low}>
          <ChatConversation
            conversation={{
              student: student.pk,
              conversationType: ConversationType.Counselor,
            }}
            authorName={getFullName(student)}
          />
        </WisernetSection>
      </div>
      <div className="right-container">
        <WisernetSection title="Announcements" contrast={WisernetSectionContrast.Low} noPadding>
          {studentID && <BulletinSummary studentID={studentID} />}
        </WisernetSection>
        <div className="school-list-container">
          <StudentUniversityDecisionListView student={student} SUDs={SUDs} loading={loadingSUDs} />
        </div>
      </div>
    </div>
  )
}
export default StudentCounselingDashboard
