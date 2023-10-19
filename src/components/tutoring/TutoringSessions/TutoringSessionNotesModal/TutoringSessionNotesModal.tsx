// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Divider, Modal, Select, Switch } from 'antd'
import { handleError } from 'components/administrator'
import { handleSuccess } from 'components/administrator/utils'
import MultiFileUpload, { MultiFileUploadMode } from 'components/common/MultiFileUpload'
import { RichTextEditor } from 'components/common/RichTextEditor'
import { getSessionNoteContent } from 'copy/sessionNoteTemplates'
import { map } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import { useSelector } from 'react-redux'
import { selectVisibleTutoringSessionNoteModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { selectResources } from 'store/resource/resourcesSelectors'
import { fetchResources } from 'store/resource/resourcesThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectTutoringSessionNoteAndModalProps } from 'store/tutoring/tutoringSelectors'
import {
  createTutoringSessionNote,
  fetchStudentTutoringSession,
  fetchTutoringSessionNote,
  resendTutoringSessionNote,
  TutoringSessionNotePayload,
  updateStudentTutoringSession,
  updateTutoringSessionNote,
} from 'store/tutoring/tutoringThunks'
import { StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { selectCWUserID, selectIsAdmin, selectIsTutor, selectStudent } from 'store/user/usersSelector'
import styles from './styles/TutoringSessionNotesModal.scss'
import TutoringSessionDetails from './TutoringSessionDetails'
import { TutoringSessionNotesCtxProvider, useCreateTutoringSessionNotesCtx } from './TutoringSessionNotesModalContext'
import TutoringSessionNotesShare from './TutoringSessionNotesShare'

const { Option } = Select

export const TutoringSessionNotesModal = () => {
  const editorRef = useRef<ReactQuill>(null)
  const dispatch = useReduxDispatch()
  const isTutor = useSelector(selectIsTutor)
  const isAdmin = useSelector(selectIsAdmin)
  const cwUserID = useSelector(selectCWUserID)
  const visible = useSelector(selectVisibleTutoringSessionNoteModal)
  const { sessionNote, modalProps } = useSelector(selectTutoringSessionNoteAndModalProps)
  const resources = useSelector(selectResources)
  const individualTutoringSessionID = modalProps?.individualTutoringSessionID
  const groupTutoringSessionID = modalProps?.groupTutoringSessionID
  const tutorID = isTutor ? cwUserID : modalProps?.tutorID
  const [loading, setLoading] = useState(false)
  const [updateResources, setUpdateResources] = useState<string[]>([])
  const ctxValue = useCreateTutoringSessionNotesCtx()
  const [resend, setResend] = useState(false)

  // TODO: Still needed?
  useEffect(() => {
    dispatch(fetchResources({}))
  }, [dispatch])

  const student = useSelector(selectStudent(ctxValue.individualSession?.student))
  const tutoringSessionNotes = useSelector((state: RootState) => {
    if (ctxValue.individualSession?.tutoring_session_notes)
      return state.tutoring.tutoringSessionNotes[ctxValue.individualSession.tutoring_session_notes]
    if (ctxValue.groupSession?.tutoring_session_notes)
      return state.tutoring.tutoringSessionNotes[ctxValue.groupSession.tutoring_session_notes]
    return undefined
  })

  // Load student tutoring session if needed
  const studentTutoringSession = ctxValue.individualSession
  const loadSession = Boolean(individualTutoringSessionID && !studentTutoringSession && individualTutoringSessionID)
  useEffect(() => {
    const promises: Promise<any>[] = []
    if (loadSession) {
      promises.push(
        dispatch(fetchStudentTutoringSession(individualTutoringSessionID as number)).then(
          (session: StudentTutoringSession) => {
            if (session.tutoring_session_notes) {
              dispatch(fetchTutoringSessionNote(session.tutoring_session_notes))
            }
          },
        ),
      )
    }
    if (promises.length) {
      setLoading(true)
      Promise.all(promises).finally(() => setLoading(false))
    }
  }, [loadSession, dispatch, individualTutoringSessionID])

  // When we are editing notes, we default to resending them
  const editingExistingNotes = !!tutoringSessionNotes
  useEffect(() => setResend(editingExistingNotes), [editingExistingNotes])

  // When modal becomes visible, we set default context values
  useEffect(() => {
    if (visible) {
      ctxValue.reset()
      setUpdateResources([])
      if (tutoringSessionNotes) {
        ctxValue.setShare({
          parent: tutoringSessionNotes.visible_to_parent,
          student: tutoringSessionNotes.visible_to_student,
        })
        ctxValue.setFileUploads(tutoringSessionNotes.file_uploads)
        setUpdateResources(map(tutoringSessionNotes.resources, 'slug'))
      }
      ctxValue.setGroupSessionPK(groupTutoringSessionID)
      ctxValue.setIndividualSessionPK(individualTutoringSessionID)
    }
  }, [tutoringSessionNotes?.pk, visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOk = async () => {
    const editorHtml: string = editorRef?.current?.getEditorContents()

    const payload: TutoringSessionNotePayload = {
      notes: editorHtml,
      author: tutorID,
      update_resources: updateResources,
    }
    payload.visible_to_parent = ctxValue.share.parent
    payload.visible_to_student = ctxValue.share.student
    payload.cc_email = ctxValue.ccEmail
    payload.update_file_uploads = map(ctxValue.fileUploads, 'slug')

    if (individualTutoringSessionID) {
      payload.individual_tutoring_session = individualTutoringSessionID
    } else {
      payload.group_tutoring_session = groupTutoringSessionID
    }
    setLoading(true)

    try {
      // First we create or save the note
      const noteResponse = await (sessionNote
        ? dispatch(updateTutoringSessionNote(sessionNote.pk, payload))
        : dispatch(createTutoringSessionNote(payload)))
      // Then we update settings on individual session
      if (individualTutoringSessionID) {
        const updateSession: Partial<StudentTutoringSession> = {
          tutoring_service: ctxValue.sessionDetails?.subject,
          session_type: ctxValue.sessionDetails?.sessionType,
          note: ctxValue.sessionDetails?.note,
          tutoring_session_notes: noteResponse.pk,
        }
        await dispatch(updateStudentTutoringSession(individualTutoringSessionID, updateSession))
      }
      if (sessionNote && resend) await dispatch(resendTutoringSessionNote(sessionNote.pk))
      handleSuccess('Note Saved')
      setLoading(false)
      ctxValue.reset()
      dispatch(closeModal())
    } catch {
      setLoading(false)
      handleError('Failed to save note')
    }
  }

  /** Apply the standard template to what's in our editor */
  const applyTemplate = () => {
    const editor = editorRef.current?.getEditor()
    editor?.setText(getSessionNoteContent())
  }

  /** Renders options for using a template, which are only available if there is a student returned
   * from our selector (i.e. only available for individual sessions)
   */
  const renderTemplateContainer = () => {
    return (
      <div className="template-container flex">
        <Button onClick={applyTemplate} type="primary" size="small">
          Apply Template
        </Button>
      </div>
    )
  }

  return (
    <Modal
      style={{ top: 50 }}
      wrapClassName={styles.modalTutoringSessionNote}
      title={sessionNote ? `${isAdmin ? '' : 'Edit '}Tutoring Session Note` : 'Create Tutoring Session Note'}
      visible={visible}
      width={600}
      confirmLoading={loading}
      onCancel={() => dispatch(closeModal())}
      onOk={handleOk}
      footer={isAdmin ? null : undefined}
      okText="Save"
      destroyOnClose
    >
      <TutoringSessionNotesCtxProvider value={ctxValue}>
        <div className="inner-container">
          <div className="editorWrapper">
            <RichTextEditor ref={editorRef} placeholder="Add your notes here..." initialHtml={sessionNote?.notes} />
          </div>
          {!isAdmin && renderTemplateContainer()}
          {!!individualTutoringSessionID && (
            <>
              <Divider plain>Confirm Session Details</Divider>
              <TutoringSessionDetails />
            </>
          )}

          <Divider plain>Sharing Settings</Divider>
          <TutoringSessionNotesShare />
          <Divider plain>File Attachments</Divider>
          <MultiFileUpload
            mode={MultiFileUploadMode.Button}
            value={ctxValue.fileUploads}
            onChange={ctxValue.setFileUploads}
          />
          <Divider plain>Resources</Divider>
          <div className="resources">
            <Select
              mode="multiple"
              showSearch
              value={updateResources}
              placeholder="Select a resource"
              optionFilterProp="children"
              allowClear
              onChange={setUpdateResources}
            >
              {resources?.map(resource => (
                <Option key={resource.pk} value={resource.slug}>
                  {resource.title}
                </Option>
              ))}
            </Select>
          </div>
          {sessionNote && (
            <div className="resend">
              <Switch checked={resend} onChange={setResend} />
              &nbsp;Resend Notes
            </div>
          )}
        </div>
      </TutoringSessionNotesCtxProvider>
    </Modal>
  )
}
