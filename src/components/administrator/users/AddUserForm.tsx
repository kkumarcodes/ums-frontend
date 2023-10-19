// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button, Form, Modal, Input, Select, message, Row } from 'antd'
import { handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/AddForm.scss'
import { startCase } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useReduxDispatch } from 'store/store'
import { createUser, updateStudent } from 'store/user/usersThunks'
import { UserType, Parent, CounselingStudentType, CounselingStudentTypeLabels } from 'store/user/usersTypes'
import { useSelector } from 'react-redux'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { selectCounselors, selectTutors, selectIsCounselor } from 'store/user/usersSelector'
import {
  WrappedFormControl,
  WrappedTextInput,
  WrappedSwitch,
  WrappedPersonSelect,
  WrappedTimezoneSelect,
} from 'components/common/FormItems'
import { Store } from 'antd/lib/form/interface'
import { WrappedGenericSelect } from 'components/common/FormItems/WrappedGenericSelect'
import { updateNotificationRecipient } from 'store/notification/notificationsThunks'
import { fetchLocations } from 'store/tutoring/tutoringThunks'

type Error = {
  non_field_errors: string[]
}

type Props = {
  userType: UserType
  isCounselorApp?: boolean
  counselorID?: number
  hideSendInvite?: boolean
  studentForParent?: number // If creating parent and we need to initialize them with a student
}
/**
 * Component renders a modal with a form to add a User of type @param userType
 * @param isCounselorApp If true then we assume it's counselor creating student and show a subset of fields
 * @param counselorID Optional, when set and creating a new student, this will be the student's counselor
 * @param hideSendInvite If True, no switch to allow sending invite (and no invite sent)
 */
