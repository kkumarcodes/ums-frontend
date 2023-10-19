// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import React from 'react'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { Views } from 'components/tutoring/TimeCard'

interface Props {
  pk?: number
}

/**
 * Renders a button that onClick launches TimeCard modal
 */
export const TimeCardButtonCreate = ({ pk }: Props) => {
  const dispatch = useReduxDispatch()

  return (
    <Button
      onClick={() => {
        dispatch(showModal({ props: { pk }, modal: MODALS.TIME_CARD }))
      }}
      type="primary"
      className="buttonCreate"
    >
      <PlusCircleOutlined />
      Create Time Card(s)
    </Button>
  )
}
