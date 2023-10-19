// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, message, Modal, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import { StudentHighSchoolCourseTabbedTable } from 'components/common/StudentHighSchoolCourse/StudentHighSchoolCourseTabbedTable'
import WisernetSection from 'components/common/UI/WisernetSection'
import styles from 'components/counselor/styles/CounselorAcademicsPage.scss'
import { TestResultPage } from 'components/student/TestResultPage'
import ViewDiagnostics from 'components/student/ViewDiagnostics'
import { useShallowSelector } from 'libs'
import useActiveStudent from 'libs/useActiveStudent'
import { values } from 'lodash'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { CounselingUploadFileTags, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { CreateableNotification, createNotification } from 'store/notification/notificationsThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchDeadlines, fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { selectIsCounselor, selectStudent } from 'store/user/usersSelector'
import CounselorNotesAndFilesSummary from '../counselor/CounselorNotesAndFilesSummary'

type Props = {
  studentID?: number
}

export const AcademicsPage = ({ studentID }: Props) => {
  const dispatch = useReduxDispatch()
  const activeStudent = useActiveStudent()
  const propStudent = useSelector(selectStudent(studentID))
  const isCounselor = useSelector(selectIsCounselor)
  const student = propStudent || activeStudent

  const SUDs = useShallowSelector((state: RootState) =>
    values(state.university.studentUniversityDecisions).filter(sud => sud.student === student?.pk),
  )

  const hasSUDs = SUDs.length > 0
  const studentExists = Boolean(student)
  const studentPK = student?.pk
  useEffect(() => {
    if (!hasSUDs && studentExists) {
      dispatch(fetchStudentUniversityDecisions({ student: studentPK }))
      dispatch(fetchDeadlines({ student: studentPK }))
    }
  }, [dispatch, hasSUDs, studentExists, studentPK])

  if (!student) return <Skeleton />

  /** User (counselor) wants to send student an email inviting them to take a diagnostic*/
  const confirmDiagRegistrationEmail = () => {
    const confirm = () =>
      createNotification(student.notification_recipient, CreateableNotification.DiagnosticInvite)
        .then(() => message.success('Diagnostic invite sent'))
        .catch(() => message.error('Failed to send diagnostic invite'))

    Modal.confirm({
      title: `Send ${getFullName(student)} an email inviting them to register for a diagnostic?`,
      okText: 'Yup - send the email',
      onOk: confirm,
    })
  }

  return (
    <div className={styles.CounselorAcademicsPage}>
      <div className="academic-content">
        <WisernetSection title="Coursework" noPadding>
          <StudentHighSchoolCourseTabbedTable studentID={student.pk} />
        </WisernetSection>
        <WisernetSection title="Course Planning" noPadding>
          <StudentHighSchoolCourseTabbedTable coursePlanning studentID={student.pk} />
        </WisernetSection>
        <WisernetSection title="Testing" noPadding>
          <TestResultPage student={student.pk} />
        </WisernetSection>
        <WisernetSection title="Diagnostics" noPadding>
          {isCounselor && (
            <div className="wisernet-toolbar">
              <Button type="default" onClick={confirmDiagRegistrationEmail}>
                Invite {getFullName(student)} to take Diagnostic
              </Button>
            </div>
          )}
          <ViewDiagnostics studentID={student.pk} />
        </WisernetSection>
        {isCounselor && (
          <CounselorNotesAndFilesSummary
            studentID={student.pk}
            fileTags={[CounselingUploadFileTags.Academics, CounselingUploadFileTags.Testing]}
            notesCategories={[CounselorNoteCategory.Academics, CounselorNoteCategory.Testing]}
          />
        )}
      </div>
    </div>
  )
}
