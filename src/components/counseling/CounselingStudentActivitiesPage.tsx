// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { LinkOutlined } from '@ant-design/icons'
import { Card, Skeleton } from 'antd'
import WisernetSection from 'components/common/UI/WisernetSection'
import { CounselingStudentActivityTable } from 'components/counseling/CounselingStudentActivityTable'
import { CounselorActivitiesNotes } from 'components/counselor/CounselorActivitiesNotes'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  CounselingUploadFileTags,
  CounselorNoteCategory,
  StudentActivityCategories,
} from 'store/counseling/counselingTypes'
import { useReduxDispatch } from 'store/store'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { fetchDeadlines, fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { selectIsCounselorOrAdmin, selectIsParent, selectStudent } from 'store/user/usersSelector'
import CounselorNotesAndFilesSummary from '../counselor/CounselorNotesAndFilesSummary'
import styles from './styles/CounselingStudentActivitesPage.scss'

type Props = {
  studentID?: number
}

export const CounselingStudentActivitiesPage = ({ studentID }: Props) => {
  const activeStudent = useActiveStudent()
  const propStudent = useSelector(selectStudent(studentID))
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const isParent = useSelector(selectIsParent)
  const student = propStudent || activeStudent
  const dispatch = useReduxDispatch()

  const SUDs = useSelector(selectSUDsForStudent(student?.pk))

  const studentPK = student?.pk
  const hasSUDs = SUDs.length > 0
  useEffect(() => {
    if (studentPK) {
      const promises: Array<Promise<any>> = []
      if (!hasSUDs && studentPK) {
        promises.push(dispatch(fetchStudentUniversityDecisions({ student: studentPK })))
        promises.push(dispatch(fetchDeadlines({ student: studentPK })))
      }
    }
  }, [dispatch, hasSUDs, studentPK])

  if (!student) return <Skeleton />

  return (
    <div className={`${styles.counselingStudentActivitiesPage} app-white-container`}>
      <WisernetSection noPadding title="Student Activities">
        <p className="center instructions">
          Refer to&nbsp;
          <a
            href="https://drive.google.com/file/d/1f8xGix-_AhqNzqKwvBf0Cl5Z7JPkjDVy/view?usp=sharing"
            rel="noreferrer"
            target="_blank"
          >
            this document&nbsp;
            <LinkOutlined />
          </a>
          &nbsp;for guidelines and examples
        </p>
        <CounselingStudentActivityTable studentID={student.pk} category={StudentActivityCategories.Other} />
        <CounselingStudentActivityTable studentID={student.pk} category={StudentActivityCategories.Award} />
      </WisernetSection>
      {!isParent && (
        <WisernetSection noPadding title="Activities Notes">
          <CounselorActivitiesNotes studentID={student.pk} />
        </WisernetSection>
      )}
      {isCounselorOrAdmin && (
        <CounselorNotesAndFilesSummary
          studentID={student.pk}
          notesCategories={[CounselorNoteCategory.Activities]}
          fileTags={[CounselingUploadFileTags.Activities]}
        />
      )}
    </div>
  )
}
