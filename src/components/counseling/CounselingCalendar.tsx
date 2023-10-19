// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FileDoneOutlined, ScheduleOutlined } from '@ant-design/icons'
import { Radio, Spin } from 'antd'
import { RadioChangeEvent } from 'antd/lib/radio'
import { getFullName } from 'components/administrator'
import styles from 'components/counseling/styles/CounselingCalendar.scss'
import { calendarDateFormats } from 'libs/ScheduleSelector/date-utils'
import { isEmpty, values } from 'lodash'
import moment from 'moment'
import 'moment/locale/en-gb'
import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { useSelector } from 'react-redux'
import { selectCounselorMeetings } from 'store/counseling/counselingSelectors'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasks } from 'store/task/tasksSelectors'
import { fetchTaskFormSubmissions, fetchTasks } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import {
  selectCWUserID,
  selectIsCounselor,
  selectIsStudent,
  selectStudents,
  selectUserID,
} from 'store/user/usersSelector'
import { useLocaleCtx } from '../../apps/LocaleContext'

enum Views {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

enum EventClassNames {
  task = 'rbc-event-task',
  taskPast = 'rbc-event-task-past',
  meeting = 'rbc-event-meeting',
  meetingPast = 'rbc-event-meeting-past',
}

export enum EventTypes {
  all = 'All Events',
  task = 'Tasks',
  meeting = 'Meetings',
}

export type CounselingCalendarEvent = {
  title: string
  start: Date
  end: Date
  allDay: boolean
  className: EventClassNames
  item: Task | CounselorMeeting
}

enum MeetingFilter {
  All = 'All',
  Upcoming = 'Upcoming',
  None = 'None',
}

enum TaskFilter {
  All = 'All',
  Incomplete = 'Incomplete',
  None = 'None',
}

const localMap = {
  enGB: 'en-GB',
  enUS: 'en-US',
}

// Full day
const min = new Date(moment().hour(0).minute(0).millisecond(0).toISOString())
const max = new Date(moment().hour(23).minute(0).millisecond(0).toISOString())

// Generate calendar events from tasks and meetings
const createEventsFromTasksAndMeetings = (tasks: Task[], meetings: CounselorMeeting[]): CounselingCalendarEvent[] => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const mapTask = (t: Task): CounselingCalendarEvent => ({
    title: t.title,
    start: new Date((t as Task).due),
    end: moment((t as Task).due)
      .add(1, 'h') // Need to add an end time for task to be displayed in calendar as allDay event
      .toDate(),
    allDay: true,
    className: (t as Task).due && moment(t.due).isBefore() ? EventClassNames.taskPast : EventClassNames.task, // Used to style event
    item: t,
  })

  const mapMeeting = (m: CounselorMeeting): CounselingCalendarEvent => ({
    title: m.title,
    start: new Date(m.start),
    end: new Date(m.end),
    allDay: false,
    className: m.start && moment(m.start).isBefore() ? EventClassNames.meetingPast : EventClassNames.meeting,
    item: m,
  })

  return [].concat(
    tasks.filter(t => (t as Task).due).map(mapTask),
    meetings.filter(m => m.start && !m.cancelled).map(mapMeeting),
  )
}

