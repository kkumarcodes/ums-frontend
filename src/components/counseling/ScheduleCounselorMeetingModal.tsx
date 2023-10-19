// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { EditOutlined } from '@ant-design/icons'
import { Button, message, Modal, Select } from 'antd'
import SessionSelector from 'components/tutoring/CreateTutoringSessionModal/IndividualTutoringSessionSelector'
import moment, { Moment } from 'moment-timezone'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeeting } from 'store/counseling/counselingSelectors'
import { updateCounselorMeeting } from 'store/counseling/counselingThunks'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { MODALS, ScheduleCounselorMeetingProps } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { selectStudent } from 'store/user/usersSelector'
import styles from './styles/ScheduleCounselorMeetingModal.scss'

const DEFAULT_DURATION = 30
const ERROR_MESSAGE_DURATION = 15

const NULL_LOCATION_STRING = 'null'

const ScheduleCounselorMeetingModal = () => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.SCHEDULE_COUNSELOR_MEETING))
  const props = useSelector(selectVisibleModalProps(MODALS.SCHEDULE_COUNSELOR_MEETING)) as ScheduleCounselorMeetingProps
  const meeting = useSelector(selectCounselorMeeting(props?.meetingID))
  const student = useSelector(selectStudent(meeting?.student))
  const [selectedTime, setSelectedTime] = useState<Moment>()
  const locationsObject = useSelector(selectLocationsObject)
  const [sessionLocation, setSessionLocation] = useState<number | 'null'>()

  // Clear selected time when modal becomes visible
  useEffect(() => {
    if (visible) setSelectedTime(undefined)
    if (meeting) setSessionLocation(meeting?.location || 'null')
  }, [visible, meeting, setSessionLocation])

  // Time selected from our calendly-like selector
  const onSelectTime = (selectedTimes: Moment[]) => setSelectedTime(selectedTimes[0])

  // Confirming selected time
  const onConfirm = async () => {
    setLoading(true)
    if (!meeting || !selectedTime) {
      throw new Error(`Missing required details to schedule counselor meeting ${props.meetingID}`)
    }

    // This looks nuts but it works.
    // If a counselor has set a `duration_minutes` ... great that is our source of truth for the meeting duration
    // If not, then we check if the meeting already has a `start` and `end` time and we derive the duration from the diff
    // Otherwise, use the default 30 minutes
    const duration =
      meeting.duration_minutes ||
      (meeting.start && meeting.end && moment.duration(moment(meeting.end).diff(moment(meeting.start))).minutes()) ||
      DEFAULT_DURATION

    try {
      sessionLocation !== NULL_LOCATION_STRING
        ? await dispatch(
            updateCounselorMeeting(meeting.pk, {
              start: moment(selectedTime).toISOString(),
              end: moment(selectedTime).add(duration, 'm').toISOString(),
              location: sessionLocation,
            }),
          )
        : await dispatch(
            updateCounselorMeeting(meeting.pk, {
              start: moment(selectedTime).toISOString(),
              end: moment(selectedTime).add(duration, 'm').toISOString(),
            }),
          )
      setLoading(false)
      setSelectedTime(undefined)
      dispatch(closeModal())
    } catch (err) {
      message.warn(err.response?.data?.detail ?? 'Unable to save meeting', ERROR_MESSAGE_DURATION)
      setLoading(false)
    }
  }

  const renderLocationPreference = () => {
    return (
      <div className="location-bar center">
        <label>Location:</label>
        <Select onChange={setSessionLocation} value={sessionLocation} className="location-select">
          <Select.Option value={student?.location} key={student?.location}>
            {student && `${locationsObject[student?.location]?.name} ` + `(In-Person)`}
          </Select.Option>
          <Select.Option value={NULL_LOCATION_STRING} key={NULL_LOCATION_STRING}>
            Remote
          </Select.Option>
        </Select>
      </div>
    )
  }

  return (
    <Modal
      visible={visible}
      className={styles.scheduleCounselorMeetingModal}
      title={`Schedule ${meeting?.title}`}
      onCancel={() => dispatch(closeModal())}
      okText="Confirm Time"
      okButtonProps={{ disabled: !selectedTime, loading }}
      onOk={onConfirm}
    >
      <div className="selection-box">
        {renderLocationPreference()}
        {!selectedTime && (
          <SessionSelector
            duration={meeting?.duration_minutes ?? undefined}
            onConfirm={onSelectTime}
            availableMinutes={1000}
            disallowRepeat
            counselorID={student?.counselor}
            sessionLocation={sessionLocation}
          />
        )}
      </div>

      {selectedTime && (
        <div className="selected-time-container center">
          <label>You selected:</label>&nbsp;
          {moment(selectedTime).format('MMM Do h:mmaz')}
          &nbsp;
          <Button type="link" onClick={() => setSelectedTime(undefined)}>
            <EditOutlined /> Edit
          </Button>
        </div>
      )}
    </Modal>
  )
}
export default ScheduleCounselorMeetingModal
