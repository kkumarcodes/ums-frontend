// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import CASStudentList from 'components/common/CASStudentList'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { Skeleton } from 'antd'

const CounselorCASStudentList = () => {
  const activeCounselor = useSelector((state: RootState) =>
    state.user.activeUser ? state.user.counselors[state.user.activeUser.cwUserID] : null,
  )
  return (
    <>
      <h2>CAS Students</h2>
      <div>
        {!activeCounselor && <Skeleton />}
        {activeCounselor && <CASStudentList counselor={activeCounselor.pk} />}
      </div>
    </>
  )
}

export default CounselorCASStudentList
