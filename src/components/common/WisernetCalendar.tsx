// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CalendarOutlined, CaretDownOutlined, CaretUpOutlined, CheckOutlined } from '@ant-design/icons'
import { Button, Dropdown, Input, Menu, Tag, Tooltip } from 'antd'
import { getFullName } from 'components/administrator'
import { useOnClickOutside } from 'hooks'
import { calendarDateFormats } from 'libs/ScheduleSelector/date-utils'
import { find, map, some, values } from 'lodash'
import moment from 'moment'
import React, { useRef, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { useSelector } from 'react-redux'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { Task } from 'store/task/tasksTypes'
import { selectLocations, selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { GroupTutoringSession, StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { selectIsStudentOrParent, selectStudentsObject } from 'store/user/usersSelector'
import styles from './styles/WisernetCalendar.scss'

type Props = {
  studentTutoringSessions?: StudentTutoringSession[]
  groupTutoringSessions?: GroupTutoringSession[]
  counselorMeetings?: CounselorMeeting[]
  tasks?: Task[]
  condensed?: boolean
}
enum EventType {
  Task = 'task',
  CounselorMeeting = 'counselor-meeting',
  StudentTutoringSession = 'student-tutoring-session',
  GroupTutoringSession = 'group-tutoring-session',
}
const EventTypeLabels = {
  [EventType.Task]: 'Task',
  [EventType.StudentTutoringSession]: 'Tutoring Session',
  [EventType.GroupTutoringSession]: 'Tutoring Class',
  [EventType.CounselorMeeting]: 'Counselor Meeting',
}

enum Views {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

type CalendarEvent = {
  title: string
  start: Date
  end: Date
  allDay: boolean
  eventType: EventType
  className: string
  item: Task | CounselorMeeting | StudentTutoringSession | GroupTutoringSession
  zoom?: string
  location: string
}

const MenuClassName = {
  [EventType.CounselorMeeting]: 'dark-blue',
  [EventType.GroupTutoringSession]: 'light-blue',
  [EventType.StudentTutoringSession]: 'light-blue',
  [EventType.Task]: 'orange',
}

// Some constants for our React Big Calendar
const localizer = momentLocalizer(moment)
const min = new Date(moment().hour(0).minute(0).millisecond(0).toISOString())
const max = new Date(moment().hour(23).minute(0).millisecond(0).toISOString())
const WisernetCalendar = ({
  groupTutoringSessions = [],
  studentTutoringSessions = [],
  counselorMeetings = [],
  tasks = [],
  condensed = false,
}: Props) => {
  const [search, setSearch] = useState('')
  const dispatch = useReduxDispatch()
  const isStudentOrParent = useSelector(selectIsStudentOrParent)
  const students = useSelector(selectStudentsObject)
  const [eventTypes, setEventTypes] = useState(values(EventType))
  const [eventTypeMenuVisible, setEventTypeMenuVisible] = useState(false)
  const eventTypeMenuRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(eventTypeMenuRef, () => setEventTypeMenuVisible(false))
  const locationsObject = useSelector(selectLocationsObject)
  // Todo: Can we useMemo these?
  const taskEvents: CalendarEvent[] = tasks
    .filter(t => t.due)
    .map(t => ({
      title: t.title,
      start: moment(t.due).toDate(),
      end: moment(t.due).toDate(),
      allDay: false,
      className: `${EventType.Task}${moment(t.due).isBefore() ? ' past' : ''}`,
      item: t,
      eventType: EventType.Task,
    }))
  const counselorMeetingEvents: CalendarEvent[] = counselorMeetings
    .filter(cm => cm.start)
    .map(cm => ({
      title: cm.title,
      start: moment(cm.start).toDate(),
      end: moment(cm.end).toDate(),
      allDay: false,
      className: `${EventType.CounselorMeeting}${moment(cm.end).isBefore() ? ' past' : ''}`,
      item: cm,
      zoom: cm.zoom_url ? cm.zoom_url : undefined,
      location: cm.location ? locationsObject[cm.location]?.name : 'Remote',
      eventType: EventType.CounselorMeeting,
    }))

  // Individual tutoring sessions
  const studentTutoringSessionEvents: CalendarEvent[] = studentTutoringSessions.map(s => ({
    title: isStudentOrParent ? s.title : `${getFullName(students[s.student])} - ${s.tutoring_service_name}`,
    start: moment(s.start).toDate(),
    end: moment(s.end).toDate(),
    allDay: false,
    className: `${EventType.StudentTutoringSession}${moment(s.end).isBefore() ? ' past' : ''}`,
    item: s,
    zoom: s.is_remote ? s.zoom_url : undefined,
    location: s.location ? locationsObject[s.location]?.name : '',
    eventType: EventType.StudentTutoringSession,
  }))
  const groupTutoringSessionEvents: CalendarEvent[] = groupTutoringSessions.map(s => ({
    title: s.title,
    start: moment(s.start).toDate(),
    end: moment(s.end).toDate(),
    allDay: false,
    className: `${EventType.GroupTutoringSession}${moment(s.end).isBefore() ? ' past' : ''}`,
    item: s,
    eventType: EventType.GroupTutoringSession,
  }))
  let events: CalendarEvent[] = []
  if (eventTypes.includes(EventType.CounselorMeeting)) events = events.concat(counselorMeetingEvents)
  if (eventTypes.includes(EventType.StudentTutoringSession)) events = events.concat(studentTutoringSessionEvents)
  if (eventTypes.includes(EventType.GroupTutoringSession)) events = events.concat(groupTutoringSessionEvents)
  if (eventTypes.includes(EventType.Task)) events = events.concat(taskEvents)

  // Show modal when an event is double clicked
  const onClick = (ev: CalendarEvent) => {
    if (ev.eventType === EventType.Task) {
      dispatch(showModal({ props: { taskID: ev.item.pk }, modal: MODALS.SUBMIT_TASK }))
    } else if (ev.eventType === EventType.CounselorMeeting) {
      dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: ev.item.pk } }))
    }
  }

  // Title accessor returns text title with icon for each event
  const titleAccessor = (ev: CalendarEvent) => {
    const icon = ev.eventType === EventType.Task ? <CheckOutlined /> : <CalendarOutlined />
    const tooltipTitle = ev.zoom
      ? `Remote Session: ${ev.title} Zoom: ${ev.zoom}`
      : `In-Person Session: ${ev?.location}, ${ev.title}`
    return (
      <Tooltip title={tooltipTitle}>
        <span>
          {!condensed && icon}
          {ev.eventType !== EventType.Task && moment(ev.start).format('h:mma')}&nbsp;
          {condensed ? '' : `${ev.title},`} &nbsp;
          {ev.location ? `Location: ${ev?.location},` : 'Location: Remote, '}&nbsp;
          {ev.zoom ? `Zoom Link: ${ev.zoom}` : null}
        </span>
      </Tooltip>
    )
  }

  // Menu for selecting which event types are shown on the calendar
  const handleEventTypeselection = (l: EventType) => {
    const idx = eventTypes.indexOf(l)
    if (idx > -1) setEventTypes(eventTypes.filter(e => e !== l))
    else setEventTypes(values(EventType).filter(e => e === l || eventTypes.includes(e)))
  }
  // Note that we only show event types in the menu that actually exist
  const eventTypesMenu = (
    <Menu
      selectable
      multiple={true}
      onSelect={p => handleEventTypeselection(p.key as EventType)}
      onDeselect={p => handleEventTypeselection(p.key as EventType)}
      selectedKeys={eventTypes}
    >
      {map(values(EventType), e => (
        <Menu.Item key={e} className="wisernet-ddown-item">
          <span className={MenuClassName[e]}>
            {eventTypes.includes(e) ? <CheckOutlined /> : <span className="spacer" />}
            {EventTypeLabels[e]}
          </span>
        </Menu.Item>
      ))}
    </Menu>
  )

  if (search.length > 2) {
    events = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
  }

  // Add class to days that have events
  const dayPropGetter = (date: Date) => {
    let className = 'day-no-events'
    const dayStart = moment(date).startOf('day')
    const dayEnd = moment(date).endOf('day')
    if (some(events.filter(e => moment(e.start).isBetween(dayStart, dayEnd)))) {
      className = 'day-events'
    }
    return { className }
  }

  return (
    <div className={`${styles.wisernetCalendar} ${condensed ? styles.wisernetCalendarCondensed : ''}`}>
      {!condensed && (
        <div className="wisernet-toolbar">
          <div className="wisernet-toolbar-group" ref={eventTypeMenuRef}>
            <Dropdown
              getPopupContainer={(trigger: HTMLElement) => trigger.parentNode as HTMLElement}
              visible={eventTypeMenuVisible}
              overlay={eventTypesMenu}
              trigger={['click']}
            >
              <Button onClick={() => setEventTypeMenuVisible(!eventTypeMenuVisible)}>
                Choose Visible Items&nbsp;
                {eventTypeMenuVisible ? <CaretUpOutlined /> : <CaretDownOutlined />}
              </Button>
            </Dropdown>
          </div>
          <div className="wisernet-toolbar-group">
            <Input.Search placeholder="Filter..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      )}
      <div className="calendar-wrapper">
        <Calendar
          popup
          min={min}
          max={max}
          defaultView={Views.Month}
          views={condensed ? [Views.Month] : values(Views)}
          localizer={localizer}
          events={events}
          tooltipAccessor={undefined}
          titleAccessor={titleAccessor}
          dayPropGetter={dayPropGetter}
          eventPropGetter={event => ({ className: event.className })}
          formats={calendarDateFormats}
          onDoubleClickEvent={onClick}
        />
      </div>
    </div>
  )
}
export default WisernetCalendar
