// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined, InfoCircleOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Input, Modal, Row, Tooltip } from 'antd'
import InputType from 'antd/lib/input/Input'
import { getFullName } from 'components/administrator'
import MinimizeModalTitle from 'components/common/MinimizeModalTitle'
import { CounselorMeetingNoteForm } from 'components/counselor/CounselorMeetingNoteForm'
import styles from 'components/counselor/styles/CounselorMeetingNoteModal.scss'
import { useShallowSelector } from 'libs'
import { isEmpty, keys, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeeting } from 'store/counseling/counselingSelectors'
import { updateNonMeetingNoteTitle } from 'store/counseling/counselingThunks'
import { CounselorNote, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal, showModal } from 'store/display/displaySlice'
import { CounselorMeetingNoteProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor, selectStudent } from 'store/user/usersSelector'

/**
 * Modal allows counselor to create/update/delete counselor meeting notes and non-meeting notes (organized by date)
 * This component assumes counselor meeting notes have already been fetched
 */
export const CounselorMeetingNoteModal = () => {
  const dispatch = useReduxDispatch()
  const inputRef = useRef<InputType>(null)

  const visible = useSelector(selectVisibleModal(MODALS.COUNSELOR_MEETING_NOTE))
  const modalProps = useSelector(selectActiveModal)?.modalProps as CounselorMeetingNoteProps
  const counselorMeetingID = modalProps?.counselorMeetingID
  const nonMeetingNoteDate = modalProps?.nonMeetingNoteDate

  const studentPK = modalProps?.studentPK
  const isCounselor = useSelector(selectIsCounselor)
  const counselorMeeting = useSelector(selectCounselorMeeting(counselorMeetingID))
  const student = useSelector(selectStudent(counselorMeeting?.student))
  const counselorNotes = useShallowSelector((state: RootState) =>
    values(state.counseling.counselorNotes).filter(
      cn =>
        cn.counselor_meeting === counselorMeetingID ||
        (cn.note_date === nonMeetingNoteDate && cn.note_student === studentPK),
    ),
  )
  const [showNewNote, setShowNewNote] = useState(false)
  const [nonMeetingNoteTitle, setNonMeetingNoteTitle] = useState('')
  const [isEditingNoteTitle, setIsEditingNoteTitle] = useState(false)

  const firstNonMeetingCounselorNote: CounselorNote | undefined = counselorNotes[0]

  useEffect(() => {
    if (isEditingNoteTitle && inputRef.current) {
      inputRef?.current?.focus({ cursor: 'end' })
    }
  }, [isEditingNoteTitle])

  // For non-meeting notes, we only default to show the new category dropdown if no notes exist on for this date
  useEffect(() => {
    if (nonMeetingNoteDate && isEmpty(firstNonMeetingCounselorNote)) {
      setShowNewNote(true)
    }
    return () => setShowNewNote(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonMeetingNoteDate])

  // Reset nonMeetingNoteTitle and turn off note_title input box when modal closes
  useEffect(() => {
    if (!visible) {
      setNonMeetingNoteTitle('')
      setIsEditingNoteTitle(false)
    }
  }, [visible])

  const handleNoteTitleUpdate = e => {
    setNonMeetingNoteTitle(e.target.value)
    setIsEditingNoteTitle(false)
    if (!isEmpty(counselorNotes)) {
      dispatch(
        updateNonMeetingNoteTitle(nonMeetingNoteTitle, {
          student: studentPK as number,
          note_date: nonMeetingNoteDate,
        }),
      ).then(res => setNonMeetingNoteTitle(''))
    }
  }

  const renderNoteTitleInput = (
    <Row style={{ flexWrap: 'nowrap' }} align="middle">
      <Input
        ref={inputRef}
        placeholder="Enter Note Title"
        className="non-meeting-note-title-input"
        value={nonMeetingNoteTitle}
        onChange={e => setNonMeetingNoteTitle(e.target.value)}
        onPressEnter={handleNoteTitleUpdate}
        onBlur={handleNoteTitleUpdate}
      />
      <Tooltip title="Press Enter to Save Title">
        <InfoCircleOutlined style={{ paddingLeft: 16 }} />
      </Tooltip>
    </Row>
  )

  const renderNoteTitleContent = (
    <Tooltip title="Click to Edit" placement="topLeft">
      <Row align="middle" style={{ flexWrap: 'nowrap' }}>
        <Button
          size="large"
          className="slim-btn note-title-btn"
          type="link"
          onClick={() => setIsEditingNoteTitle(true)}
        >
          <span className="note-title">
            {firstNonMeetingCounselorNote?.note_title || nonMeetingNoteTitle || (
              <span className="title-placeholder">Enter Note Title</span>
            )}
          </span>
        </Button>
      </Row>
    </Tooltip>
  )

  const getTitle = () => {
    // Proxy for meeting-note
    if (counselorMeeting?.start) {
      return `${getFullName(student)} Meeting Notes - ${moment(counselorMeeting.start).format('MMM Do')}`
    }
    // Proxy for non-meeting note
    if (nonMeetingNoteDate) {
      return isEditingNoteTitle ? renderNoteTitleInput : renderNoteTitleContent
    }
    return `${getFullName(student)} Meeting Notes`
  }

  const usedNoteCategories = counselorNotes?.map(cn => cn.category)

  const handleClose = () => {
    dispatch(closeModal())
    setShowNewNote(false)
  }

  // Show CounselorMeetingNoteMessageModal
  const handleEmail = () => {
    dispatch(closeModal())
    dispatch(showModal({ modal: MODALS.SEND_COUNSELOR_MEETING_NOTES, props: { counselorMeetingID } }))
  }

  return (
    <Modal
      visible={visible}
      title={<MinimizeModalTitle title={getTitle()} />}
      closable={false}
      footer={null}
      wrapClassName={styles.CounselorMeetingNoteModal}
      width={720}
    >
      <div className="meeting-note-modal-content">
        {!nonMeetingNoteDate && (
          <div className="header">
            <span>{counselorMeeting?.start ? moment(counselorMeeting.start).format('MMMM D - ') : ''}</span>
            <span>{counselorMeeting?.title}</span>
          </div>
        )}
        {/* Existing Notes */}
        {counselorNotes?.map(cn => (
          <CounselorMeetingNoteForm
            key={cn.pk}
            counselorMeetingID={counselorMeetingID}
            counselorNote={cn}
            isUpdating={true}
            nonMeetingNoteDate={nonMeetingNoteDate}
            studentPK={studentPK}
            nonMeetingNoteTitle={nonMeetingNoteTitle}
          />
        ))}
        {/* New Note */}
        {isCounselor && (
          <>
            {showNewNote ? (
              <CounselorMeetingNoteForm
                key="new-note"
                counselorMeetingID={counselorMeetingID}
                nonMeetingNoteDate={nonMeetingNoteDate}
                setShowNewNote={setShowNewNote}
                usedNoteCategories={usedNoteCategories}
                studentPK={studentPK}
                nonMeetingNoteTitle={nonMeetingNoteTitle}
              />
            ) : (
              // Stop showing button when all note categories are used
              usedNoteCategories?.length !== keys(CounselorNoteCategory).length && (
                <div className="new-note-container">
                  <Button type="link" className="new-note-btn" onClick={() => setShowNewNote(true)}>
                    Click To Add A New Note...
                  </Button>
                </div>
              )
            )}
          </>
        )}
        {/* New Non-Meeting Note */}
        <div className="modal-control">
          {isCounselor && !nonMeetingNoteDate && (
            <Button className="modal-control-btn" onClick={handleEmail}>
              Finalize Notes <RightOutlined />
            </Button>
          )}
          <Button className="modal-control-btn" onClick={handleClose}>
            {isCounselor && 'Save and'} Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
