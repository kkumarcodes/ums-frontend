// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/EditForm.scss'
import {
  WrappedFormControl,
  WrappedGenericSelect,
  WrappedPersonSelect,
  WrappedSwitch,
  WrappedTextInput,
  WrappedTimezoneSelect,
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
import { updateCounselor } from 'store/user/usersThunks'

export const EditCounselorForm = () => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const { id } = useParams<{ id: string }>()

  const dispatch = useReduxDispatch()

  const counselor = useShallowSelector((state: RootState) => state.user.counselors[Number(id)])
  const students = useSelector(selectStudents)
  const locations = useSelector(selectLocations)

  const [loading, setLoading] = useState(false)

  const handleFinish = (values: Store) => {
    const editCounselor = values
    setLoading(true)
    dispatch(updateCounselor(Number(id), editCounselor))
      .then(() => {
        handleSuccess('Update successful!')
        window.location.href = '.#/counselors/'
      })
      .catch(() => handleError('Could not update'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (counselor) {
      setFieldsValue({
        first_name: counselor.first_name,
        last_name: counselor.last_name,
        email: counselor.email,
        students: counselor.students,
        location_id: counselor.location?.pk,
        set_timezone: counselor.set_timezone,
        hourly_rate: counselor.hourly_rate,
        part_time: counselor.part_time,
        prompt: counselor.prompt,
      })
    }
  }, [counselor, setFieldsValue])

  if (!counselor) {
    return null
  }

  let timezoneDescription = ''
  if (counselor.timezone !== counselor.set_timezone) {
    timezoneDescription = `We're using the timezone ${counselor.timezone} because of the location ${counselor.first_name} is associated with. Override that timezone with a selection here`
  }

  return (
    <>
      <h1>
        Edit Counselor {counselor.first_name} {counselor.last_name}:
      </h1>
      <Form layout="vertical" form={form} onFinish={handleFinish} className="form-3-col">
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
        <WrappedTimezoneSelect name="set_timezone" label="Timezone" extra={timezoneDescription} />
        <WrappedGenericSelect
          name="location_id"
          label="Location"
          isRequired={false}
          entities={locations}
          propToDisplay="name"
          wrapperCN={styles.antFormItem}
        />
        <WrappedPersonSelect
          name="students"
          label="Students"
          entities={students}
          isRequired={false}
          mode="multiple"
          wrapperCN={styles.antFormItem}
        />
        <WrappedSwitch
          name="part_time"
          label="Is Part Time"
          help="Part time counselors can track time and get time cards created through UMS"
        />
        <WrappedSwitch
          name="prompt"
          label="Uses Prompt?"
          help="Counselors who do not use Prompt will need to manually set their students' Short Answer completion (App Plan Page)"
        />
        <WrappedTextInput type="number" label="Hourly Rate" name="hourly_rate" />
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} onCancel={() => History.goBack()} />
      </Form>
    </>
  )
}
export default EditCounselorForm
