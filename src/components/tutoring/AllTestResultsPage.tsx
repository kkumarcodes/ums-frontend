// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Space } from 'antd'
import { TestResultTable } from 'components/student/TestResultTable'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from 'store/user/usersSelector'
import { UserType } from 'store/user/usersTypes'

type Props = {
  tutorID?: number
}

export const AllTestResultsPage = ({ tutorID }: Props) => {
  const tutor = useSelector(selectUser(UserType.Tutor, tutorID))
  return (
    <Space direction="vertical" size="large">
      <h2>{`Test Results for Tutor: ${tutor?.first_name}`}</h2>
      <TestResultTable tutorID={tutorID} />
    </Space>
  )
}
