// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Select } from 'antd'
import { renderHighlighter } from 'components/administrator/helpers'
import { RichTextEditor } from 'components/common/RichTextEditor'
import styles from 'components/counselor/styles/CounselorMeetingNoteForm.scss'
import { keys, startCase, throttle } from 'lodash'
import React, { useCallback, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import { useSelector } from 'react-redux'
import { createCounselorNote, deleteCounselorNote, updateCounselorNote } from 'store/counseling/counselingThunks'
import { CounselorNote, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselorOrAdmin } from 'store/user/usersSelector'

const SAVE_NOTE_THROTTLE = 700

type Props = {
  counselorMeetingID?: number
  counselorNote?: CounselorNote
  isReadOnly?: boolean
  isUpdating?: boolean
  setShowNewNote?: React.Dispatch<React.SetStateAction<boolean>>
  usedNoteCategories?: CounselorNoteCategory[]
  highlightText?: string
  nonMeetingNoteDate?: string // Defined only for non-meeting notes
  studentPK?: number // Defined only for non-meeting notes
  nonMeetingNoteTitle?: string // Defined only for non-meeting notes
}

/**
 * OH boy. This component does it all.
 * It will display a counselor note in a readOnly state (NotesAndFiles view)
 * It will create a new counselor note (this is the component's default behavior, if isReadOnly and isUpdating is not explicitly set)
 * The new note is created when a user selects a category for the note
 * Finally, once a note is created, the component handles throttled updates to the note content via a rich text interface
 * Oh, and one last thing, this component also handles deleting notes. Much wow.
 */
export const CounselorMeetingNoteForm = ({
  counselorMeetingID,
  // notePK,
  counselorNote,
  setShowNewNote,
  usedNoteCategories,
  isReadOnly = false,
  isUpdating = false,
  highlightText,
  nonMeetingNoteDate,
  studentPK,
  nonMeetingNoteTitle,
}: Props) => {
  const dispatch = useReduxDispatch()
  const editorRef = useRef<ReactQuill>(null)

  const [note, setNote] = useState(counselorNote?.note || '')
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  isReadOnly = isReadOnly || !isCounselorOrAdmin

  const noteCategoryOptions = keys(CounselorNoteCategory)
    .map(k => ({ label: startCase(k), value: CounselorNoteCategory[k as keyof typeof CounselorNoteCategory] }))
    .filter(o => !usedNoteCategories?.includes(o.value))

  const saveNoteChange = useCallback(
    throttle((newNote: string) => {
      if (newNote !== counselorNote?.note && counselorNote) {
        dispatch(updateCounselorNote(counselorNote.pk, { note: newNote }))
      }
    }, SAVE_NOTE_THROTTLE),
    [counselorNote?.pk],
  )

  const handleNoteChange = (newNote: string) => {
    if (isUpdating) {
      setNote(newNote)
      saveNoteChange(newNote)
    }
    setNote(newNote)
  }

  const handleCategoryChange = (category: CounselorNoteCategory) => {
    if (category && !isUpdating) {
      const newCounselorNote: Partial<CounselorNote> = {
        category,
        note,
      }
      if (counselorMeetingID) {
        newCounselorNote.counselor_meeting = counselorMeetingID
      }
      if (nonMeetingNoteDate) {
        newCounselorNote.note_date = nonMeetingNoteDate
        newCounselorNote.note_student = studentPK
        newCounselorNote.note_title = nonMeetingNoteTitle
      }

      dispatch(createCounselorNote(newCounselorNote)).then(_ => {
        setShowNewNote(false)
      })
    }
  }

  const handleDelete = () => {
    if (isUpdating) {
      dispatch(deleteCounselorNote(counselorNote?.pk))
    } else {
      setShowNewNote(false)
    }
  }

  return (
    <div className={styles.CounselorMeetingNoteForm}>
      <div className="top-panel">
        {isUpdating || isReadOnly ? (
          <div className="counselor-note-category">
            {renderHighlighter(startCase(counselorNote?.category), highlightText)}
          </div>
        ) : (
          <div className="category-wrapper">
            <label className="category-label">Create New Note:</label>
            <Select
              className="category-select"
              options={noteCategoryOptions}
              onChange={handleCategoryChange}
              placeholder="Select Category"
              autoFocus={!nonMeetingNoteDate}
              defaultOpen={!nonMeetingNoteDate}
            />
          </div>
        )}
        {!isReadOnly && (
          <div className="delete-wrapper">
            <Button type="link" className="delete-btn" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>
      <div className="bottom-panel">
        {isReadOnly ? (
          //eslint-disable-next-line react/no-danger
          <div className="note-read-only" dangerouslySetInnerHTML={{ __html: counselorNote?.note || '' }} />
        ) : (
          isUpdating && (
            <RichTextEditor
              ref={editorRef}
              placeholder="Add your notes here..."
              initialHtml={note}
              value={note}
              onChange={handleNoteChange}
              condensed
            />
          )
        )}
      </div>
    </div>
  )
}