export const CounselingCalendar = () => {
  const dispatch = useReduxDispatch()
  const counselorMeetings = useSelector(selectCounselorMeetings)
  const students = useSelector(selectStudents)
  const tasks = useSelector(selectTasks)
  const isCounselor = useSelector(selectIsCounselor)
  const isStudent = useSelector(selectIsStudent)
  const userID = useSelector(selectUserID)
  const counselorID = useSelector(selectCWUserID)
  const [loading, setLoading] = useState(false)
  let localizer
  // try {
    const { locale } = useLocaleCtx()
    moment.locale(localMap[locale])
  // } catch {
  // } finally {
  //   localizer = momentLocalizer(moment)
  // }

  const [selectedMeetingFilter, setMeetingFilter] = useState(MeetingFilter.Upcoming)
  const [selectedTaskFilter, setTaskFilter] = useState(TaskFilter.Incomplete)

  const noTasks = isEmpty(tasks)
  const noStudents = isEmpty(students)
  useEffect(() => {
    const promises: Promise<any>[] = []
    if (isCounselor && noTasks && !noStudents) {
      promises.push(
        dispatch(fetchTasks({ counselor: counselorID, start: moment().startOf('month').format('YYYY-MM-DD') })),
      )
      promises.push(dispatch(fetchTaskFormSubmissions()))
      Promise.all(promises)
    } else if (isStudent && userID) {
      dispatch(fetchTasks({ user: userID, start: moment().startOf('month').format('YYYY-MM-DD') }))
      dispatch(fetchTaskFormSubmissions())
    }
  }, [counselorID, dispatch, isCounselor, isStudent, noStudents, noTasks, userID])

  // When traveling to previous dates, we need to load past meetings and tasks
  const onNavigate = async (date: Date) => {
    if (moment(date) < moment().startOf('month')) {
      setLoading(true)
      const start = moment(date).startOf('month').format('YYYY-MM-DD')
      const end = moment(date).endOf('month').format('YYYY-MM-DD')
      await Promise.all([
        dispatch(fetchCounselorMeetings({ start, end })),
        dispatch(fetchTasks({ user: isStudent ? userID : undefined, counselor: counselorID, start, end })),
      ])
      setLoading(false)
    }
  }

  const handleMeetingFilterChange = (e: RadioChangeEvent) => setMeetingFilter(e.target.value)
  const handleTaskFilterChange = (e: RadioChangeEvent) => setTaskFilter(e.target.value)

  const filteredTasks = tasks.filter(task => {
    if (selectedTaskFilter === TaskFilter.None) {
      return false
    }
    if (selectedTaskFilter === TaskFilter.Incomplete) {
      return !task.completed
    }
    // default All case
    return true
  })

  // Add icons to events
  const titleAccessor = (event: CounselingCalendarEvent) => {
    let icon: JSX.Element
    let studentPrompt: string

    if (event.className.includes(EventClassNames.meeting)) {
      icon = <ScheduleOutlined />
      studentPrompt = `Meeting w/ ${(event.item as CounselorMeeting).student_name} @ ${
        (event.item as CounselorMeeting).start ? moment((event.item as CounselorMeeting).start).format('h:mma') : ''
      }`
    }
    if (event.className.includes(EventClassNames.task)) {
      icon = <FileDoneOutlined />
      const student = students?.find(s => s.pk === (event.item as Task).for_student)
      studentPrompt = `Task - ${getFullName(student)}`
    }

    if (isStudent) {
      studentPrompt = ''
    }

    return (
      <>
        <div>
          {icon} {studentPrompt}
        </div>
        <span>{event.title}</span>
      </>
    )
  }

  // Tooltip with some additional context for events
  const tooltipAccessor = (event: CounselingCalendarEvent) => {
    const student = students?.find(s => s.pk === (event.item as Task).for_student)
    const generateMeetingTooltip = () =>
      `Meeting w/ ${(event.item as CounselorMeeting).student_name} @ ${
        (event.item as CounselorMeeting).start ? moment((event.item as CounselorMeeting).start).format('h:mma') : ''
      }: ${event.title}`

    switch (event.className) {
      case EventClassNames.meeting:
        return generateMeetingTooltip()
      case EventClassNames.meetingPast:
        return generateMeetingTooltip()
      case EventClassNames.task:
        return `Task - ${getFullName(student)}: ${event.title}`
      case EventClassNames.taskPast:
        return `Task - ${getFullName(student)}: ${event.title}`
      default:
        return ''
    }
  }

  const filteredCounselorMeetings = counselorMeetings.filter(cm => {
    if (selectedMeetingFilter === MeetingFilter.None) {
      return false
    }
    if (selectedMeetingFilter === MeetingFilter.Upcoming) {
      return moment(cm.start).isAfter()
    }
    // default All case
    return true
  })
  const events = createEventsFromTasksAndMeetings(filteredTasks, filteredCounselorMeetings)

  return (
    <div className={styles.CounselingCalendar}>
      <h2 className="heading">
        Calendar
        {loading && <Spin className="loading" />}
      </h2>
      <div className="toolbar">
        <div className="radio-group-wrapper">
          <label className="radio-group-label">Meeting:</label>
          <Radio.Group
            onChange={handleMeetingFilterChange}
            defaultValue={MeetingFilter.Upcoming}
            value={selectedMeetingFilter}
          >
            {values(MeetingFilter).map(mf => (
              <Radio.Button value={mf} key={mf}>
                {mf}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
        <div className="radio-group-wrapper">
          <label className="radio-group-label">Task:</label>
          <Radio.Group
            onChange={handleTaskFilterChange}
            defaultValue={TaskFilter.Incomplete}
            value={selectedTaskFilter}
          >
            {values(TaskFilter).map(tf => (
              <Radio.Button value={tf} key={tf}>
                {tf}
              </Radio.Button>
            ))}
          </Radio.Group>
        </div>
      </div>
      <div className="calendar-wrapper">
        <Calendar
          popup
          localizer={localizer}
          defaultView={Views.Month}
          views={values(Views)}
          min={min}
          max={max}
          events={events}
          onNavigate={onNavigate}
          titleAccessor={titleAccessor}
          tooltipAccessor={tooltipAccessor}
          eventPropGetter={event => ({ className: event.className })}
          formats={calendarDateFormats}
          onDoubleClickEvent={(event, e) => {
            if (event.className.includes(EventClassNames.task)) {
              return dispatch(showModal({ props: { taskID: event.item.pk }, modal: MODALS.SUBMIT_TASK }))
            }
            if (event.className.includes(EventClassNames.meeting)) {
              return dispatch(showModal({ modal: MODALS.COUNSELING_CALENDAR_EVENT, props: { item: event.item } }))
            }
            return null
          }}
        />
      </div>
    </div>
  )
}