export const AddUserForm = ({
  userType,
  isCounselorApp = false,
  counselorID,
  hideSendInvite,
  studentForParent,
}: Props) => {
  const [form] = Form.useForm()
  const { getFieldValue, resetFields } = form

  const label = `Add ${startCase(userType)}`
  const initialValues = {
    first_name: '',
    last_name: '',
    email: '',
    location: '',
    invite: false,
    create_zoom_account: true,
  }

  const dispatch = useReduxDispatch()

  const [visible, setVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const locations = useSelector(selectLocations)
  const counselors = useSelector(selectCounselors)
  const tutors = useSelector(selectTutors)
  const isCounselor = useSelector(selectIsCounselor)

  useEffect(() => {
    if (counselorID) {
      setLoading(true)
      dispatch(fetchLocations()).finally(() => setLoading(false))
    }
  }, [dispatch, counselorID])

  const showModal = () => {
    setError(null)
    resetFields()
    setVisible(true)
    setSubmitting(false)
  }

  const handleFinish = async (values: Store) => {
    // Only relevant when creating a parent from an add student form
    const parentValues = {
      first_name: values.parent_first_name,
      last_name: values.parent_last_name,
      secondary_parent_first_name: values.secondary_parent_first_name,
      secondary_parent_last_name: values.secondary_parent_last_name,
      secondary_parent_phone_number: values.secondary_parent_phone_number,
      email: values.parent_email,
      cc_email: values.parent_cc_email,
    }
    // Main user to be created
    const newUser = { ...values }
    delete newUser.parent_first_name
    delete newUser.parent_last_name
    delete newUser.parent_email

    if (counselorID) {
      newUser.counselor = counselorID
    }

    // If this is the CounselorApp and user type being created is a student,
    // Then assign active counselor (counselorID) to newly created student
    // And set student's counseling_student_types_list
    if (isCounselorApp && userType === UserType.Student && counselorID) {
      newUser.counseling_student_types_list = [values.counseling_student_types_list]
    }

    let parent: Parent
    // If all parentValues are defined, create parent, then associate parent with newUser=Student
    // Parent fields are optional when creating a student, however, we warn Admin that
    // all parent fields must be provided if any parent field is defined
    setSubmitting(true)
    if (parentValues.email === newUser.email) {
      setSubmitting(false)
      setError({ non_field_errors: ['Student and parent cannot have the same email address'] })
      return
    }
    if (parentValues.first_name && parentValues.last_name && parentValues.email) {
      try {
        parent = await dispatch(createUser(UserType.Parent, parentValues))
        newUser.parent = parent.pk
      } catch (err) {
        message.warn('Unable to create parent')
        setSubmitting(false)
        return
      }
    } else if (parentValues.first_name || parentValues.last_name || parentValues.email) {
      setSubmitting(false)
      setError({
        non_field_errors: [
          "You can create a student without a parent, but if adding a parent then parent's first name, last name and email are required.",
        ],
      })
      return
    }

    // Suppress invite
    if (hideSendInvite) {
      newUser.invite = false
    }

    dispatch(createUser(userType, newUser))
      .then(async data => {
        if (userType === UserType.Tutor) {
          // After creating tutor, update phone_number on associated notification_recipient
          await dispatch(
            updateNotificationRecipient(
              data.notification_recipient,
              {
                phone_number: values.phone_number ? `1${values.phone_number}` : '',
              },
              true, // Don't send verification SMS
            ),
          )
        }
        // Update student to have our new parent
        if (userType === UserType.Parent && studentForParent) {
          await dispatch(updateStudent(studentForParent, { parent: data.pk }))
        }
      })
      .then(() => {
        handleSuccess(`${startCase(userType)} created!`)
        setVisible(false)
      })
      .catch(err => {
        handleError(`Failed to create ${startCase(userType)}!`)
        setError(err?.response?.data)
      })
      .finally(() => setSubmitting(false))
  }

  const handleCancel = () => {
    setVisible(false)
  }

  const handleSetLocation = (locationID: number) => {
    const location = locations.find(l => l.pk === locationID)
    if (location) {
      form.setFieldsValue({ set_timezone: location.timezone })
    }
  }

  // Fields for all users
  const commonFields = (
    <>
      <div className="flex">
        <WrappedTextInput name="first_name" label="First Name" isRequired={true} />
        <WrappedTextInput name="last_name" label="Last Name" isRequired={true} />
      </div>
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
      />
      {userType !== UserType.Parent && (
        <WrappedGenericSelect
          name="location_id"
          label="Location"
          isRequired={true}
          entities={locations}
          propToDisplay="name"
          onChange={handleSetLocation}
          loading={loading}
          placeholder="Select a location"
        />
      )}
    </>
  )

  const studentFields = (
    <>
      <div className="flex">
        <WrappedTextInput name="parent_first_name" label="Parent First Name" />
        <WrappedTextInput name="parent_last_name" label="Parent Last Name" />
      </div>

      <WrappedTextInput
        name="parent_email"
        label="Parent Email"
        validateOnBlur={true}
        rules={[
          {
            type: 'email',
            message: 'Please enter a valid email!',
          },
        ]}
      />
      <div className="flex">
        <WrappedTextInput name="secondary_parent_first_name" label="Second Parent First Name" />
        <WrappedTextInput name="secondary_parent_last_name" label="Second Parent Last Name" />
      </div>
      <p className="help">
        Second parent will not get their own UMS account, but will get CC&apos;d on communications (if their email
        is entered below)
      </p>
      <div className="flex">
        <WrappedTextInput
          name="parent_cc_email"
          label="Parent Secondary Email"
          validateOnBlur={true}
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email!',
            },
          ]}
        />
        <Form.Item name="secondary_parent_phone_number" label="Parent Secondary Phone Number">
          <Input maxLength={10} minLength={10} addonBefore="+1" />
        </Form.Item>
      </div>
      <div className="flex">
        <WrappedTextInput name="high_school" label="High School" required={false} />
        <WrappedTextInput type="number" name="graduation_year" label="Graduation Year" required={false} />
      </div>
      {!isCounselorApp && !isCounselor && (
        <>
          <WrappedPersonSelect isRequired={false} name="counselor" label="Counselor" entities={counselors} />
          <WrappedPersonSelect
            name="tutors"
            isRequired={false}
            label="Tutor"
            entities={tutors}
            mode="multiple"
            loading={loading}
            placeholder="Select tutor(s)"
          />
        </>
      )}
      {isCounselorApp && (
        <Form.Item required={true} name="counseling_student_types_list" label="CAP Program/Package">
          <Select showSearch={true} loading={loading} placeholder="Select a program">
            {Object.keys(CounselingStudentType).map(k => (
              <Select.Option value={CounselingStudentType[k]} key={k}>
                {CounselingStudentTypeLabels[k]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
    </>
  )

  const counselorFields = (
    <>
      <div className>
        <WrappedSwitch
          wrapperCN=""
          name="part_time"
          label="Is Part Time"
          help="Part time counselors can track time and get time cards created through UMS"
        />
        <WrappedSwitch
          name="prompt"
          label="Uses Prompt?"
          help="Counselors who do not use Prompt will need to manually set their students' Short Answer completion (App Plan Page)"
        />
      </div>
      <WrappedTextInput type="number" label="Hourly Rate" name="hourly_rate" />
    </>
  )

  return (
    <>
      <Button type="primary" onClick={showModal}>
        <PlusCircleOutlined />
        {label}
      </Button>
      <Modal
        forceRender
        style={{ top: 16 }}
        title={label}
        okText="Create User"
        visible={visible}
        onCancel={handleCancel}
        footer={null}
      >
        <div className="login-form">
          <Form layout="vertical" form={form} onFinish={handleFinish} initialValues={initialValues}>
            {commonFields}
            {userType === UserType.Student && studentFields}
            {userType === UserType.Counselor && counselorFields}
            {userType === UserType.Tutor && (
              <>
                <WrappedTimezoneSelect name="set_timezone" label="Timezone" />
                <Form.Item name="phone_number" label="Phone Number">
                  <Input maxLength={10} minLength={10} addonBefore="+1" />
                </Form.Item>
              </>
            )}
            {userType === UserType.Tutor && (
              <WrappedSwitch
                name="create_zoom_account"
                label={`Send ${getFieldValue('first_name')} a Zoom invitation`}
              />
            )}
            {!hideSendInvite && <WrappedSwitch name="invite" label="Send Invitation via Email" />}
            <div className={styles.error}>{error?.non_field_errors}</div>
            <WrappedFormControl loading={submitting} onCancel={handleCancel} />
          </Form>
        </div>
      </Modal>
    </>
  )
}
