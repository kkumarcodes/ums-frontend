// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'

import { Card } from 'antd'
import CounselingTimePage from 'components/counseling/TimeTracking/CounselingTimePage'
import { UserType } from 'store/user/usersTypes'
import { TutoringPackagePurchaseList } from '../tutoringPackages/TutoringPackagePurchaseList'
import styles from './styles/ExpandedStudentRow.scss'

type Props = {
  studentID: number
}

const ExpandedStudentPackagesHours = ({ studentID }: Props) => {
  const student = useSelector((state: RootState) => state.user.students[studentID])
  return (
    <div className={styles.expandedStudentPackagesHours}>
      <Card title="Tutoring Packages" className="elevated">
        <TutoringPackagePurchaseList forStudent={studentID} />
      </Card>
      {student.counselor && (
        <Card title="CAP Hours" className="elevated">
          <CounselingTimePage studentID={studentID} userType={UserType.Administrator} />
        </Card>
      )}
    </div>
  )
}
export default ExpandedStudentPackagesHours
