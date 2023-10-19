// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { capitalize, map, startCase, throttle, values } from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import Modal from 'antd/lib/modal/Modal'
import { selectVisibleModal, selectActiveModal } from 'store/display/displaySelectors'
import { MODALS, SendCounselorMeetingNotesProps } from 'store/display/displayTypes'
import { closeModal, showModal } from 'store/display/displaySlice'
import ReactQuill from 'react-quill'
import { RichTextEditor } from 'components/common/RichTextEditor'
import { Button, Checkbox, Input, message, Spin, Switch, Tooltip } from 'antd'
import { ArrowLeftOutlined, SendOutlined, SyncOutlined } from '@ant-design/icons'
import { sendCounselorMeetingNotes, updateCounselorMeeting } from 'store/counseling/counselingThunks'
import { getFullName } from 'components/administrator'
import { CounselorMeeting, CounselorNote, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import moment from 'moment'
import { fetchTasksForStudent } from 'store/task/tasksThunks'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { Task } from 'store/task/tasksTypes'
import MultiFileUpload, { MultiFileUploadMode } from 'components/common/MultiFileUpload'
import { FileUpload } from 'store/common/commonTypes'
import { selectCounselorMeeting, selectNextCounselorMeetingForStudent } from 'store/counseling/counselingSelectors'
import { selectCounselor, selectStudent } from 'store/user/usersSelector'
import styles from './styles/CounselorMeetingNoteMessageModal.scss'

const SAVE_DEBOUNCE = 1000

const CounselorMeetingNoteMessageModal = () => {
  const dispatch = useReduxDispatch()
  const visible = useSelector(selectVisibleModal(MODALS.SEND_COUNSELOR_MEETING_NOTES))
  const props = useSelector(selectActiveModal)?.modalProps as SendCounselorMeetingNotesProps
  const counselorMeetingID = props?.counselorMeetingID

  const editorRef = useRef<ReactQuill>(null)
  const [sending, setSending] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [subject, setSubject] = useState('')
  const [includeUpcomingTasks, setIncludeUpcomingTasks] = useState(true)
  const [includeCompletedTasks, setIncludeCompletedTasks] = useState(true)
  const [upcomingTasks, setUpcomingTasks] = useState<number[]>([])
  const [completedTasks, setCompletedTasks] = useState<number[]>([])
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])
  const [sendToStudent, setSendToStudent] = useState(true)
  const [sendToParent, setSendToParent] = useState(true)
  const [includeScheduleLink, setIncludeScheduleLink] = useState(true)
  // When the meeting changes, we update our note. But then
  const [note, setNote] = useState('')

  const counselorMeeting = useSelector(selectCounselorMeeting(counselorMeetingID))

  const counselorMeetingNotes = useSelector((state: RootState) =>
    counselorMeetingID
      ? values(state.counseling.counselorNotes).filter(
          n => n.counselor_meeting === counselorMeetingID && n.category !== CounselorNoteCategory.Private,
        )
      : [],
  )
  const meetingStudent = counselorMeeting?.student
  const nextCounselorMeeting = useSelector(selectNextCounselorMeetingForStudent(meetingStudent, counselorMeetingID))
  const student = useSelector(selectStudent(meetingStudent))
  const counselor = useSelector(selectCounselor(student?.counselor))
  const studentTasks = useSelector(selectTasksForStudent(meetingStudent))
  const studentName = student ? getFullName(student) : ''

  // When we get a new counselor meeting, we update our note to match the
  // existing message note or the combination of counselor's notes on meeting

  const meetingNote = counselorMeeting?.notes_message_note
  const meetingSubject = counselorMeeting?.notes_message_subject
  const meetingStart = counselorMeeting?.start ? moment(counselorMeeting.start) : null
  const meetingExists = Boolean(counselorMeeting)

  // When modal becomes visible, we load tasks for student
  useEffect(() => {
    if (visible && meetingStudent) {
      setLoadingTasks(true)
      dispatch(fetchTasksForStudent(meetingStudent))
        .catch(() => message.warn('Could not load tasks for student'))
        .then((tasks: Task[]) => {
          // We include all tasks by default, unless we've saved a subset of tasks or have already sent
          // note with no tasks
          if (counselorMeeting?.notes_message_upcoming_tasks.length || counselorMeeting?.notes_message_last_sent) {
            setUpcomingTasks(counselorMeeting.notes_message_upcoming_tasks || [])
          } else {
            const upcoming = map(
              tasks.filter(t => !t.completed && t.due),
              'pk',
            )
            setUpcomingTasks(upcoming)
          }
          if (counselorMeeting?.notes_message_completed_tasks.length || counselorMeeting?.notes_message_last_sent) {
            setCompletedTasks(counselorMeeting.notes_message_completed_tasks || [])
          } else {
            setCompletedTasks(
              map(
                tasks.filter(t => counselorMeeting?.tasks.includes(t.pk) && t.completed),
                'pk',
              ),
            )
          }
        })
        .finally(() => setLoadingTasks(false))
    }
  }, [dispatch, meetingStudent, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  // Helper method that takes counselor notes and constructs paragraphs with bold headings
  // Aslo pulls in counselor's header and signature
  const constructNotesWithHeadings = (counselorMeetingNotes: CounselorNote[]) => {
    const notesWithHeadings = counselorMeetingNotes.map(
      n => `<p><h4>${capitalize(startCase(n.category))}</h4>${n.note.replace(/\r\n|\r|\n/g, '<br>')}</p>`,
    )
    if (counselor) {
      return [counselor?.email_header, ...notesWithHeadings, counselor.email_signature].join('<br/><br/>')
    }
    return notesWithHeadings.join('<br/><br/>')
  }

  // When modal becomes visible, we set note based on existing note on counselorMeeting or by
  // compiling notes for the meeting if a note has not already been saved to counselor meeting
  useEffect(() => {
    if (visible && meetingExists) {
      const newNote = meetingNote || constructNotesWithHeadings(counselorMeetingNotes)
      // If upcoming and completed tasks already saved, then we filter out any who may no longer qualify
      // as incomplete/complete
      setUpcomingTasks(counselorMeeting?.notes_message_upcoming_tasks || [])
      setCompletedTasks(counselorMeeting?.notes_message_completed_tasks || [])
      setFileUploads(counselorMeeting?.file_uploads || [])
      setIncludeScheduleLink(true)
      if (meetingSubject) {
        setSubject(meetingSubject)
      } else {
        setSubject(
          meetingStart ? `Notes from our meeting on ${meetingStart.format('MMM Do')}` : 'Notes from our recent meeting',
        )
      }
      // We set note last because it actually triggers onChange from Quill
      setNote(newNote)
    }
  }, [visible, meetingExists]) // eslint-disable-line react-hooks/exhaustive-deps
  // We aren't reactive to meetingNote, lest we re-run this hook every time note saves, causing an
  // infinite loop 😬

  // On close we need to reset our state
  const resetState = () => {
    setSubject('')
    setNote('')
    setUpcomingTasks([])
    setCompletedTasks([])
    setFileUploads([])
    setIncludeScheduleLink(true)
  }

  // Counselor can manually pull in their meeting notes to overwrite our note
  const doOverwriteWithNotes = () => setNote(constructNotesWithHeadings(counselorMeetingNotes))

  // We autosave our notes and subject
  const doAutosave = useCallback(
    throttle(
      (
        note: string,
        subject: string,
        notes_message_upcoming_tasks?: number[],
        notes_message_completed_tasks?: number[],
        file_uploads?: string[],
      ) => {
        const data: Partial<CounselorMeeting> = {
          notes_message_note: note,
          notes_message_subject: subject,
          start: counselorMeeting?.start,
          end: counselorMeeting?.end,
        }
        if (notes_message_completed_tasks) data.notes_message_completed_tasks = notes_message_completed_tasks
        if (notes_message_upcoming_tasks) data.notes_message_upcoming_tasks = notes_message_upcoming_tasks
        if (file_uploads) data.update_file_uploads = file_uploads
        return dispatch(updateCounselorMeeting(counselorMeetingID, data, false))
      },
      SAVE_DEBOUNCE,
    ),
    [counselorMeetingID, visible],
  )

  // Helper functions for updating note and subject to perform autosave
  const updateSubject = (newSubject: string) => {
    setSubject(newSubject)
    if (visible) {
      doAutosave(note || (meetingNote ?? ''), newSubject)
    }
  }
  const updateNote = (newNote: string) => {
    setNote(newNote)
    if (visible) {
      doAutosave(newNote, subject || (meetingSubject ?? ''))
    }
  }
  // And a helper method to update selected tasks
  const toggleTask = (taskPK: number, completed: boolean) => {
    const stateArray = completed ? completedTasks : upcomingTasks
    const setter = completed ? setCompletedTasks : setUpcomingTasks
    const exists = stateArray.includes(taskPK)
    const updatedVal = exists ? stateArray.filter(x => x !== taskPK) : [...stateArray, taskPK]
    setter(updatedVal)
    // Note that state isn't updatd synchronously within the JS event loop, so we can't use updatedTasks
    // and completedTasks here
    doAutosave(note, subject, completed ? undefined : updatedVal, completed ? updatedVal : undefined)
  }

  // Setter for fileUPloads that fires autosave
  const updateFileUploads = (fileUploads: FileUpload[]) => {
    setFileUploads(fileUploads)
    doAutosave(note, subject, undefined, undefined, map(fileUploads, 'slug'))
  }

  // Close this modal and show the meeting notes modal
  const onReturnToNotes = () => {
    dispatch(closeModal())
    dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_NOTE, props: { counselorMeetingID } }))
  }

  // Send our notes
  const onFinalizeNotes = async (send: boolean) => {
    setSending(true)
    try {
      // First we do one more autosave
      const saveUpcomingTasks = includeUpcomingTasks ? upcomingTasks : []
      const saveCompletedTasks = includeCompletedTasks ? completedTasks : []
      await doAutosave(
        editorRef?.current?.getEditorContents(),
        subject,
        saveUpcomingTasks,
        saveCompletedTasks,
        map(fileUploads, 'slug'),
      )

      if (send) {
        // And now we actually send the notes
        const calculatedSendToParent = Boolean(student?.parent && sendToParent)
        await dispatch(
          sendCounselorMeetingNotes(
            counselorMeetingID,
            sendToStudent || !calculatedSendToParent,
            calculatedSendToParent,
            includeScheduleLink && nextCounselorMeeting && !nextCounselorMeeting.start
              ? nextCounselorMeeting.pk
              : undefined,
          ),
        )
      } else {
        // We just mark notes as finalized but don't actually send
        await dispatch(
          updateCounselorMeeting(counselorMeetingID, {
            start: counselorMeeting?.start,
            end: counselorMeeting?.end,
            notes_finalized: true,
          }),
        )
      }
    } catch (err) {
      message.warn('Unable to send notes')
    } finally {
      message.success(send ? 'Notes sent' : 'Notes finalized and were NOT sent')
      setSending(false)
      dispatch(closeModal())
    }
  }

  // Helper method to render checkboxes for tasks. Re-used for completed and
  // incomplete tasks
  const renderTasks = (completed: boolean) => {
    const stateArray = completed ? completedTasks : upcomingTasks
    const tasks = completed
      ? studentTasks.filter(t => counselorMeeting?.tasks.includes(t.pk) && t.completed)
      : studentTasks.filter(t => t.due && !t.completed)
    return (
      <div className="tasks-container">
        {tasks.map(t => (
          <Checkbox key={t.slug} onChange={() => toggleTask(t.pk, completed)} checked={stateArray.includes(t.pk)}>
            {t.title}
          </Checkbox>
        ))}
      </div>
    )
  }

  const footer = (
    <div className="footer">
      <Button type="link" onClick={onReturnToNotes} loading={sending}>
        <ArrowLeftOutlined /> Return To Meeting Notes
      </Button>
      <Tooltip
        title={
          counselorMeeting?.notes_finalized
            ? 'Notes already finalized'
            : 'Students and parents can only see finalized notes. Use this button to make these notes visible in UMS without emailing the notes to parent/student.'
        }
      >
        <Button
          disabled={counselorMeeting?.notes_finalized}
          type="default"
          onClick={() => onFinalizeNotes(false)}
          loading={sending}
        >
          Finalize Without Sending
        </Button>
      </Tooltip>
      <Button type="primary" onClick={() => onFinalizeNotes(true)} loading={sending}>
        {counselorMeeting?.notes_finalized ? 'Send Notes' : 'Finalize and Send Notes'}
        &nbsp;
        <SendOutlined />
      </Button>
    </div>
  )

  return (
    <Modal
      width={720}
      visible={visible}
      title={`Send notes for ${counselorMeeting?.title}`}
      className={styles.counselorMeetingNoteMessageModal}
      footer={footer}
      onCancel={() => dispatch(closeModal())}
      afterClose={resetState}
    >
      <div className="modal-content">
        <div className="subject-container form-flex">
          <label>Subject</label>
          <Input value={subject} onChange={e => updateSubject(e.target.value)} />
        </div>
        <div className="rich-text-container">
          <p className="modal-instructions">
            Below you&apos;ll find all of the notes you already saved for this meeting, along with your default email
            opening and signature (which you can edit on your Account page). Feel free to edit this message - it will
            autosave - and then send it when you are finished.
          </p>
          <RichTextEditor
            ref={editorRef}
            placeholder="Add your notes here..."
            initialHtml={counselorMeeting?.notes_message_note || ''}
            value={note}
            onChange={updateNote}
          />
          <div className="sync-notes right">
            <Button type="link" size="small" onClick={doOverwriteWithNotes}>
              <SyncOutlined />
              Replace with my meeting notes
            </Button>
          </div>
        </div>
        <div className="tasks-outer-container">
          <p className="modal-instructions">
            You can include a list of completed and upcoming tasks below the message in your email. Below are the
            recently completed tasks associated with this meeting, and all upcoming incomplete tasks for {studentName}.
            Check off the tasks you want listed in your email.
          </p>
          <hr />
          <div className="upcoming-tasks-container">
            <div className="tasks-switch">
              <Switch checked={includeUpcomingTasks} onChange={setIncludeUpcomingTasks} />
              Include Upcoming Tasks
            </div>
            {loadingTasks && <Spin />}
            {includeUpcomingTasks ? renderTasks(false) : ''}
          </div>
          <hr />
          <div className="completed-tasks-container">
            <div className="tasks-switch">
              <Switch checked={includeCompletedTasks} onChange={setIncludeCompletedTasks} />
              Include Completed Tasks
            </div>
            {loadingTasks && <Spin />}
            {includeCompletedTasks ? renderTasks(true) : ''}
          </div>
          <hr />
        </div>
        <MultiFileUpload value={fileUploads} mode={MultiFileUploadMode.Button} onChange={updateFileUploads} />
        <hr />
        <div className="send-to-container flex">
          <div>
            <Switch checked={sendToStudent} onChange={setSendToStudent} />
            Send to student ({studentName})
          </div>
          {student?.parent && (
            <div>
              <Switch checked={sendToParent} onChange={setSendToParent} />
              Send to parent
            </div>
          )}
        </div>
        <div className="schedule-link">
          {nextCounselorMeeting && !nextCounselorMeeting.start && (
            <>
              <Switch checked={includeScheduleLink} onChange={setIncludeScheduleLink} />
              Include link to schedule next meeting ({nextCounselorMeeting.title})
            </>
          )}
          {nextCounselorMeeting && nextCounselorMeeting.start && (
            <p className="help">
              Next meeting {nextCounselorMeeting.title} scheduled for{' '}
              {moment(nextCounselorMeeting.start).format('MMM Do, h:mma')}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
export default CounselorMeetingNoteMessageModal
