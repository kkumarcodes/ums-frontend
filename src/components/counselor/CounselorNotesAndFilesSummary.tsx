// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button, Card, Tabs } from 'antd'
import CounselingFileUploads from 'components/counseling/CounselingFileUploads'
import {history} from 'App'
import { orderBy, startCase } from 'lodash'
import moment from 'moment'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorNotes } from 'store/counseling/counselingSelectors'
import { CounselingUploadFileTags, CounselorNoteCategory } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import styles from './styles/CounselorNotesAndFilesSummary.scss'

type Props = {
  studentID: number
  fileTags?: CounselingUploadFileTags[]
  notesCategories?: CounselorNoteCategory[]
}

const CounselorNotesAndFilesSummary = ({ studentID, fileTags, notesCategories }: Props) => {
  const dispatch = useReduxDispatch()
  const counselorNotes = orderBy(
    useSelector(selectCounselorNotes).filter(note => {
      return (
        (note.student === studentID || note.note_student === studentID) &&
        (!notesCategories?.length || notesCategories?.includes(note.category))
      )
    }),
    'meeting_date',
    'desc',
  )

  const renderCounselorNote = (notesCategory: CounselorNoteCategory) => (
    <Tabs.TabPane tab={startCase(notesCategory)} key={notesCategory}>
      {counselorNotes
        .filter(note => note.category === notesCategory)
        .map(note => (
          <div className="counselor-note" key={note.pk}>
            {/* meeting_date and note_date are mutually exclusive only one will be defined */}
            {note.meeting_date && <strong>{moment(note.meeting_date).format('MMM Do')}:&nbsp;</strong>}
            {note.note_date && <strong>{moment(note.note_date).format('MMM Do')}:&nbsp;</strong>}
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
              role="button"
              tabIndex={0}
              className="counselor-note-content"
              onClick={() =>
                dispatch(
                  showModal({
                    modal: MODALS.COUNSELOR_MEETING_NOTE,
                    props: { counselorMeetingID: note.counselor_meeting },
                  }),
                )
              }
              dangerouslySetInnerHTML={{ __html: note.note }}
            />
          </div>
        ))}
    </Tabs.TabPane>
  )

  return (
    <Card className={`${styles.CounselorNotesAndFilesSummary} elevated`}>
      <div className="files-container">
        <div className="flex toolbar">
          <h3>Files</h3>
        </div>
        <CounselingFileUploads condensed={true} studentID={studentID} filterTags={fileTags} />
        <div className="footer right">
          <Button
            type="link"
            onClick={_ =>
              dispatch(showModal({ modal: MODALS.COUNSELING_FILE_UPLOAD, props: { studentID, tags: fileTags } }))
            }
          >
            <PlusCircleOutlined />
            Add File
          </Button>
          <Button type="link" onClick={() => History.push(`/notes-and-files/student/${studentID}`)}>
            View All Files
          </Button>
        </div>
      </div>
      <div className="notes-outer-container">
        <h3>Notes</h3>
        <div className="notes-inner-container">
          <Tabs>{notesCategories?.map(renderCounselorNote)}</Tabs>
        </div>
        <div className="footer right">
          <Button type="link" onClick={() => History.push(`/notes-and-files/student/${studentID}`)}>
            View All Notes
          </Button>
        </div>
      </div>
    </Card>
  )
}
export default CounselorNotesAndFilesSummary
