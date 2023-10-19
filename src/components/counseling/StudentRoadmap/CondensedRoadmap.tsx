// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BookOutlined,
  CheckCircleFilled,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Button, Tag } from 'antd'
import { useShallowSelector } from 'libs'
import { map, orderBy } from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import styles from './styles/CondensedRoadmap.scss'

type Props = {
  studentID: number
}

const DEFAULT_NUMBER_TO_SHOW = 3

const CondensedRoadmap = ({ studentID }: Props) => {
  const dispatch = useReduxDispatch()
  // IF WE'RE SHOWING more than the default number of completed/upcoming meetings
  const [showPast, setShowPast] = useState(false)
  const [showUpcoming, setShowUpcoming] = useState(false)

  const counselorMeetings = useSelector(selectCounselorMeetingsForStudent(studentID))
  const pastMeetings = counselorMeetings.filter(m => m.start && moment(m.start).isBefore())

  // We want future meetings so that all of the ones with dates come first, in ascending order
  // and then they are ordered by order (ascending)
  const futureMeetings = orderBy(
    counselorMeetings.filter(m => !m.start || moment(m.start).isAfter()),
    [m => (m.start ? moment(m.start).valueOf() : moment('3001-01-01').valueOf()), 'order'],
    ['asc', 'asc'],
  )
  const agendaItems = useShallowSelector((state: RootState) => state.counseling.agendaItems)

  // Launch modal with meeting info. Only works for scheduled meetings
  const launchMeetingInfo = (meetingPK: number) => {
    const meeting = counselorMeetings.find(m => m.pk === meetingPK)
    if (meeting && meeting.start) {
      dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: meetingPK } }))
    }
  }
  // Render meeting (either completed or upcoming) along with its agenda items
  const renderMeeting = (cm: CounselorMeeting) => {
    const meetingAgendaItems = cm.agenda_items.map(i => agendaItems[i]).filter(i => i)
    return (
      <div
        className={`meeting ${cm.start ? 'scheduled' : 'hide-cursor-pointer'}`}
        key={cm.slug}
        onClick={() => launchMeetingInfo(cm.pk)}
        onKeyPress={() => launchMeetingInfo(cm.pk)}
        tabIndex={0}
        role="button"
      >
        <div className="icon-container">
          {!cm.start || moment(cm.start).isAfter() ? <BookOutlined /> : <CheckCircleFilled />}
        </div>
        <div className="content">
          <p className="f-subtitle-2">
            {cm.title}
            {cm.start ? ` - ${moment(cm.start).format('MMM Do h:mma')}` : ''}
          </p>
          <p className="agenda-items f-content">{map(meetingAgendaItems, 'student_title').join(', ')}</p>
          <Tag color="blue">
            <VideoCameraOutlined />
            &nbsp; Zoom: {cm.zoom_url}
          </Tag>
        </div>
      </div>
    )
  }

  const pastMeetingsToShow =
    showPast || pastMeetings.length <= DEFAULT_NUMBER_TO_SHOW
      ? pastMeetings
      : pastMeetings.slice(pastMeetings.length - DEFAULT_NUMBER_TO_SHOW, pastMeetings.length)

  const futureMeetingsToShow =
    showUpcoming || futureMeetings.length <= DEFAULT_NUMBER_TO_SHOW
      ? futureMeetings
      : futureMeetings.slice(0, DEFAULT_NUMBER_TO_SHOW)
  return (
    <div className={styles.condensedRoadmap}>
      <div className="completed-container">
        <h4 className="f-subtitle-1">Completed</h4>
        {pastMeetings.length > pastMeetingsToShow.length && (
          <div className="center show-more">
            <Button type="link" size="small" onClick={() => setShowPast(!showPast)}>
              <ArrowUpOutlined /> Show All Completed Meetings
              <ArrowUpOutlined />
            </Button>
          </div>
        )}
        {pastMeetings.length === 0 && <p className="center help">No completed meetings...</p>}
        {pastMeetingsToShow.map(renderMeeting)}
      </div>
      <div className="upcoming-container">
        <h4 className="f-subtitle-1">Upcoming</h4>
        {futureMeetings.length === 0 && <p className="center help">No future meetings...</p>}
        {futureMeetingsToShow.map(renderMeeting)}
        {futureMeetings.length > futureMeetingsToShow.length && (
          <div className="center show-more">
            <Button type="link" size="small" onClick={() => setShowUpcoming(!showPast)}>
              <ArrowDownOutlined /> Show All Upcoming Meetings
              <ArrowDownOutlined />
            </Button>
          </div>
        )}
        {showUpcoming && (
          <div className="center show-more">
            <Button type="link" size="small" onClick={() => setShowUpcoming(prev => !prev)}>
              <ArrowUpOutlined /> Show Fewer Meetings
              <ArrowUpOutlined />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
export default CondensedRoadmap
