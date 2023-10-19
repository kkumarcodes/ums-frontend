// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button } from 'antd'
import { map, orderBy } from 'lodash'
import React from 'react'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import moment from 'moment'
import styles from './styles/Roadmap.scss'

const MEETING_OFFSET = 150
// Description to use for a meeting on the roadmap if it doesn't have a description
const DEFAULT_DESCRIPTION =
  "You'll be able to connect with your counselor on a handful of topics and discuss the tasks at hand"

type Props = {
  // Roadmap component relies on absolute positioning. This width is the width of 1 semester column
  // (1/3 of one grade column) on the roadmap
  semesterWidth: number
  startGrade: number
  meetings: CounselorMeeting[]
}

const RoadmapMeetingsRow = ({ startGrade, semesterWidth, meetings }: Props) => {
  const dispatch = useReduxDispatch()
  // Width based on which semester/grade this meeting is for

  const renderMeeting = (meeting: CounselorMeeting) => {
    // Alright, so offset is basically equal to the number of semesters (three semesters in a grade)
    // But per design, cards displaying a meeting display with an offset
    // Note semesters are decimals (see type definition)
    const semesterOffset = (Math.max(meeting.grade, 8) - startGrade) * semesterWidth * 3 // 3 semesters per grade
    const left = semesterOffset + semesterWidth * (meeting.semester - 1) + MEETING_OFFSET

    return (
      <div
        className={`${meeting.start && moment(meeting.start).isBefore() ? 'past' : ''} meeting center f-content`}
        key={meeting.slug}
        style={{ left: `${left}px` }}
      >
        <p className="title f-subtitle-2 dark-blue">
          {meeting.title} {meeting.start ? moment(meeting.start).format('MMM Do') : ''}{' '}
        </p>
        <p className="description help">{meeting.description || DEFAULT_DESCRIPTION}</p>
        <Button
          type="link"
          className="passive-link"
          onClick={() =>
            dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: meeting.pk } }))
          }
        >
          View More
        </Button>
      </div>
    )
  }

  return <div className={styles.roadmapMeetingsRow}>{map(orderBy(meetings), renderMeeting)}</div>
}
export default RoadmapMeetingsRow
