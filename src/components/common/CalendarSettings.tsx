// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarOutlined, CheckCircleFilled } from '@ant-design/icons'
import { Button, Col, Form, message } from 'antd'
import { useForm } from 'antd/lib/form/Form'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectActiveUser, selectCounselor, selectTutor } from 'store/user/usersSelector'
import { updateCounselor, updateTutor } from 'store/user/usersThunks'
import { Counselor, UserType } from 'store/user/usersTypes'
import { WrappedSwitch, WrappedTextInput, WrappedTimezoneSelect } from './FormItems'
import styles from './styles/CalendarSettings.scss'
import WisernetSection from './UI/WisernetSection'

// URL to GET to authenticate against Outlook API
const OUTLOOK_AUTH_URL = '/user/outlook/signin/'

const CalendarSettings = () => {
  const dispatch = useReduxDispatch()
  const cwUser = useSelector(selectActiveUser)
  const [form] = Form.useForm();
  const [savingForm, setSavingForm] = useState(false)
  const userType = cwUser?.userType
  const hasOutlookConnection = useSelector((root: RootState) => {
    if (cwUser?.userType === UserType.Counselor) return root.user.counselors[cwUser.cwUserID]?.has_connected_outlook
    if (cwUser?.userType === UserType.Tutor) return root.user.tutors[cwUser.cwUserID]?.has_connected_outlook
    return false
  })
  const counselor = useSelector(selectCounselor(userType === UserType.Counselor ? cwUser?.cwUserID : undefined))
  const tutor = useSelector(selectTutor(userType === UserType.Tutor ? cwUser?.cwUserID : undefined))
  const [timezone, setTimezone] = useState('')

  const counselorTimezone = counselor?.timezone
  useEffect(() => {
    if (counselorTimezone) setTimezone(counselorTimezone)
  }, [counselorTimezone])

  const userID = cwUser?.userID
  useEffect(() => {
    if (counselor) form.setFieldsValue(counselor)
    else if (tutor) form.setFieldsValue(tutor)
  }, [userID, form]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update timezone and autosave
  const updateTimezone = (e: string) => {
    if (!counselor) throw new Error('Can only update timezone for counselor!')
    setTimezone(e)
    dispatch(updateCounselor(counselor.pk, { set_timezone: e }))
  }

  const submitForm = async () => {
    // If the active user is a tutor, then we just save their include_all_availability_for_remote_sessions
    // setting
    const data: Partial<Counselor> = form.getFieldsValue()
    if (!counselor && tutor) {
      setSavingForm(true)
      await dispatch(updateTutor(tutor.pk, data))
      message.success('Calendar settings saved')
      setSavingForm(false)
      return
    }

    try {
      await form.validateFields()
    } catch {
      return
    }

    if (!counselor) return

    data.minutes_between_meetings = data.minutes_between_meetings || 0
    setSavingForm(true)
    await dispatch(updateCounselor(counselor.pk, data))
    message.success('Calendar settings saved')
    setSavingForm(false)
  }

  const renderOutlookIntegration = () => {
    if (!cwUser) return ''

    const copy =
      userType === UserType.Counselor
        ? 'Meetings created with your students will be synced to your Outlook calendar.'
        : 'Tutoring sessions will appear on your Outlook calendar, and other events on your Outlook calendar will be used to determine your availability in UMS.'
    if (hasOutlookConnection) {
      return (
        <p>
          <CheckCircleFilled />
          &nbsp;
          {copy}
        </p>
      )
    }
    return (
      <>
        <Button type="primary" href={OUTLOOK_AUTH_URL} target="_blank">
          <CalendarOutlined />
          Connect Outlook
        </Button>
        <p>{copy}</p>
      </>
    )
  }
  return (
    <div className={styles.calendarSettings}>
      <WisernetSection title="Outlook Connection">
        <div className="outlook-integration">{renderOutlookIntegration()}</div>
        {counselor && (
          <div className="timezone-container">
            <label>Timezone:</label>&nbsp;
            <WrappedTimezoneSelect name="timezone" isFormItem={false} value={timezone} onChange={updateTimezone} />
            <p className="help">
              Timezone used for scheduling within UMS. It is important that this timezone match the timezone of
              your Outlook calendar
            </p>
          </div>
        )}
      </WisernetSection>
      <WisernetSection title="Calendar Settings" className="buffer-settings">
        <Form form={form} layout="vertical" className="form-2-col" onFinish={submitForm}>
          {counselor && (
            <>
              <Col span={6}>
                <WrappedTextInput
                  style={{ width: '90%' }}
                  required={false}
                  isRequired={false}
                  allowClear
                  name="minutes_between_meetings"
                  type="number"
                  label="Buffer between meetings (minutes)"
                />
                <p className="help">
                  Give yourself time between student meetings. If set, students will only be able to schedule meetings
                  this many minutes after a previous UMS meeting you have.
                </p>
              </Col>
              <Col span={6}>
                <WrappedTextInput
                  style={{ width: '90%' }}
                  required={false}
                  allowClear
                  placeholder="Enter the minimum # of hours"
                  name="student_schedule_meeting_buffer_hours"
                  type="number"
                  label="Min # of hours to schedule meeting"
                />
                <p className="help">Students can only schedule meetings at least this many hours in the future.</p>
              </Col>
              <Col span={6}>
                <WrappedTextInput
                  style={{ width: '90%' }}
                  required={false}
                  allowClear
                  placeholder="Enter the minimum # of hours"
                  name="student_reschedule_hours_required"
                  type="number"
                  label="Min # of hours to reschedule/cancel meeting"
                />
                <p className="help">
                  Students can only reschedule or cancel meetings that are at least this many hours in the future.
                </p>
              </Col>
              <Col span={6}>
                <WrappedTextInput
                  style={{ width: '90%' }}
                  required={false}
                  allowClear
                  name="max_meetings_per_day"
                  type="number"
                  label="Max meetings per day"
                />
                <p className="help">
                  The maximum number of UMS student meetings that can be scheduled in one day. Once this limit is
                  reached for a day, students won&apos;t be able to schedule additional meetings with you.
                </p>
              </Col>
            </>
          )}
          <Col span={6}>
            <WrappedSwitch
              name="include_all_availability_for_remote_sessions"
              label="Include in-person availability for students scheduling remote meetings"
            />
            <p className="help">
              When on, students will see both your remote and in-person availability when they are scheduling remote
              meetings. When off, students will see <i>only</i> your remote availability when scheduling remote
              meetings.
            </p>
          </Col>
          <div className="save-button">
            <Button type="primary" onClick={submitForm}>
              Save Calendar Settings
            </Button>
          </div>
        </Form>
      </WisernetSection>
    </div>
  )
}
export default CalendarSettings
