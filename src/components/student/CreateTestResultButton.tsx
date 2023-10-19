// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsStudent, selectCWUserID } from 'store/user/usersSelector'

type Props = {
  studentPK: number
}

/**
 * Renders a button that will launch a modal to create
 * a StudentHighSchoolCourse for student with @param studentID
 */
export const CreateTestResultButton = ({ studentPK }: Props) => {
  const dispatch = useReduxDispatch()
  const isStudent = useSelector(selectIsStudent)
  const cwUserID = useSelector(selectCWUserID)
  const studentID = (isStudent ? cwUserID : studentPK) as number
  return (
    <div className="wisernet-toolbar">
      <Button
        type="primary"
        onClick={() => dispatch(showModal({ modal: MODALS.TEST_RESULT, props: { student: studentID } }))}
      >
        <PlusCircleOutlined />
        Add Test
      </Button>
    </div>
  )
}
