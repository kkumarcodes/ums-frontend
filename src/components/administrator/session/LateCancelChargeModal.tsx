// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import { selectActiveModal, selectVisibleLateCancelModal } from 'store/display/displaySelectors'
import { LateCancelModalProps } from 'store/display/displayTypes'
import { Checkbox, Modal } from 'antd'
import { magentoLateCancelCharge, updateStudentTutoringSession } from 'store/tutoring/tutoringThunks'
import { closeModal } from 'store/display/displaySlice'
import styles from '../styles/LateCancelChargeModal.scss'
import { getFullName } from '../utils'

const LateCancelChargeModal = () => {
  const [loading, setLoading] = useState(false)
  const [charge, setCharge] = useState(true)
  const dispatch = useReduxDispatch()

  const props = useSelector(selectActiveModal)?.modalProps as LateCancelModalProps
  const visible = useSelector(selectVisibleLateCancelModal)

  const session = useSelector((state: RootState) =>
    visible ? state.tutoring.studentTutoringSessions[props.studentTutoringSessionPK] : null,
  )
  const student = useSelector((state: RootState) => (visible && session ? state.user.students[session.student] : null))

  // User confirms late cancel
  const handleConfirm = () => {
    // If we are to charge, attempt the charge (will mark as late cancel)
    if (student && session) {
      setLoading(true)
      if (student.last_paygo_purchase_id && charge) {
        dispatch(magentoLateCancelCharge(session.pk))
          .then(() => {
            dispatch(closeModal())
          })
          .finally(() => setLoading(false))
      } else {
        // Otherwise, just set late cancel to true
        dispatch(updateStudentTutoringSession(session.pk, { set_cancelled: true, late_cancel: true }))
          .then(() => {
            dispatch(closeModal())
          })
          .finally(() => setLoading(false))
      }
    }
  }

  return (
    <Modal
      className={styles.lateCancelChargeModal}
      visible={visible}
      okText="Confirm Late Cancel"
      onCancel={() => dispatch(closeModal())}
      onOk={handleConfirm}
      confirmLoading={loading}
    >
      <h2>Late Cancel</h2>
      <p>You are marking the session {session?.verbose_title} as late cancel.</p>
      {student && student.last_paygo_purchase_id && (
        <Checkbox checked={charge} onChange={e => setCharge(e.target.checked)}>
          Charge $70 for this late cancel
        </Checkbox>
      )}
      {student && !student.last_paygo_purchase_id && (
        <p>
          {getFullName(student)} cannot be charged for this late cancel because they do not have a last order ID on
          file.
        </p>
      )}
    </Modal>
  )
}

export default LateCancelChargeModal
