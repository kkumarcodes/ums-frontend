// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import useActiveStudent from 'libs/useActiveStudent'
import { groupBy, keys, orderBy } from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsObject, selectCounselorNotesForStudent } from 'store/counseling/counselingSelectors'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import styles from './styles/ParentCounselorMeetingNotes.scss'

const DEFAULT_NUMBER_TO_SHOW = 3

const ParentCounselorMeetingNotes = () => {
  const activeStudent = useActiveStudent()
  const dispatch = useReduxDispatch()
  const [showAll, setShowAll] = useState(false)
  const notes = groupBy(
    orderBy(useSelector(selectCounselorNotesForStudent(activeStudent?.pk)), ['pk'], ['asc']),
    'counselor_meeting',
  )
  const meetings = useSelector(selectCounselorMeetingsObject)
  const orderedMeetings = orderBy(
    keys(notes).map(k => meetings[Number(k)]),
    'start',
    'desc',
  ).filter(k => k)

  // Render notes for a particular meeting
  const renderMeetingNotes = (meeting: CounselorMeeting) => {
    const meetingNotes = notes[meeting.pk]
    // First two notes, plus an ellipses if there are more
    const note = meetingNotes.slice(0, DEFAULT_NUMBER_TO_SHOW).map(n => {
      const note = n.note.length < 150 ? n.note : `${n.note.slice(0, 150)}...`
      return <div key={n.slug} dangerouslySetInnerHTML={{ __html: note }} />
    })
    if (meetingNotes.length > DEFAULT_NUMBER_TO_SHOW) note.push(<p>...</p>)
    return (
      <div
        className="counselor-note"
        role="button"
        tabIndex={0}
        onKeyPress={() =>
          dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: meeting.pk } }))
        }
        key={meeting.slug}
        onClick={() =>
          dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: meeting.pk } }))
        }
      >
        <div className="bullet">
          <div className="bullet-inner" />
        </div>
        <div className="content f-content">
          <strong>{meeting.start ? moment(meeting.start).format('MMM Do') : meeting.title}</strong>
          {note}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.parentCounselorMeetingNotes}>
      {orderedMeetings.slice(0, showAll ? orderedMeetings.length : DEFAULT_NUMBER_TO_SHOW).map(renderMeetingNotes)}
      {orderedMeetings.length > DEFAULT_NUMBER_TO_SHOW && (
        <div className="read-more-container center">
          <Button type="link" size="small" onClick={() => setShowAll(!showAll)}>
            {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />} Show {showAll ? 'Fewer' : 'All'} Meetings
            {showAll ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          </Button>
        </div>
      )}
    </div>
  )
}
export default ParentCounselorMeetingNotes
