// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Modal from 'antd/lib/modal/Modal'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { AvailabilityModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { AvailabilityScheduler } from './AvailabilityScheduler'

/**
 * Renders a TutorAvailability modal used to edit both weekly and recurring availabilities
 * Receives as modalProps:
 * @param start datestring representing earliest time that can be set in UTC (NOTE: only time portion used when setting recurring availability)
 * @param end datestring representing latest time that can be set in UTC (NOTE: only time portion used when setting recurring availability)
 * @param isRecurring boolean to determine if weekly or recurring availability is being set
 * @param day weekday that is being set (NOTE: used only for recurring availability - overrides start/end date)
 */
export const AvailabilityModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.AVAILABILITY))
  const props = useSelector(selectVisibleModalProps(MODALS.AVAILABILITY)) as AvailabilityModalProps

  return (
    <Modal
      title={`Edit ${props?.isRecurring ? 'recurring availability' : 'available times'}`}
      style={{ top: 20 }}
      wrapClassName="modalAvailability"
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      footer={null}
      destroyOnClose={true}
    >
      {visible && <AvailabilityScheduler {...props} />}
    </Modal>
  )
}
