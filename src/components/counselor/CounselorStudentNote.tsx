// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState, useCallback, useRef } from 'react'
import _ from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'
import { updateStudent } from 'store/user/usersThunks'
import { RichTextEditor } from 'components/common/RichTextEditor'
import ReactQuill from 'react-quill'

type Props = {
  studentID: number
}

const SAVE_NOTE_DEBOUNCE = 700

const CounselorStudentNote = ({ studentID }: Props) => {
  const [studentNote, setStudentNote] = useState('')
  const editorRef = useRef<ReactQuill>(null)
  const dispatch = useReduxDispatch()

  const storeStudentNote = useSelector((state: RootState) => state.user.students[studentID].counselor_note)

  // When active student switches, we need to update the text in counselor note since it is not dynamic
  // We don't want to overwrite counselor note when student DOESN't change because then it will overwrite
  // note when we call our debounced saveNoteChange
  useEffect(() => {
    // Important to set to empty strying and not undefined or null because react-quill complains if not a string
    setStudentNote(storeStudentNote || '')
  }, [dispatch, studentID]) // eslint-disable-line react-hooks/exhaustive-deps

  // We update our state var for student note whenever editor changes, but we debounce saving to backend
  // I had to break this into two steps because
  const saveNoteChange = useCallback(
    _.debounce((newNote: string) => {
      if (newNote !== storeStudentNote) {
        dispatch(updateStudent(studentID, { counselor_note: newNote }))
      }
    }, SAVE_NOTE_DEBOUNCE),
    [studentID],
  )

  const noteChange = (newNote: string) => {
    setStudentNote(newNote)
    saveNoteChange(newNote)
  }
  return (
    <div className="counselor-student-note-container">
      <RichTextEditor
        onChange={noteChange}
        ref={editorRef}
        shouldFocusOnMount={false}
        value={studentNote}
        placeholder="write something..."
        initialHtml={storeStudentNote}
      />
    </div>
  )
}
export default CounselorStudentNote
