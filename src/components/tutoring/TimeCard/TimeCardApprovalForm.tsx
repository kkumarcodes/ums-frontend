// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form } from 'antd'
import { handleSuccess } from 'components/administrator'
import { WrappedFormControl, WrappedTextInput } from 'components/common/FormItems'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { Store } from 'antd/lib/form/interface'
import React, { useState } from 'react'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { adminApproveTimeCard, tutorApproveTimeCard, updateTimeCard } from 'store/tutoring/tutoringThunks'

type Props = {
  pk: number
  tutorID?: number
  adminID?: number
}
/**
 * @param pk timeCardPK
 * @param tutorID Defined if tutor is approver
 * @param adminID Defined if admin is approver
 * Component renders Approval Form; used in TimeCard Modal
 * After approving time card, component will attempt to update admin_note/tutor_note if present
 */
export const TimeCardApprovalForm = ({ pk, tutorID, adminID }: Props) => {
  const [form] = Form.useForm()

  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)

  const handleFinish = async (values: Store) => {
    const promises: Array<Promise<any>> = []
    if (!tutorID && !adminID) {
      throw new Error('approver must be tutor or admin')
    }
    if (tutorID) {
      promises.push(dispatch(tutorApproveTimeCard(pk)))
    }
    if (adminID) {
      promises.push(dispatch(adminApproveTimeCard(pk)))
    }
    setLoading(true)
    Promise.all(promises)
      .then(() => {
        if (values.note) {
          if (tutorID) {
            dispatch(updateTimeCard(pk, { tutor_note: values.note }))
          }
          if (adminID) {
            dispatch(updateTimeCard(pk, { admin_note: values.note }))
          }
        }
      })
      .then(() => {
        dispatch(closeModal())
        handleSuccess('Time card approved!')
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className={styles.containerForm}>
      <Form layout="vertical" className="form" form={form} onFinish={handleFinish}>
        <WrappedTextInput name="note" label="Add Note" placeholder="Optional" />
        <WrappedFormControl okText="Approve Time Card" loading={loading} />
      </Form>
    </div>
  )
}
