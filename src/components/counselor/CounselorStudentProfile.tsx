// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusOutlined } from '@ant-design/icons'
import { Button, Skeleton, Tooltip } from 'antd'
import { getFullName } from 'components/administrator'
import WisernetSection, { WisernetSectionContrast } from 'components/common/UI/WisernetSection'
import { CounselorMeetingTable } from 'components/counseling/CounselorMeeting'
import CounselingAddTask from 'components/counseling/TaskList/CounselingAddTask'
import CounselingStudentParentTaskList from 'components/counseling/TaskList/CounselingStudentParentTaskList'
import ChatConversation from 'components/messages/ChatConversation'
import { StudentUniversityDecisionListView } from 'components/schools/StudentUniversityDecisionListView'
import {history} from 'App'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { ConversationType } from 'store/message/messageTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectStudentHasTasks } from 'store/task/tasksSelectors'
import { fetchTasks } from 'store/task/tasksThunks'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { fetchDeadlines, fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import CounselorStudentNote from './CounselorStudentNote'
import styles from './styles/CounselorStudentProfile.scss'

const CounselorStudentProfile = () => {
  const dispatch = useReduxDispatch()
  // Needed in order to make our note on student a controlled component
  const student = useActiveStudent()

  const activeCounselor = useSelector((state: RootState) =>
    state.user.activeUser ? state.user.counselors[state.user.activeUser.cwUserID] : null,
  )
  const studentID = student?.pk
  const counselorName = activeCounselor ? getFullName(activeCounselor) : ''
  const hasTasks = useSelector(selectStudentHasTasks(student?.pk))
  const SUDs = useSelector(selectSUDsForStudent(student?.pk))

  const [loading, setLoading] = useState(true)

  const studentPK = student?.pk
  const studentUserID = student?.user_id
  useEffect(() => {
    const promises: Array<Promise<any>> = []
    if (!hasTasks && studentUserID) {
      promises.push(dispatch(fetchTasks({ user: studentUserID })))
    }
    if (!SUDs.length && studentPK) {
      promises.push(dispatch(fetchStudentUniversityDecisions({ student: studentPK })))
      promises.push(dispatch(fetchDeadlines({ student: studentPK })))
    }
    if (promises.length) {
      setLoading(true)
      Promise.all(promises).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, studentPK, studentUserID])

  if (!student) {
    return <div className={styles.CounselorStudentProfile} />
  }

  const tasksHeader = (
    <div className="wisernet-toolbar">
      <div className="wisernet-toolbar-title f-title">Tasks</div>
      <div className="wisernet-toolbar-group">
        <Button
          className="btn-link passive-link"
          type="link"
          onClick={() => History.push(`/tasks/student/${student.pk}`)}
        >
          View Task List
        </Button>
        <div className="add-task-container">
          <CounselingAddTask studentID={student.pk} />
        </div>
      </div>
    </div>
  )

  const meetingsHeader = (
    <div className="wisernet-toolbar">
      <div className="wisernet-toolbar-title f-title">Meetings</div>
      <div className="wisernet-toolbar-group">
        <Tooltip title="Add new meeting">
          <Button
            className="add-button"
            shape="circle"
            type="primary"
            icon={<PlusOutlined />}
            onClick={_ => dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING, props: { studentID } }))}
          />
        </Tooltip>
      </div>
    </div>
  )

  return (
    <div className={styles.CounselorStudentProfile}>
      <div className="profile-container-top">
        <div className="profile-container-top-left">
          <WisernetSection title={tasksHeader} contrast={WisernetSectionContrast.Low}>
            <div className="tasks-container">
              {loading && <Skeleton active />}
              {!loading && <CounselingStudentParentTaskList condensed={true} studentID={student.pk} />}
            </div>
          </WisernetSection>
          <WisernetSection contrast={WisernetSectionContrast.Low} title={meetingsHeader}>
            <div className="meetings-container">
              <CounselorMeetingTable studentID={student.pk} showStudentName={false} showToolbar={false} />
            </div>
          </WisernetSection>
          <WisernetSection contrast={WisernetSectionContrast.Low} title="Messaging">
            {!student.account_is_created && (
              <p className="cener">
                {getFullName(student)} has not created their UMS account yet. Messaging will be enabled after their
                account is setup.
              </p>
            )}
            {student.account_is_created && (
              <div className="messaging-container">
                <ChatConversation
                  conversation={{
                    student: studentID,
                    conversationType: ConversationType.Counselor,
                  }}
                  authorName={counselorName}
                />
              </div>
            )}
          </WisernetSection>
          <WisernetSection contrast={WisernetSectionContrast.Low} title="Notes">
            <p>
              Use this section for your own notes on {getFullName(student)}. Add meeting notes on the&nbsp;
              <a href={`#/notes-and-files/student/${student.pk}/`}>Notes and Files</a> tab.
            </p>
            <CounselorStudentNote studentID={student.pk} />
          </WisernetSection>
        </div>
        <div className="profile-container-top-right">
          <StudentUniversityDecisionListView student={student} SUDs={SUDs} loading={loading} />
        </div>
      </div>
    </div>
  )
}
export default CounselorStudentProfile
