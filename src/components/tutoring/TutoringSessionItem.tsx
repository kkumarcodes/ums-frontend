// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CalendarOutlined,
  CloseCircleOutlined,
  EllipsisOutlined,
  FilePdfOutlined,
  LoadingOutlined,
  CreditCardOutlined,
  SendOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Button, Dropdown, Menu, message, Tag, Tooltip } from 'antd'
import { handleError, handleSuccess } from 'components/administrator'
import { CalendarIcon } from 'components/common/CalendarIcon'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { resendTutoringSessionNote, updateStudentTutoringSession } from 'store/tutoring/tutoringThunks'
import { StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { selectIsParent, selectIsStudent, selectIsTutor } from 'store/user/usersSelector'
import { EditableText } from 'components/common/FormItems'
import { RootState } from 'store/rootReducer'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { find } from 'lodash'

interface OwnProps {
  session: StudentTutoringSession
  displayCount: number
  currentItem: number
}

const TutoringSessionItem = (props: OwnProps) => {
  const sessionPassed = moment(props.session.end) < moment()
  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const isTutor = useSelector(selectIsTutor)
  const isPaygo = useSelector((state: RootState) => state.user.students[props.session.student].is_paygo)
  const locationsObject = useSelector(selectLocationsObject)

  // True if session is for indiviual tutor who does not allow students to book directly with them
  const preventRescheduleByTutorSettings = useSelector(
    (state: RootState) =>
      props.session.individual_session_tutor &&
      state.user.tutors[props.session.individual_session_tutor] &&
      !state.user.tutors[props.session.individual_session_tutor].students_can_book,
  )

  // Student is unable to reschedule or cancel an individual tutoring session if start time less than 1 day from now
  const isDisabled = moment(props.session.start).diff(moment(), 'd', true) < 1 && isStudent
  // Only show cancel for individual tutoring sessions, not completed nor cancelled nor passed
  const showCancel =
    (props.session.individual_session_tutor || props.session.group_tutoring_session) &&
    !sessionPassed &&
    !props.session.cancelled
  // Only show cancel for individual tutoring sessions, not completed nor cancelled nor passed
  let showReschedule = props.session.individual_session_tutor && !sessionPassed
  if ((isParent || isStudent) && preventRescheduleByTutorSettings) {
    showReschedule = false
  }
  if (props.session.is_tentative) {
    showReschedule = false
  }

  const dispatch = useReduxDispatch()
  const [saving, setSaving] = useState(false)

  function actionMenuClick(key: string) {
    if (key === 'cancel') {
      const cancelledSession = {
        set_cancelled: true,
        missed: false,
      }
      setSaving(true)
      dispatch(updateStudentTutoringSession(props.session.pk, cancelledSession))
        .then(() => {
          handleSuccess('Session cancelled!')
        })
        .catch(err => {
          handleError('Failed to cancel session.')
        })
        .finally(() => setSaving(false))
    }
    if (key === 'reschedule') {
      dispatch(
        showModal({
          props: {
            studentID: props.session.student,
            tutorID: props.session.individual_session_tutor,
            sessionID: props.session.pk,
            sessionDetails: props.session,
          },
          modal: MODALS.EDIT_TUTORING_SESSION,
        }),
      )
    }
  }

  const renderTooltipOrText = (text: string) =>
    isDisabled ? (
      <Tooltip title={`24 hours' notice is required to ${text.toLowerCase()}`}>
        <span>{text}</span>
      </Tooltip>
    ) : (
      <span>{text}</span>
    )

  const actionMenu = (
    <Menu onClick={e => actionMenuClick(e.key)}>
      {showReschedule && (
        <Menu.Item key="reschedule" disabled={isDisabled}>
          <CalendarOutlined />
          {renderTooltipOrText('Reschedule')}
        </Menu.Item>
      )}
      {showCancel && (
        <Menu.Item key="cancel" disabled={isDisabled}>
          <CloseCircleOutlined />
          {renderTooltipOrText('Cancel')}
        </Menu.Item>
      )}
    </Menu>
  )

  // Past sessions have different date display
  const displayDate = props.session.cancelled ? (
    <>
      <CalendarIcon date={moment(props.session.start).toDate()} />
      <div className="item-date-inner">{moment(props.session.start).format('ddd, MMM D')}</div>
    </>
  ) : (
    <>
      <CalendarIcon date={moment(props.session.start).toDate()} hasTime={true} />
      <div className={`item-date-inner ${!props.session.missed || props.session.cancelled ? 'completed' : ''}`}>
        <div className="date-time">
          {moment(props.session.start).format('ddd, MMM D')}
          <span className="second-time">{moment(props.session.start).format('@ h:mm a')}</span>
        </div>
      </div>
    </>
  )

  const resendNote = () => {
    if (props.session.tutoring_session_notes && props.session.pk && props.session.individual_session_tutor) {
      const notePayload = {
        student_tutoring_session: props.session.pk,
        author: props.session.individual_session_tutor,
      }
      try {
        message.info('Sending session note', 0.75)
        dispatch(resendTutoringSessionNote(props.session.tutoring_session_notes, notePayload)).then(() => {
          message.success('Yay! Note was resent!')
        })
      } catch {
        message.error('Note did not resent')
      }
    } else {
      message.warning('Note could not resent')
    }
  }

  // Show modal to pay for session
  const initiatePaygoPayment = () => {
    dispatch(showModal({ modal: MODALS.PAYGO_PURCHASE, props: { individualTutoringSessionID: props.session.pk } }))
  }

  // Update note on session (that was created when session was created. NOT the SessionNote)
  const updatePreSessionNote = (note: string) => {
    dispatch(updateStudentTutoringSession(props.session.pk, { note }))
  }

  const showPaymentOption =
    isPaygo &&
    props.session.paygo_tutoring_package &&
    props.session.individual_session_tutor &&
    !props.session.paygo_transaction_id &&
    (isStudent || isParent)

  return (
    <>
      <div
        className={`task-session-list-item ${
          props.currentItem === props.displayCount ? 'last-task-session-list-item' : ''
        }`}
      >
        <div className="item-date">{displayDate}</div>
        <div className="item-title">
          <div className="item-title-text">{props.session.title}</div>
          <div className="item-title-bottom">
            {!isStudent && !isParent && (
              <div className="item-edit-notes">
                <EditableText
                  name="note"
                  label="Note"
                  value={props.session.note}
                  onUpdate={updatePreSessionNote}
                  wrapperCN="session-note"
                  isFormItem={false}
                />
              </div>
            )}
            {props.session.missed && (
              <Tag color="red" className="item-tag item-missed-tag">
                Missed&nbsp;&nbsp;
                <span role="img" aria-label="sad">
                  😞
                </span>
              </Tag>
            )}
            {props.session.is_tentative && (
              <Tag color="red" className="item-tag">
                Tentative
              </Tag>
            )}
            {props.session.zoom_url &&
              moment(props.session.start).isBefore(moment().add(12, 'h')) &&
              !moment(props.session.end).isBefore(moment()) && (
                <Tag color="blue" className="item-tag item-zoom-tag">
                  <a href={props.session.zoom_url} target="_blank" rel="noopener noreferrer">
                    <VideoCameraOutlined /> Click Here to Open Zoom
                  </a>
                </Tag>
              )}
            {props.session.zoom_url && moment(props.session.start).isAfter(moment().add(12, 'h')) && (
              <Tag color="blue" className="item-tag item-zoom-tag">
                <VideoCameraOutlined /> Check here for Zoom Link before your session
              </Tag>
            )}
            {props.session.tutoring_session_notes && props.session.notes_url && (
              <>
                <Button
                  size="small"
                  type="default"
                  href={props.session.notes_url}
                  target="_blank"
                  className="item-button item-view-notes"
                >
                  <FilePdfOutlined /> View Notes
                </Button>
                {isTutor && (
                  <Button
                    size="small"
                    type="default"
                    onClick={resendNote}
                    target="_blank"
                    className="item-button item-resend-notes"
                  >
                    <SendOutlined /> Resend Notes
                  </Button>
                )}
              </>
            )}
            {showPaymentOption && (
              <Button size="small" type="default" onClick={initiatePaygoPayment}>
                <CreditCardOutlined /> Pay For Session
              </Button>
            )}
          </div>
        </div>
        <div className="item-actions">
          {(showCancel || showReschedule) && (
            <Dropdown overlay={actionMenu} trigger={['click']}>
              {saving ? <LoadingOutlined /> : <EllipsisOutlined />}
            </Dropdown>
          )}
        </div>
      </div>
      <div>
        <h3>Location: {props.session.location !== null ? locationsObject[props.session.location]?.name : 'Remote'}</h3>
      </div>
    </>
  )
}

export default TutoringSessionItem
