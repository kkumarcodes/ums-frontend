// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'

import { selectCounselors } from 'store/user/usersSelector'
import { Form, Modal, Select } from 'antd'
import { getFullName } from 'components/administrator'
import { WrappedDatePicker, WrappedFormControl } from 'components/common/FormItems'
import { useForm } from 'antd/lib/form/Form'
import { CreateCounselorTimeCardParams, createCounselorTimeCards } from 'store/counseling/counselingThunks'
import { closeModal } from 'store/display/displaySlice'
import { CreateCounselorTimeCardProps, MODALS } from 'store/display/displayTypes'
import { selectVisibleModal, selectActiveModal } from 'store/display/displaySelectors'

const CreateCounselorTimeCardModal = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm();
  const visible = useSelector(selectVisibleModal(MODALS.CREATE_COUNSELOR_TIME_CARD))
  const props = useSelector(selectActiveModal)?.modalProps as CreateCounselorTimeCardProps

  const counselors = useSelector(selectCounselors).filter(c => c.part_time)

  const propsCounselors = props?.counselors || []
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ counselors: propsCounselors })
      setLoading(false)
    }
  }, [form, propsCounselors, visible])

  const onSubmit = async () => {
    await form.validateFields()
    const values = form.getFieldsValue()
    const createData: CreateCounselorTimeCardParams = {
      start: values.start.format('YYYY-MM-DD'),
      end: values.end.format('YYYY-MM-DD'),
      counselors: values.counselors,
    }
    setLoading(true)
    await dispatch(createCounselorTimeCards(createData))
    setLoading(false)
    form.resetFields()
    dispatch(closeModal())
  }

  return (
    <Modal footer={null} onCancel={() => dispatch(closeModal())} visible={visible} title="Create Time Card(s)">
      <Form layout="vertical" form={form}>
        <Form.Item
          required={true}
          name="counselors"
          label="Counselors"
          help="Select the one or more counselors you are creating a time card for"
        >
          <Select
            mode="multiple"
            showSearch={true}
            optionFilterProp="children"
            options={counselors.map(c => ({ label: getFullName(c), value: c.pk }))}
          />
        </Form.Item>
        <WrappedDatePicker isRequired={true} name="start" label="Start" />
        <WrappedDatePicker isRequired={true} name="end" label="End" />
        <WrappedFormControl
          okText="Create Time Cards"
          onCancel={() => dispatch(closeModal())}
          onSubmit={onSubmit}
          loading={loading}
        />
      </Form>
    </Modal>
  )
}
export default CreateCounselorTimeCardModal
