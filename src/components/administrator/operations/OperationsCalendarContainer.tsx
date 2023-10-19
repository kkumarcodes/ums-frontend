// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { useReduxDispatch } from 'store/store'
import { Skeleton, Button } from 'antd'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { PlusCircleOutlined } from '@ant-design/icons'
import { OperationsCalendarProvider, useCreateOpsCalendarCtx } from './OperationsCalendarContext'
import OperationsCalendarFilter from './OperationsCalendarFilter'
import OperationsCalendar from './OperationsCalendar'

const OperationsCalendarContainer = () => {
  const contextValue = useCreateOpsCalendarCtx()
  const dispatch = useReduxDispatch()

  return (
    <div>
      <OperationsCalendarProvider value={contextValue}>
        {contextValue.loading && <Skeleton />}
        {!contextValue.loading && <OperationsCalendarFilter />}
        <div className="actions right">
          <Button
            type="primary"
            onClick={() => dispatch(showModal({ modal: MODALS.CREATE_TUTORING_SESSION, props: {} }))}
          >
            <PlusCircleOutlined />
            Create Tutoring Session
          </Button>
        </div>
        {!contextValue.loading && <OperationsCalendar />}
      </OperationsCalendarProvider>
    </div>
  )
}

export default OperationsCalendarContainer
