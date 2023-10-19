// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CalendarOutlined, CheckCircleFilled, VideoCameraOutlined } from '@ant-design/icons'
import { Button, Modal, Skeleton, Tag } from 'antd'
import { CounselorMeetingNoteForm } from 'components/counselor/CounselorMeetingNoteForm'
import { orderBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  selectAgendaItemsForMeeting,
  selectCounselorMeeting,
  selectCOunselorNotesForMeeting,
  selectNextCounselorMeetingForStudent,
} from 'store/counseling/counselingSelectors'
import { fetchAgendaItems, fetchCounselorMeeting, fetchCounselorNotes } from 'store/counseling/counselingThunks'
import { selectVisibleModal, selectVisibleModalProps } from 'store/display/displaySelectors'
import { closeModal, showModal } from 'store/display/displaySlice'
import { CounselorMeetingInfoProps, MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasksForCounselorMeeting } from 'store/task/tasksSelectors'
import { Task } from 'store/task/tasksTypes'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { selectIsCounselor, selectIsParent, selectIsStudentOrParent } from 'store/user/usersSelector'
import styles from './styles/CounselorMeetingInfoModal.scss'

const CounselorMeetingInfoModal = () => {
  const [loadingMeeting, setLoadingMeeting] = useState(false)
  const [loadingNotes, setLoadingNotes] = useState(false)
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.COUNSELOR_MEETING_INFO))
  const props = useSelector(selectVisibleModalProps(MODALS.COUNSELOR_MEETING_INFO)) as CounselorMeetingInfoProps
  const meetingPK = props?.counselorMeetingPK

  const isCounselor = useSelector(selectIsCounselor)
  const isParent = useSelector(selectIsParent)
  const isStudentOrParent = useSelector(selectIsStudentOrParent)

  const counselorMeeting = useSelector(selectCounselorMeeting(meetingPK))
  const nextCounselorMeeting = useSelector(selectNextCounselorMeetingForStudent(counselorMeeting?.student))
  const isNextCounselorMeeting = counselorMeeting && counselorMeeting.pk === nextCounselorMeeting?.pk
  const agendaItems = useSelector(selectAgendaItemsForMeeting(meetingPK))
  const counselorNotes = useSelector(selectCOunselorNotesForMeeting(meetingPK))
  const tasks = orderBy(useSelector(selectTasksForCounselorMeeting(meetingPK)), 'completed')
  const locationsObject = useSelector(selectLocationsObject)

  // We always load agenda items. We load meeting if we need to
  const loadMtg = !counselorMeeting
  const loadAI = agendaItems.length === 0
  const loadCounselorNotes =
    counselorMeeting && counselorNotes.length === 0 && !isCounselor && counselorMeeting?.notes_finalized
  const studentPK = counselorMeeting?.student
  useEffect(() => {
    if (visible && meetingPK) {
      const promises: Promise<any>[] = []
      if (loadMtg) promises.push(dispatch(fetchCounselorMeeting(meetingPK)))
      if (loadAI) promises.push(dispatch(fetchAgendaItems(meetingPK)))
      setLoadingMeeting(!!promises)
      Promise.all(promises).then(() => setLoadingMeeting(false))
    }
  }, [visible, meetingPK, dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (visible && loadCounselorNotes && studentPK) {
      setLoadingNotes(true)
      dispatch(fetchCounselorNotes({ student: studentPK })).then(() => setLoadingNotes(false))
    }
  }, [dispatch, loadCounselorNotes, studentPK, visible])

  const footer = (
    <>
      {isCounselor && (
        <Button
          type="default"
          onClick={() =>
            dispatch(
              showModal({
                modal: MODALS.COUNSELOR_MEETING,
                props: { counselorMeetingID: meetingPK, studentID: counselorMeeting?.student },
              }),
            )
          }
        >
          Edit Meeting...
        </Button>
      )}
      <Button type="default" onClick={() => dispatch(closeModal())}>
        Close
      </Button>
    </>
  )

  // Non-parent clicks on a task. Show. Dat. Modal
  const launchTaskModal = (pk: number) => {
    dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: pk } }))
  }

  // Render a task. Is Read-only for parents, can be clicked to launch task modal for anyone else
  const renderTask = (task: Task) => {
    if (isParent)
      return (
        <li key={task.slug}>
          {task.completed && <CheckCircleFilled />}
          {task.title}
        </li>
      )
    return (
      <li key={task.slug} className="task">
        <a
          role="button"
          tabIndex={0}
          onKeyPress={() => launchTaskModal(task.pk)}
          onClick={() => launchTaskModal(task.pk)}
        >
          <span className="task-text">
            {task.completed && (
              <>
                <CheckCircleFilled />
                &nbsp;
              </>
            )}
            {task.title}
          </span>
        </a>
      </li>
    )
  }

  // We show schedule/reschedule for student/parent iff: Meeting is next meeting or meeting is scheduled and in future
  const showSchedule =
    isStudentOrParent &&
    (isNextCounselorMeeting ||
      (counselorMeeting?.start && moment(counselorMeeting.start).isAfter(moment().add(1, 'd'))))

  return (
    <Modal
      visible={visible}
      className={styles.counselorMeetingInfoModal}
      footer={footer}
      width={720}
      onCancel={() => dispatch(closeModal())}
    >
      {loadingMeeting && <Skeleton />}
      {counselorMeeting && (
        <>
          <div className="header">
            <h2 className="f-title">{counselorMeeting.title}</h2>
            {counselorMeeting.location ? (
              <div className="location-info">
                <h2>Location: {locationsObject[counselorMeeting.location]?.name}</h2>
              </div>
            ) : (
              <div className="location-info">
                <h2>Remote Meeting</h2>
              </div>
            )}

            <h3 className="f-subtitle-1">
              {counselorMeeting.student_name}&nbsp;&bull;&nbsp;
              {counselorMeeting.start ? moment(counselorMeeting.start).format('MMM Do h:mma') : 'Unscheduled'}
            </h3>
            {showSchedule && (
              <div className="center reschedule">
                <Button
                  type="link"
                  onClick={() =>
                    dispatch(
                      showModal({
                        modal: MODALS.SCHEDULE_COUNSELOR_MEETING,
                        props: { meetingID: counselorMeeting.pk },
                      }),
                    )
                  }
                >
                  <CalendarOutlined />
                  {counselorMeeting.start ? 'Reschedule' : 'Schedule'} Meeting
                </Button>
              </div>
            )}
            {counselorMeeting.zoom_url && counselorMeeting.start && moment(counselorMeeting.start).isAfter() && (
              <div className="center">
                <a href={counselorMeeting.zoom_url} target="_blank" rel="noreferrer" className="zoom-tag">
                  <Tag color="blue">
                    <VideoCameraOutlined />
                    &nbsp; Zoom: {counselorMeeting.zoom_url}
                  </Tag>
                </a>
              </div>
            )}
          </div>
          <div className="agenda-items">
            <h3 className="f-subtitle-2">Description</h3>
            {counselorMeeting.description}
          </div>
          {isCounselor && agendaItems.length > 0 && (
            <div className="agenda-items">
              <h3 className="f-subtitle-2">Agenda Items</h3>
              <ul>
                {agendaItems.map(ai => (
                  <li key={ai.slug}>
                    <strong>{ai.counselor_title}</strong>&nbsp;-&nbsp;
                    {ai.counselor_instructions}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="tasks">
            <h3 className="f-subtitle-2">Tasks</h3>
            {tasks.length === 0 && <p className="help center">No tasks for this meeting...</p>}
            <ul>{tasks.map(renderTask)}</ul>
          </div>
          {counselorMeeting.notes_finalized && loadingNotes && <Skeleton />}
          {counselorMeeting.notes_finalized && !loadingNotes && (
            <div className="counselor-notes">
              <h3 className="f-subtitle-2">Notes</h3>
              {counselorNotes.length === 0 && <p className="help center">No notes for this meeting...</p>}
              {counselorNotes.map(n => (
                <CounselorMeetingNoteForm
                  isReadOnly
                  counselorMeetingID={counselorMeeting.pk}
                  counselorNote={n}
                  key={n.slug}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
export default CounselorMeetingInfoModal
