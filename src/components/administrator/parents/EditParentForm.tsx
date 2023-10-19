// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError } from 'components/administrator'
import styles from 'components/administrator/styles/EditForm.scss'
import {
  WrappedEntitySelect,
  WrappedFormControl,
  WrappedPersonSelect,
  WrappedSwitch,
  WrappedTextInput,
  WrappedTimezoneSelect,
} from 'components/common/FormItems'
import {history} from 'App'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { ALL_STATES } from 'store/common/commonTypes'
import { fetchNotificationRecipient, updateNotificationRecipient } from 'store/notification/notificationsThunks'
import { useReduxDispatch } from 'store/store'
import { selectIsAdmin, selectParent, selectStudents } from 'store/user/usersSelector'
import { updateParent } from 'store/user/usersThunks'
import { Parent } from 'store/user/usersTypes'

type Props = {
  onSubmit?: (parent: Parent) => void
  onCancel?: () => void
  parentID?: number
  inModal?: boolean
}

export const EditParentForm = ({ onSubmit, onCancel, parentID, inModal }: Props) => {
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const paramID = useParams<{ id: string }>().id
  const id = parentID || paramID

  const parent = useSelector(selectParent(Number(id)))
  const isAdmin = useSelector(selectIsAdmin)
  const students = useSelector(selectStudents)

  const [loading, setLoading] = useState(false)

  const notificationRecipient = parent?.notification_recipient

  const handleFinish = useCallback(
    async (values: Store) => {
      const editParent = values
      const editNotification = values.phone_number
      setLoading(true)
      try {
        if (notificationRecipient) {
          await dispatch(
            updateNotificationRecipient(
              notificationRecipient,
              {
                phone_number: editNotification,
              },
              true,
            ),
          )
        }
        const updatedParent = await dispatch(updateParent(Number(id), editParent))
        if (onSubmit) {
          onSubmit(updatedParent)
        } else if (isAdmin) {
          History.push(`/parents/`)
        }
      } catch {
        handleError('Could not update')
      }
      setLoading(false)
    },
    [dispatch, id, isAdmin, onSubmit, notificationRecipient],
  )

  const cancel = () => {
    if (onCancel) {
      onCancel()
    } else if (isAdmin) {
      History.push(`/parents/`)
    }
  }

  useEffect(() => {
    if (parent) setFieldsValue(parent)
  }, [parent, setFieldsValue])

  useEffect(() => {
    if (parent && parent.notification_recipient) {
      dispatch(fetchNotificationRecipient(parent.notification_recipient)).then(data =>
        setFieldsValue({ phone_number: data?.phone_number }),
      )
    }
  }, [parent, dispatch, setFieldsValue])

  if (!parent) {
    return null
  }

  let timezoneDescription = ''
  if (parent.timezone !== parent.set_timezone) {
    timezoneDescription = `We're using the timezone ${parent.timezone} because of the location ${parent.first_name} is associated with. Override that timezone with a selection here`
  }

  return (
    <>
      <h3>
        Edit Parent {parent.first_name} {parent.last_name}:
      </h3>
      <Form layout="vertical" form={form} onFinish={handleFinish} className={`form-${inModal ? '2' : '3'}-col`}>
        <WrappedTextInput name="first_name" label="First Name" isRequired={true} wrapperCN={styles.antFormItem} />
        <WrappedTextInput name="last_name" label="Last Name" isRequired={true} wrapperCN={styles.antFormItem} />
        <WrappedTextInput
          name="email"
          label="Email"
          isRequired={true}
          validateOnBlur={true}
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email!',
            },
          ]}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput name="phone_number" label="Phone Number " isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedTextInput
          name="secondary_parent_first_name"
          label="Second Parent First Name"
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />

        <WrappedTextInput
          name="secondary_parent_last_name"
          label="Second Parent Last Name"
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput
          name="cc_email"
          label="Second Parent Email (CC Email)"
          placeholder="cc email"
          isRequired={false}
          validateOnBlur={true}
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email!',
            },
          ]}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput
          name="secondary_parent_phone_number"
          label="Second Parent Phone Number "
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />

        <WrappedTextInput name="address" label="Address" isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedTextInput
          name="address_line_two"
          label="Address Line 2"
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput name="city" label="City" isRequired={false} wrapperCN={styles.antFormItem} />
        <WrappedEntitySelect
          name="state"
          label="State"
          entities={ALL_STATES}
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput name="zip_code" label="Zipcode " isRequired={false} wrapperCN={styles.antFormItem} />

        <WrappedTimezoneSelect name="set_timezone" label="Timezone" extra={timezoneDescription} />
        <WrappedPersonSelect
          name="students"
          label="Students"
          entities={students}
          isRequired={false}
          mode="multiple"
          wrapperCN={styles.antFormItem}
          disabled
        />
        {isAdmin && (
          <WrappedSwitch
            name="is_active"
            label="Is Account Active"
            help="Deactivate/Activate user accounts by toggling this button."
          />
        )}
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} onCancel={cancel} />
      </Form>
    </>
  )
}

export default EditParentForm
