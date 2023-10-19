// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Select, Input } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/EditForm.scss'
import {
  WrappedFormControl,
  WrappedGenericSelect,
  WrappedPersonSelect,
  WrappedTextInput,
  WrappedTimezoneSelect,
  WrappedSwitch,
  WrappedTutoringServiceSelect,
} from 'components/common/FormItems'
import {history} from 'App'
import { useShallowSelector } from 'libs/useShallowSelector'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { selectStudents } from 'store/user/usersSelector'
import { updateTutor } from 'store/user/usersThunks'
import { fetchNotificationRecipient, updateNotificationRecipient } from 'store/notification/notificationsThunks'

const { Option } = Select

export const EditTutorForm = () => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const { id } = useParams<{ id: string }>()

  const dispatch = useReduxDispatch()

  const tutor = useShallowSelector((state: RootState) => state.user.tutors[Number(id)])
  const students = useSelector(selectStudents)
  const locations = useSelector(selectLocations)

  const [loading, setLoading] = useState(false)

  const handleFinish = (values: Store) => {
    const editTutor = values
    setLoading(true)
    dispatch(updateTutor(Number(id), editTutor))
      .then(() => {
        dispatch(
          updateNotificationRecipient(
            tutor.notification_recipient,
            {
              phone_number: values.phone_number ? `1${values.phone_number}` : '',
            },
            true,
          ),
        )
      })
      .then(() => {
        handleSuccess('Update successful')
        window.location.href = '/user/platform/administrator/tutors/'
      })
      .catch(() => handleError('Update failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tutor) {
      dispatch(fetchNotificationRecipient(tutor.notification_recipient)).then(data => {
        setFieldsValue({
          phone_number: data?.phone_number.slice(-10),
          first_name: tutor.first_name,
          last_name: tutor.last_name,
          email: tutor.email,
          degree: tutor.degree,
          bio: tutor.bio,
          can_tutor_remote: tutor.can_tutor_remote,
          zoom_url: tutor.zoom_url,
          students: tutor.students,
          location_id: tutor.location?.pk,
          set_timezone: tutor.set_timezone,
          is_test_prep_tutor: tutor.is_test_prep_tutor,
          is_curriculum_tutor: tutor.is_curriculum_tutor,
          tutoring_services: tutor.tutoring_services,
          students_can_book: tutor.students_can_book,
          hourly_rate: tutor.hourly_rate,
          is_diagnostic_evaluator: tutor.is_diagnostic_evaluator,
          is_active: tutor.is_active,
        })
      })
    }
  }, [tutor, setFieldsValue, dispatch])

  if (!tutor) {
    return null
  }

  let timezoneDescription = ''
  if (tutor.timezone !== tutor.set_timezone) {
    timezoneDescription = `We're using the timezone ${tutor.timezone} because of the location ${tutor.first_name} is associated with. Override that timezone with a selection here`
  }

  return (
    <>
      <h1>
        Edit Tutor {tutor.first_name} {tutor.last_name}:
      </h1>
      <Form layout="vertical" form={form} onFinish={handleFinish} className={`${styles.EditTutorForm} form-3-col`}>
        <WrappedTextInput
          name="first_name"
          label="First Name"
          isRequired={true}
          wrapperCN={styles.antFormItem}
          value={tutor.first_name}
        />
        <WrappedTextInput
          name="last_name"
          label="Last Name"
          isRequired={true}
          wrapperCN={styles.antFormItem}
          value={tutor.last_name}
        />
        <WrappedTextInput
          name="email"
          label="Email"
          isRequired={true}
          validateOnBlur={true}
          wrapperCN={styles.antFormItem}
          value={tutor.email}
        />
        <WrappedTimezoneSelect name="set_timezone" label="Timezone" extra={timezoneDescription} />
        <Form.Item name="phone_number" label="Phone Number">
          <Input maxLength={10} minLength={10} addonBefore="+1" />
        </Form.Item>
        <WrappedTextInput name="degree" label="Degree" wrapperCN={styles.antFormItem} />
        <WrappedTextInput name="bio" label="Bio" wrapperCN={styles.antFormItem} />
        <Form.Item label="Remote?" name="can_tutor_remote">
          <Select>
            <Option key={1} value={true}>
              Yes
            </Option>
            <Option key={0} value={false}>
              No
            </Option>
          </Select>
        </Form.Item>
        <WrappedTextInput name="zoom_url" label="Remote Link (Zoom)" wrapperCN={styles.antFormItem} />
        <WrappedPersonSelect
          name="students"
          label="Students"
          entities={students}
          isRequired={false}
          mode="multiple"
          wrapperCN={styles.antFormItem}
        />
        <WrappedGenericSelect
          name="location_id"
          label="Location"
          isRequired={false}
          entities={locations}
          propToDisplay="name"
          wrapperCN={styles.antFormItem}
        />
        <WrappedTutoringServiceSelect
          name="tutoring_services"
          label="Subjects"
          isRequired={false}
          wrapperCN={styles.antFormItem}
        />
        <WrappedTextInput
          prefix="$"
          type="number"
          label="Hourly Rate"
          name="hourly_rate"
          wrapperCN={styles.antFormItem}
        />
        <WrappedSwitch name="is_curriculum_tutor" label="Is Curriculum Tutor" wrapperCN={styles.antFormItem} />
        <WrappedSwitch name="is_test_prep_tutor" label="Is Test Prep Tutor" wrapperCN={styles.antFormItem} />
        <WrappedSwitch
          name="students_can_book"
          label="Families Can Book Sessions"
          help="If off, sessions can only be booked by tutor and admins"
          wrapperCN={styles.antFormItem}
        />
        <WrappedSwitch
          name="is_active"
          label="Is Account Active"
          help="Deactivate/Activate user accounts by toggling this button."
        />
        <WrappedSwitch
          name="is_diagnostic_evaluator"
          label="Is Diag Evaluator"
          help="If on, this tutor can be assigned diagnostics to score or evaluate, and see those diagnostics in UMS"
          wrapperCN={styles.antFormItem}
        />
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} onCancel={() => History.goBack()} />
      </Form>
    </>
  )
}

export default EditTutorForm
