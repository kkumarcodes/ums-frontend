// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Form, Input, Select } from 'antd'
import { handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/AddForm.scss'
import React, { useState } from 'react'
import { useReduxDispatch } from 'store/store'
import { updateLocation } from 'store/tutoring/tutoringThunks'
import { ALL_STATES } from 'store/common/commonTypes'
import { Location } from 'store/tutoring/tutoringTypes'
import { WrappedTimezoneSelect } from 'components/common/FormItems'

type Props = {
  location: Location | null
  handleClose: any
}

/**
 * Component renders a modal with a form to edit a Location
 * NOTE: Can be expanded to also handle create location to replace AddLocationForm.tsx
 */
export const LocationForm = ({ location, handleClose }: Props) => {
  const [form] = Form.useForm()
  const pk = location?.pk

  const initialValues = location || {
    name: '',
    address: '',
    address_line_two: '',
    city: '',
    zip_code: '',
    state: '',
    is_remote: false,
  }

  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)

  const handleFinish = values => {
    // if/when component expanded to be used to create new location, need to check if pk exists
    const newLocation = pk ? { ...values, pk } : values

    setLoading(true)
    dispatch(updateLocation(newLocation))
      .then(() => {
        handleSuccess('Location updated!')
      })
      .catch(err => {
        handleError(`Failed to update location!`)
      })
      .finally(() => {
        setLoading(false)
        handleClose()
      })
  }

  const states = ALL_STATES.map(s => (
    <Select.Option value={s} key={s}>
      {s}
    </Select.Option>
  ))

  return (
    <div className={styles.containerForm}>
      <Form title="Add Location" layout="vertical" form={form} onFinish={handleFinish} initialValues={initialValues}>
        <Form.Item
          label="Location Name"
          name="name"
          rules={[{ required: true, message: "Please input location's name!", whitespace: true }]}
        >
          <Input placeholder="location name" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input placeholder="description" />
        </Form.Item>
        <WrappedTimezoneSelect name="timezone" label="Timezone" extra="Timezone for location" />
        <Form.Item label="Address" name="address">
          <Input placeholder="address" />
        </Form.Item>
        <Form.Item label="Address 2" name="address_line_two" rules={[{ required: false, whitespace: true }]}>
          <Input placeholder="address line 2" />
        </Form.Item>
        <Form.Item label="City" name="city">
          <Input placeholder="city" />
        </Form.Item>
        <Form.Item label="State" name="state">
          <Select>{states}</Select>
        </Form.Item>
        <Form.Item>
          <div className={`${styles.buttonWrapper} right-buttons-container`}>
            <Button className={styles.buttonCancel} onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
  )
}
