// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarTwoTone, FileDoneOutlined, LoadingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Modal } from 'antd'
import { getFullName, renderAddressDetails } from 'components/administrator'
import styles from 'components/common/styles/TaskSession.scss'
import { EventTypes, useTaskSessionCtx } from 'components/common/TaskSession'
import { useShallowSelector } from 'libs'
import { calendarDateFormats } from 'libs/ScheduleSelector/date-utils'
import { filter, isEmpty, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { getLocations } from 'store/tutoring/tutoringSelectors'
import { fetchLocations, fetchStudentTutoringSessions } from 'store/tutoring/tutoringThunks'
import { Location, StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { getStudents, getTutors, selectCWUserID, selectIsStudent, selectUserID } from 'store/user/usersSelector'
import { fetchStudents, fetchTutors } from 'store/user/usersThunks'

enum Views {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

enum EventClassNames {
  task = 'rbc-event-task',
  taskPast = 'rbc-event-task-past',
  individual = 'rbc-event-individual',
  individualPast = 'rbc-event-individual-past',
  group = 'rbc-event-group',
  groupPast = 'rbc-event-group-past',
}

type Event = {
  title: string
  start: Date
  end: Date
  allDay: boolean
  className: EventClassNames
  item: Task | StudentTutoringSession
}

// Full day
const min = new Date(moment().hour(0).minute(0).millisecond(0).toISOString())
const max = new Date(moment().hour(23).minute(0).millisecond(0).toISOString())

const localizer = momentLocalizer(moment)

// Generate calendar events from tasks and sessions
const createEventsFromTasksAndSessions = (tasks: Task[], sessions: StudentTutoringSession[]): Event[] => {
  const getClassName = (event: Task | StudentTutoringSession) => {
    if ((event as Task)?.due) {
      return moment((event as Task).due).isBefore() ? EventClassNames.taskPast : EventClassNames.task
    }
    if ((event as StudentTutoringSession)?.start && (event as StudentTutoringSession)?.individual_session_tutor) {
      return moment((event as StudentTutoringSession).start).isBefore()
        ? EventClassNames.individualPast
        : EventClassNames.individual
    }
    if ((event as StudentTutoringSession)?.start && (event as StudentTutoringSession)?.group_tutoring_session) {
      return moment((event as StudentTutoringSession).start).isBefore()
        ? EventClassNames.groupPast
        : EventClassNames.group
    }
  }

  return (tasks as Array<Task | StudentTutoringSession>)
    .map(t => ({
      title: t.title,
      start: new Date((t as Task).due as string),
      end: moment((t as Task).due as string)
        .add(1, 'h') // Need to add an end time for task to be displayed in calendar as allDay event
        .toDate(),
      allDay: true,
      className: getClassName(t), // Used to style event
      item: t,
    }))
    .concat(
      sessions.map((s: StudentTutoringSession) => ({
        title: `${s.is_tentative ? 'TENTATIVE ' : ''} ${s.title}`,
        start: new Date(s.start),
        end: new Date(s.end),
        allDay: false,
        zoom: s.zoom_url ? s.zoom_url : undefined,
        location: s.location,
        className: getClassName(s),
        item: s,
      })),
    )
}

type Props = {
  studentID?: number
  userID?: number
}

/**
 * Renders a calendar that displays upcoming task and tutoring sessions.
 * If active user is a "student", displays and fetches their task and sessions by default.
 * Otherwise, displays and fetches task and sessions based on props
 */
export const TaskSessionCalendar = (props: Props) => {
  const { eventType } = useTaskSessionCtx()

  const dispatch = useReduxDispatch()

  const isStudent = useSelector(selectIsStudent)
  const cwUserID = useSelector(selectCWUserID)
  const activeUserID = useSelector(selectUserID)
  const studentsByPK = useShallowSelector(getStudents)
  const tutorsByPK = useShallowSelector(getTutors)
  const locationsByPK = useShallowSelector(getLocations)

  const userID = isStudent ? activeUserID : props.userID
  const studentID = isStudent ? cwUserID : props.studentID

  const tasks = useSelector((state: RootState) =>
    filter(
      values(state.task.tasks),
      task => task.for_student === studentID && moment(task.due).isAfter() && !task.completed,
    ),
  )
  const sessions = useSelector((state: RootState) =>
    filter(
      values(state.tutoring.studentTutoringSessions),
      session => session.student === studentID && !session.cancelled,
    ),
  )

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const promises: Promise<any>[] = []
    promises.push(dispatch(fetchTutors()))
    if (isEmpty(studentsByPK)) {
      promises.push(dispatch(fetchStudents({})))
    }
    if (isEmpty(locationsByPK)) {
      promises.push(dispatch(fetchLocations()))
    }
    if (userID) {
      promises.push(dispatch(fetchTasks({ user: userID })))
    }
    if (studentID) {
      promises.push(dispatch(fetchStudentTutoringSessions({ student: studentID })))
    }
    setLoading(true)
    Promise.all(promises).finally(() => setLoading(false))
  }, [dispatch, locationsByPK, studentID, studentsByPK, userID])

  const handleFilter = (events: Event[]) => {
    // EventType filter
    switch (eventType) {
      case EventTypes.all:
        return events
      case EventTypes.task:
        return events.filter(ele => ele.className.includes(EventClassNames.task))
      case EventTypes.individual:
        return events.filter(ele => ele.className.includes(EventClassNames.individual))
      case EventTypes.group:
        return events.filter(ele => ele.className.includes(EventClassNames.group))
      default:
        throw new Error('unknown event type')
    }
  }

  const events = handleFilter(createEventsFromTasksAndSessions(tasks, sessions))

  // Add icons to events
  const titleAccessor = (event: Event) => {
    let icon: JSX.Element = <UserOutlined />
    if (event.className.includes(EventClassNames.group)) {
      icon = <TeamOutlined />
    } else if (event.className.includes(EventClassNames.task)) {
      icon = <FileDoneOutlined />
    }
    return (
      <span>
        {icon} {event.title}
      </span>
    )
  }

  // Tooltip with some additional context for events
  const tooltipAccessor = (event: Event) => {
    switch (event.className) {
      case EventClassNames.individual:
        return `Individual session: ${event.title}`
      case EventClassNames.individualPast:
        return `Individual session: ${event.title}`
      case EventClassNames.group:
        return `Group session: ${event.title}`
      case EventClassNames.groupPast:
        return `Group session: ${event.title}`
      case EventClassNames.task:
        return `Task: ${event.title}`
      case EventClassNames.taskPast:
        return `Task: ${event.title}`
      default:
        return ''
    }
  }

  const renderLocationDetails = (location: Location) => (
    <div>
      <div>{location ? location.name : `Remote`}</div>
      {location ? renderAddressDetails(location) : null}
    </div>
  )

  const renderContent = (item: StudentTutoringSession | Task) => {
    let itemLabel: string
    if ((item as StudentTutoringSession).individual_session_tutor) {
      // Must be an individual StudentTutoringSession
      itemLabel = 'Individual Session:'
    } else if ((item as StudentTutoringSession).group_tutoring_session) {
      // Must be a group StudenttutoringSession
      itemLabel = 'Group Session:'
    } else if ((item as Task).for_student) {
      // Must be a Task
      itemLabel = 'Task:'
    } else {
      // Fallback
      itemLabel = 'Event:'
    }

    return (
      <div className="wrapper-task-session-calendar-event-detail">
        <div className="event-detail-row">
          <div className="event-detail-label">{itemLabel}</div>
          <div className="event-detail-value">
            {!isStudent && (item as StudentTutoringSession).verbose_title
              ? (item as StudentTutoringSession).verbose_title
              : item.title}
          </div>
        </div>
        {/* If this is a session, resource.student will be defined; if task, resource.for_student will be defined */}
        {!isStudent && (
          <div className="event-detail-row">
            <div className="event-detail-label">Student:</div>
            <div className="event-detail-value">
              {getFullName(
                studentsByPK[(item as StudentTutoringSession)?.student || ((item as Task)?.for_student as number)],
              )}
            </div>
          </div>
        )}
        {/* Prevents displaying Tutor field for Tasks */}
        {((item as StudentTutoringSession).individual_session_tutor ||
          (item as StudentTutoringSession).primary_tutor) && (
          <div className="event-detail-row">
            <div className="event-detail-label">Tutor:</div>
            <div className="event-detail-value">
              {getFullName(
                tutorsByPK[
                  (item as StudentTutoringSession).individual_session_tutor ||
                    (item as StudentTutoringSession).primary_tutor
                ],
              )}
            </div>
          </div>
        )}
        {(item as StudentTutoringSession).note && (
          <div className="event-detail-row">
            <div className="event-detail-label">Note:</div>
            <div className="event-detail-value">{(item as StudentTutoringSession).note}</div>
          </div>
        )}
        {(item as StudentTutoringSession).location ? (
          <div className="event-detail-row">
            <div className="event-detail-label">Location:</div>
            <div className="event-detail-value">
              {renderLocationDetails(locationsByPK[(item as StudentTutoringSession).location])}
            </div>
          </div>
        ) : (
          <div className="event-detail-row">
            <div className="event-detail-label">Location:</div>
            <div className="event-detail-value">Remote</div>
          </div>
        )}
        {(item as StudentTutoringSession).zoom_url && (
          <div className="event-detail-row">
            <div className="event-detail-label">Zoom Link:</div>
            <div className="event-detail-value">{item.zoom_url}</div>
          </div>
        )}
      </div>
    )
  }

  return loading ? (
    <div className={styles.calendarLoader}>
      <LoadingOutlined className={styles.calendarSpinner} spin />
    </div>
  ) : (
    <div className={styles.calendarTaskSession}>
      <Calendar
        popup
        localizer={localizer}
        defaultView={Views.Month}
        views={values(Views)}
        min={min}
        max={max}
        events={events}
        titleAccessor={titleAccessor}
        tooltipAccessor={tooltipAccessor}
        eventPropGetter={event => {
          return { className: event.className }
        }}
        formats={calendarDateFormats}
        onDoubleClickEvent={(event, e) => {
          Modal.info({
            className: 'container-task-session-cal-modal',
            centered: true,
            icon: <CalendarTwoTone />,
            title: <h3 className="calendar-event-detail-title">Event Details</h3>,
            content: renderContent(event.item),
            maskClosable: true,
          })
        }}
      />
    </div>
  )
}
