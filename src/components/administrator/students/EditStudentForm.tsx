// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Form, Input, message, Modal, Select, Tag, Tooltip } from 'antd'
import { Store } from 'antd/lib/form/interface'
import classNames from 'classnames'
import { getFullName, handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/EditForm.scss'
import {
  WrappedEntitySelect,
  WrappedFormControl,
  WrappedGenericSelect,
  WrappedPersonSelect,
  WrappedSwitch,
  WrappedTextInput,
  WrappedTimezoneSelect,
} from 'components/common/FormItems'
import {history} from 'App'
import { filter, map, uniq } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { ALL_STATES, Platform } from 'store/common/commonTypes'
import {
  CreateableNotification,
  createNotification,
  fetchNotificationRecipient,
  updateNotificationRecipient,
} from 'store/notification/notificationsThunks'
import { selectResourceGroups, selectResources } from 'store/resource/resourcesSelectors'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { fetchLocations } from 'store/tutoring/tutoringThunks'
import {
  selectCounselors,
  selectIsAdmin,
  selectIsCounselorOrAdmin,
  selectParents,
  selectTutors,
} from 'store/user/usersSelector'
import { fetchStudent, updateStudent } from 'store/user/usersThunks'
import { CounselingStudentType, CounselingStudentTypeLabels, Student } from 'store/user/usersTypes'
import EditableTagGroup from './EditableTagGroup'

const { Option } = Select

export type Props = {
  onSubmit?: (student: Student) => void
  onCancel?: () => void
  studentID?: number
  inModal?: boolean
}

export const EditStudentForm = ({ onSubmit, studentID, inModal, onCancel }: Props) => {
  const [form] = Form.useForm()
  const { getFieldValue, setFieldsValue } = form

  // If ID prop is passed, we use it. Otherwise, we attempt to get ID from URL param (for admin platform)
  const paramID = useParams<{ id: string }>().id
  const id = studentID || paramID

  const dispatch = useReduxDispatch()

  const [student, setStudent] = useState<Student>()
  const counselors = useSelector(selectCounselors)
  const tutors = useSelector(selectTutors)
  const parents = useSelector(selectParents)
  const locations = useSelector(selectLocations)
  const resources = useSelector(selectResources)
  const resourceGroups = useSelector(selectResourceGroups)
  const isAdmin = useSelector(selectIsAdmin)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)

  const [loading, setLoading] = useState(false)
  const [currentResourceGroups, setResourceGroups] = useState(student?.visible_resource_groups)
  // Use to programatically insert previously attended high schools on form submission
  const [previousHighSchool, setPreviousHighSchool] = useState('')
  const [highSchools, setHighSchools] = useState([])
  const [tags, setTags] = useState(student?.tags)
  // Cancel or update complete. Close modal and redirect admin
  const cancel = () => {
    if (onCancel) {
      onCancel()
    } else if (isAdmin) {
      History.push(`/students/?student=${student?.slug}`)
    }
  }

  const handleFinish = (values: Store) => {
    const editStudent: Student = { ...values }
    // Programmatically add high_schools to payload
    editStudent.high_schools = highSchools
    editStudent.tags = tags
    editStudent.location_id = editStudent.location
    if (editStudent.gpa === '') delete editStudent.gpa
    const editNotification = values.phone_number
    setLoading(true)
    Promise.all([
      dispatch(updateStudent(Number(id), editStudent)),
      dispatch(
        updateNotificationRecipient(
          student.notification_recipient,
          {
            phone_number: editNotification,
          },
          true,
        ),
      ),
    ])
      .then(() => {
        handleSuccess('Update successful')
        if (onSubmit) {
          onSubmit(student)
        } else if (isAdmin) {
          History.push(`/students/?student=${student.slug}`)
        }
      })
      .catch(() => handleError('Update failed'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    dispatch(fetchStudent(id, Platform.CAS)).then(student => {
      setStudent(student)
      setHighSchools(student.high_schools)
    })
  }, [dispatch, id])

  useEffect(() => {
    if (student) {
      const impliedResources = map(
        filter(resources, ele => student?.visible_resource_groups?.includes(ele.resource_group)),
        'pk',
      )
      setFieldsValue({
        ...student,
        visible_resources: uniq(student.visible_resources.concat(impliedResources)),
      })
      setResourceGroups(student.visible_resource_groups)
    }
  }, [student, setFieldsValue, resources])

  const notificationRecipientID = student?.notification_recipient
  useEffect(() => {
    if (notificationRecipientID) {
      dispatch(fetchNotificationRecipient(notificationRecipientID)).then(data =>
        setFieldsValue({ phone_number: data?.phone_number }),
      )
    }
  }, [dispatch, setFieldsValue, notificationRecipientID])

  // Load student on mounts
  useEffect(() => {
    setLoading(true)
    dispatch(fetchLocations())
    dispatch(fetchStudent(Number(id)))
      .then(student => {
        setHighSchools(student.high_schools)
      })
      .finally(() => setLoading(false))
  }, [dispatch, id])

  useEffect(() => {
    if (student?.tags) {
      setTags([...student.tags])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(student?.tags)])

  /** User (admin) wants to send student an email inviting them to take a diagnostic*/
  const confirmDiagRegistrationEmail = () => {
    const confirm = () =>
      createNotification(student?.notification_recipient, CreateableNotification.DiagnosticInvite)
        .then(() => message.success('Diagnostic invite sent'))
        .catch(() => message.error('Failed to send diagnostic invite'))

    Modal.confirm({
      title: `Send ${getFullName(student)} an email inviting them to register for a diagnostic?`,
      okText: 'Yup - send the email',
      onOk: confirm,
    })
  }

  /**
   * @description Function keeps resources field in-sync when changes are made to resourceGroups field
   */
  const handleResourceGroupChange = (values: number[]) => {
    setResourceGroups(values)
    const impliedResources = map(
      filter(resources, ele => values.includes(ele.resource_group)),
      'pk',
    )

    const currentResources = getFieldValue('visible_resources')
    setFieldsValue({ visible_resources: uniq(currentResources.concat(impliedResources)) })
  }
  if (!student) {
    return null
  }

  let timezoneDescription = ''
  if (student.timezone !== student.set_timezone) {
    timezoneDescription = `We're using the timezone ${student.timezone} because of the location ${student.first_name} is associated with. Override that timezone with a selection here`
  }

  const itemStyle = inModal ? styles.antItemTwoCol : styles.antItemThreeCol

  const adminControls = (
    <>
      <WrappedPersonSelect
        name="counselor"
        label="Counselor"
        entities={counselors}
        isRequired={false}
        wrapperCN={itemStyle}
      />
      <WrappedPersonSelect name="parent" label="Parent" entities={parents} isRequired={false} wrapperCN={itemStyle} />
      <WrappedPersonSelect
        name="tutors"
        label="Tutors"
        entities={tutors}
        isRequired={false}
        mode="multiple"
        wrapperCN={itemStyle}
      />
      <Form.Item label="Resources" name="visible_resources">
        <Select mode="multiple">
          {resources?.map(resource => {
            return (
              <Option
                key={resource.pk}
                value={resource.pk}
                disabled={currentResourceGroups?.includes(resource.resource_group)}
              >
                {currentResourceGroups?.includes(resource.resource_group) ? (
                  <Tooltip
                    title={`To delete this resource, you must first delete associated resource group: ${resource.resource_group_title}`}
                  >
                    <span>{resource.title}</span>
                  </Tooltip>
                ) : (
                  <span>{resource.title}</span>
                )}
              </Option>
            )
          })}
        </Select>
      </Form.Item>
      <Form.Item label="Resource Groups" name="visible_resource_groups">
        <Select mode="multiple" onChange={handleResourceGroupChange} value={currentResourceGroups}>
          {resourceGroups?.map(resourceGroup => (
            <Option key={resourceGroup.pk} value={resourceGroup.pk}>
              {resourceGroup.title}
            </Option>
          ))}
        </Select>
      </Form.Item>
      <WrappedTextInput
        name="admin_note"
        label="Admin Note (not visible to student)"
        isTextArea={true}
        isRequired={false}
        wrapperCN={itemStyle}
      />
      <WrappedSwitch name="is_paygo" label="Is Paygo Student (pays after sessions)" />
      <WrappedTextInput
        name="last_paygo_purchase_id"
        label="Last Order ID (for Paygo)"
        isRequired={false}
        wrapperCN={itemStyle}
      />
      <WrappedTextInput
        name="counselor_pay_rate"
        type="number"
        label="Counselor Pay Rate"
        isRequired={false}
        wrapperCN={itemStyle}
      />
      <WrappedSwitch
        name="is_active"
        label="Is Account Active"
        help="Deactivate/Activate user accounts by toggling this button."
      />
    </>
  )

  return (
    <>
      <h1 className={styles.editStudentFormHeader}>
        <span>
          Edit Student {student.first_name} {student.last_name}:
        </span>
        <Button type="default" onClick={confirmDiagRegistrationEmail}>
          Invite {getFullName(student)} to take Diagnostic
        </Button>
      </h1>
      <Form
        autoComplete="off"
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        className={classNames({ 'form-3-col': !inModal, 'form-2-col': inModal })}
      >
        <WrappedTextInput name="first_name" label="First Name" isRequired={true} wrapperCN={itemStyle} />
        <WrappedTextInput name="last_name" label="Last Name" isRequired={true} wrapperCN={itemStyle} />
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
          wrapperCN={itemStyle}
        />
        <WrappedTextInput name="phone_number" label="Phone Number " isRequired={false} wrapperCN={itemStyle} />
        <WrappedTextInput name="address" label="Address" isRequired={false} wrapperCN={itemStyle} />
        <WrappedTextInput name="address_line_two" label="Address Line 2" isRequired={false} wrapperCN={itemStyle} />
        <WrappedTextInput name="city" label="City" isRequired={false} wrapperCN={itemStyle} />
        <WrappedEntitySelect
          name="state"
          label="State"
          entities={ALL_STATES}
          isRequired={false}
          wrapperCN={itemStyle}
        />
        <WrappedTextInput name="zip_code" label="Zip Code" isRequired={false} wrapperCN={itemStyle} />
        <WrappedTextInput name="high_school" label="Current High School" isRequired={false} wrapperCN={itemStyle} />
        {/* Custom Input for entering previous attended high schools. Entries will be programatically inserted onSubmission */}
        <div className={itemStyle}>
          <div className="ant-col ant-form-item-label">
            <label htmlFor="highSchools">Previous Schools:</label>
          </div>
          <Input
            type="text"
            id="highSchools"
            value={previousHighSchool}
            onChange={e => setPreviousHighSchool(e.target.value)}
            onPressEnter={(e: any) => {
              // Need to prevent form submission onEnter if this field has focus
              e.persist()
              e.preventDefault()
              setHighSchools(prev => prev.concat(previousHighSchool))
              setPreviousHighSchool('')
            }}
            placeholder="Enter a high school"
          />
          <div className="ant-form-item-explain">
            <small>Type a name and then hit enter to add</small>
          </div>
          {!!highSchools?.length && (
            <div className={styles.tagsHighSchools}>
              <span>High Schools:&nbsp;&nbsp;</span>
              {highSchools.map((hs, idx) => (
                <Tag
                  key={hs + idx}
                  closable
                  onClose={(e: any) => {
                    e.preventDefault()
                    // NOTE: This has a bit of an awkward UX when two high schools with the same named are removed
                    setHighSchools(prev => prev.filter(_hs => _hs !== hs))
                  }}
                >
                  {hs}
                </Tag>
              ))}
            </div>
          )}
        </div>
        <WrappedTimezoneSelect name="set_timezone" label="Timezone" extra={timezoneDescription} wrapperCN={itemStyle} />
        <WrappedTextInput name="gpa" label="GPA" wrapperCN={itemStyle} />
        <WrappedTextInput isRequired={false} name="graduation_year" label="Graduation Year" wrapperCN={itemStyle} />
        <div>
          <label>Tags</label>
          <EditableTagGroup tags={tags} setTags={setTags} />
        </div>

        <Form.Item required={true} name="counseling_student_types_list" label="CAP Program/Package">
          <Select autoComplete="off" mode="tags" showSearch={true} loading={loading} placeholder="Select a program">
            {Object.keys(CounselingStudentType).map(k => (
              <Select.Option value={CounselingStudentType[k]} key={k}>
                {CounselingStudentTypeLabels[k]}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <WrappedGenericSelect
          name="location"
          label="Location"
          isRequired={false}
          entities={locations}
          propToDisplay="name"
          wrapperCN={itemStyle}
        />
        <div />
        {isCounselorOrAdmin && <WrappedSwitch name="is_prompt_active" label="Is Prompt Active" />}
        {student.counselor && <WrappedSwitch name="has_access_to_cap" label="Has Access to Counseling Platform" />}
        {isAdmin && adminControls}
        <WrappedFormControl wrapperCN="right-buttons-container" loading={loading} onCancel={cancel} />
      </Form>
    </>
  )
}
export default EditStudentForm
