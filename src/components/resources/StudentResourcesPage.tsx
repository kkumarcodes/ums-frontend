// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Empty } from 'antd'
import CounselingFileUploads from 'components/counseling/CounselingFileUploads'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect } from 'react'
import { fetchCounselingFileUploads } from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import ResourceManager from './ResourceManager'
import styles from './styles/StudentResourcesPage.scss'

const StudentResourcesPage = () => {
  const activeStudent = useActiveStudent()
  const isCounselingStudent = Boolean(activeStudent?.counseling_student_types_list)
  const dispatch = useReduxDispatch()

  const studentPK = activeStudent?.pk
  useEffect(() => {
    if (studentPK) {
      dispatch(fetchCounselingFileUploads({ counseling_student: studentPK }))
    }
  }, [dispatch, studentPK])

  return (
    <div className={styles.studentResourcesPage}>
      {isCounselingStudent && activeStudent && <CounselingFileUploads studentID={activeStudent.pk} />}
      {activeStudent && <ResourceManager studentID={activeStudent.pk} />}
      {(!isCounselingStudent || !activeStudent) && <Empty />}
    </div>
  )
}

export default StudentResourcesPage
