// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Input, message, Modal } from 'antd'

import { WrappedPersonSelect, WrappedSwitch, WrappedTextInput } from 'components/common/FormItems'
import { orderBy } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselingHoursGrant } from 'store/counseling/counselingSelectors'
import { createCounselingHoursGrant, updateCounselingHoursGrant } from 'store/counseling/counselingThunks'
import { CounselingHoursGrant } from 'store/counseling/counselingTypes'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CounselingHoursGrantModalProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectStudents } from 'store/user/usersSelector'

const CounselingHoursGrantModal = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const modalProps = useSelector(
    selectVisibleModalProps(MODALS.COUNSELING_HOURS_GRANT_MODAL),
  ) as CounselingHoursGrantModalProps
  const visible = useSelector(selectVisibleModal(MODALS.COUNSELING_HOURS_GRANT_MODAL))
  const students = orderBy(useSelector(selectStudents), 'last_name')

  const editCounselingHoursGrant = useSelector(selectCounselingHoursGrant(modalProps?.editCounselingHoursGrantID))

  useEffect(() => {
    if (visible && editCounselingHoursGrant?.pk) {
      form.setFieldsValue(editCounselingHoursGrant)
    }
  }, [editCounselingHoursGrant, form, visible])

  const forceStudentID = modalProps?.studentID
  useEffect(() => {
    if (visible && forceStudentID) {
      form.setFieldsValue({ student: forceStudentID })
    }
  }, [forceStudentID, form, visible])

  const doCloseModal = useCallback(() => {
    form.resetFields()
    dispatch(closeModal())
  }, [dispatch, form])

  const editGrantPK = editCounselingHoursGrant?.pk
  const doSubmit = useCallback(async () => {
    setLoading(true)
    try {
      await form.validateFields()
      const grant: Partial<CounselingHoursGrant> = form.getFieldsValue()
      if (forceStudentID && !editCounselingHoursGrant) grant.student = forceStudentID
      if (editGrantPK) {
        await dispatch(updateCounselingHoursGrant({ ...grant, pk: editGrantPK }))
      } else {
        await dispatch(createCounselingHoursGrant(grant))
      }
      doCloseModal()
    } catch (err) {
      message.error('Failed to save hours')
    } finally {
      setLoading(false)
    }
  }, [dispatch, doCloseModal, editCounselingHoursGrant, editGrantPK, forceStudentID, form])

  return (
    <Modal
      title="Create/Edit Counseling Hours"
      visible={visible}
      onOk={doSubmit}
      okButtonProps={{ loading }}
      onCancel={doCloseModal}
    >
      <Form form={form} layout="vertical">
        <WrappedPersonSelect
          disabled={!!editCounselingHoursGrant || !!forceStudentID}
          name="student"
          label="Student"
          entities={students}
          isRequired
        />
        <WrappedTextInput type="number" min="0" name="number_of_hours" label="Number of Hours" required />
        <WrappedTextInput type="number" min="0" name="amount_paid" label="(Optional) amount paid - for reporting" />
        <WrappedSwitch name="marked_paid" label="Mark Paid" />
        <Form.Item name="note" label="Note">
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  )
}
export default CounselingHoursGrantModal
