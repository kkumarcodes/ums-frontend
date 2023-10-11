// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button, Form, Modal, Row } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/AddForm.scss'
import { WrappedFormControl, WrappedSwitch, WrappedTextInput } from 'components/common/FormItems'
import React, { useState } from 'react'
import { useReduxDispatch } from 'store/store'
import { createLocation } from 'store/tutoring/tutoringThunks'

type Error = {
  non_field_errors: string[]
}

/**
 * Component renders a modal with a form to add a Location
 */
export const AddLocationForm = () => {
  const [form] = Form.useForm()
  const { resetFields } = form
  const initialValues = {
    name: '',
    description: '',
    offers_tutoring: false,
    offers_admissions: false,
  }

  const dispatch = useReduxDispatch()

  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const showModal = () => {
    setError(null)
    setLoading(false)
    resetFields()
    setVisible(true)
  }

  const handleFinish = (values: Store) => {
    const newLocation = values
    setLoading(true)
    dispatch(createLocation(newLocation))
      .then(() => {
        handleSuccess('Location created!')
        setVisible(false)
      })
      .catch(err => {
        handleError(`Failed to create location!`)
        setError(err?.response?.data)
      })
      .finally(() => setLoading(false))
  }

  const handleCancel = () => {
    setVisible(false)
  }

  return (
    <div>
      <Button type="primary" onClick={showModal}>
        <PlusCircleOutlined />
        Add Location
      </Button>
      <Modal forceRender title="Add Location" visible={visible} onCancel={handleCancel} footer={null}>
        <div className="login-form">
          <Form layout="vertical" form={form} onFinish={handleFinish} initialValues={initialValues}>
            <WrappedTextInput name="name" label="Name" isRequired={true} placeholder="Location name" />
            <WrappedTextInput
              name="description"
              label="Description"
              isRequired={true}
              placeholder="Location description"
            />
            <Row>
              <WrappedSwitch name="offers_tutoring" label="Offers Tutoring" className="switchTutoring" />
              <WrappedSwitch name="offers_admissions" label="Offers Admissions" />
            </Row>
            <div className={styles.error}>{error?.non_field_errors}</div>
            <WrappedFormControl loading={loading} onCancel={handleCancel} />
          </Form>
        </div>
      </Modal>
    </div>
  )
}
