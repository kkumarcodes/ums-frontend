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

export const CounselorActivitiesNotes = ({ studentID }: Props) => {
  const [activitiesNotes, setActivitiesNotes] = useState('')
  const editorRef = useRef<ReactQuill>(null)
  const dispatch = useReduxDispatch()

  const storeActivitiesNotes = useSelector((state: RootState) => state.user.students[studentID].activities_notes)

  // When active student switches, we need to update the text in counselor note since it is not dynamic
  // We don't want to overwrite counselor note when student DOESN't change because then it will overwrite
  // note when we call our debounced saveNoteChange
  useEffect(() => {
    // Important to set to empty string and not undefined or null because react-quill complains if not a string
    setActivitiesNotes(storeActivitiesNotes || '')
  }, [dispatch, studentID]) // eslint-disable-line react-hooks/exhaustive-deps

  // We update our state var for activities_notes whenever editor changes, but we throttle saving to backend
  const saveNoteChange = useCallback(
    _.debounce((newNote: string) => {
      if (newNote !== storeActivitiesNotes) {
        dispatch(updateStudent(studentID, { activities_notes: newNote }))
      }
    }, SAVE_NOTE_DEBOUNCE),
    [studentID],
  )

  const noteChange = (newNote: string) => {
    setActivitiesNotes(newNote)
    saveNoteChange(newNote)
  }
  return (
    <div className="counselor-activities-notes">
      <RichTextEditor
        onChange={noteChange}
        ref={editorRef}
        shouldFocusOnMount={false}
        value={activitiesNotes}
        placeholder="write something..."
        initialHtml={storeActivitiesNotes}
      />
    </div>
  )
}
