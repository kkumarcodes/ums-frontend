// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'

interface Props {
  studentID: number
}

export const CreateTaskButton = ({ studentID }: Props) => {
  const dispatch = useReduxDispatch()

  return (
    <Button
      onClick={e => {
        dispatch(showModal({ props: { studentID }, modal: MODALS.CREATE_TASK }))
      }}
      type="primary"
      htmlType="button"
      className="buttonCreateTask"
    >
      <PlusCircleOutlined />
      Add Tutoring Task
    </Button>
  )
}
