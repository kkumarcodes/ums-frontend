// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useMemo } from 'react'
import { values } from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import { TeamOutlined, UserOutlined, FieldTimeOutlined, CalendarTwoTone } from '@ant-design/icons'

import moment from 'moment-timezone'
import { renderAddressDetails } from 'components/administrator'
import { StudentTutoringSession, GroupTutoringSession, Location } from 'store/tutoring/tutoringTypes'
import { SessionType } from 'components/tutoring/TutoringSessions'
import { useReduxDispatch } from 'store/store'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { calendarDateFormats } from 'libs/ScheduleSelector/date-utils'
import { Modal } from 'antd'
import { getStudents, getTutors } from 'store/user/usersSelector'
import { getLocations } from 'store/tutoring/tutoringSelectors'
import { Availability } from 'store/availability/availabilityTypes'
import { useOperationsCalendarCtx } from './OperationsCalendarContext'

import styles from './OperationsCalendar.scss'
import { getFullName } from '../utils'

enum Views {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

enum EventClassNames {
  individual = 'rbc-ops-event-individual',
  group = 'rbc-ops-event-group',
  prospective = 'rbc-ops-prospective-event',
  availability = 'rbc-ops-availability',
}

type Event = {
  allDay: boolean
  type: EventClassNames
  pk?: number
  displayTitle: string
  item: StudentTutoringSession | GroupTutoringSession
}

export type ProspectiveEvent = {
  title: string
  start: Date
  end: Date
}

interface AvailabilityWithName extends Availability {
  tutor_name: string
}

// Props for if we're showing fixed weeks' availability
type Props = {
  // Prospective items to display on calendar (will be green)
  prospectiveEvents?: ProspectiveEvent[]
  showConsistentAvailability?: boolean
  start?: string // datetime
  numWeeks?: number
  disableEventCreation?: boolean
}

const OperationsCalendar = (props: Props) => {
  const dispatch = useReduxDispatch()
  // We get filter values from our context (shared with OperationsCalendarFilter component)
  const {
    tutors,
    locations,
    sessionType,
    includeRemote,
    availabilityTutors,
    includeTutorAvailability,
  } = useOperationsCalendarCtx()

  // Get students, tutors, locations from store to display in detail context modal
  const studentsByPK = useSelector(getStudents, shallowEqual)
  const tutorsByPK = useSelector(getTutors, shallowEqual)
  const locationsByPK = useSelector(getLocations, shallowEqual)

  const { individualSessions, groupSessions } = useSelector((state: RootState) => {
    return {
      individualSessions: values(state.tutoring.studentTutoringSessions).filter(s => s.individual_session_tutor),
      groupSessions: values(state.tutoring.groupTutoringSessions),
    }
  }, shallowEqual)

  const tutorAvailability = useSelector((state: RootState) => {
    const availabilities: AvailabilityWithName[] = state.availability.availabilities
      .filter(a => a.tutor && availabilityTutors.includes(a.tutor))
      .map(t => ({ ...t, tutor_name: getFullName(state.user.tutors[t.tutor as number]) }))
    return availabilities
  })

  /** Helper function to turn our sessions into Event objs that appear on calendar*/
  const mapper = (session: GroupTutoringSession | StudentTutoringSession) => ({
    title: `${session.is_tentative ? 'TENTATIVE' : ''} ${session.verbose_title}`,
    location: session.location,
    start: new Date(session.start),
    pk: session.pk,
    end: new Date(session.end),
    allDay: false,
    type: session.individual_session_tutor ? EventClassNames.individual : EventClassNames.group,
    item: session,
  })

  // The events to display in calendar. We memo based on filter params
  let filteredEvents = useMemo(() => {
    let events: Event[] = []
    if (sessionType === SessionType.all || sessionType === SessionType.individual) {
      events = events.concat(
        individualSessions
          .filter(
            s =>
              !s.cancelled &&
              (locations.includes(s.location) || (!s.location && includeRemote)) &&
              tutors.includes(s.individual_session_tutor as number) &&
              (includeRemote || !s.is_remote),
          )
          .map(mapper),
      )
    }
    if (sessionType === SessionType.group || sessionType === SessionType.all) {
      events = events.concat(
        groupSessions
          .filter(
            s =>
              !s.cancelled &&
              (locations.includes(s.location) || (!s.location && includeRemote)) &&
              tutors.includes(s.primary_tutor) &&
              (includeRemote || !s.is_remote),
          )
          .map(mapper),
      )
    }
    return events
  }, [groupSessions, includeRemote, individualSessions, locations, sessionType, tutors])

  if (includeTutorAvailability) {
    filteredEvents = filteredEvents.concat(
      tutorAvailability.map(a => ({
        title: `${a.tutor_name}`,
        start: new Date(a.start),
        end: new Date(a.end),
        allDay: false,
        type: EventClassNames.availability,
        pk: a.pk,
      })),
    )
  }

  if (props.prospectiveEvents) {
    filteredEvents = filteredEvents.concat(
      props.prospectiveEvents.map(e => ({ ...e, allDay: false, type: EventClassNames.prospective })),
    )
  }

  // Apply className to events
  const eventStyler = (event: Event) => {
    return {
      className: `${event.type} ${event.item?.is_tentative ? 'tentative' : ''}`,
    }
  }

  // Add icons to events
  const titleAccessor = (event: Event) => {
    let icon: JSX.Element = <UserOutlined />
    if (event.type === EventClassNames.group) {
      icon = <TeamOutlined />
    } else if (event.type === EventClassNames.availability) {
      icon = <FieldTimeOutlined />
    }
    return (
      <span>
        {icon} {event.title}
      </span>
    )
  }

  // Tooltip with some additional context for events
  const tooltipAccessor = (event: Event) => {
    switch (event.type) {
      case EventClassNames.individual:
        return `Individual session: ${event.title}`
      case EventClassNames.group:
        return `Group session: ${event.title}`
      default:
        return ''
    }
  }

  const slotSelected = (slotinfo: {
    start: string | Date
    end: string | Date
    slots: string[] | Date[]
    action: 'select' | 'click' | 'doubleClick'
  }) => {
    if (slotinfo.start !== slotinfo.end) {
      dispatch(
        showModal({
          modal: MODALS.CREATE_TUTORING_SESSION,
          props: {
            start: slotinfo.start.toString(),
          },
        }),
      )
    }
  }

  // TODO: Abstract context modal to reduce code duplication in: TaskSessionCalendar, TutoringSessionsCalendar and here
  const renderLocationDetails = (location: Location) => (
    <div>
      <div>{location.name}</div>
      {renderAddressDetails(location)}
    </div>
  )

  const renderContent = (item: StudentTutoringSession | GroupTutoringSession) => {
    return (
      <div className="wrapper-operations-calendar-event-detail">
        <div className="event-detail-row">
          <div className="event-detail-label">Event: </div>
          <div className="event-detail-value">{item?.verbose_title ? item.verbose_title : item.title}</div>
        </div>
        {/* Note: Only StudentTutoringSessions have an associated student */}
        {(item as StudentTutoringSession).individual_session_tutor && (
          <div className="event-detail-row">
            <div className="event-detail-label">Student:</div>
            <div className="event-detail-value">
              {getFullName(studentsByPK[(item as StudentTutoringSession)?.student])}
            </div>
          </div>
        )}
        {(item.primary_tutor || (item as StudentTutoringSession).individual_session_tutor) && (
          <div className="event-detail-row">
            <div className="event-detail-label">Tutor:</div>
            <div className="event-detail-value">
              {getFullName(tutorsByPK[(item as StudentTutoringSession).individual_session_tutor || item.primary_tutor])}
            </div>
          </div>
        )}
        {(item as StudentTutoringSession).note && (
          <div className="event-detail-row">
            <div className="event-detail-label">Note:</div>
            <div className="event-detail-value">{(item as StudentTutoringSession).note}</div>
          </div>
        )}
        {item.location && (
          <div className="event-detail-row">
            <div className="event-detail-label">Location:</div>
            <div className="event-detail-value">{renderLocationDetails(locationsByPK[item.location])}</div>
          </div>
        )}
      </div>
    )
  }

  // Individual Events have the added option to launch a rescheduling modal
  const handleDoubleClickEvent = (event: Event) => {
    /** Only launch modal on Tutoring Session events */
    if (event.type === EventClassNames.availability || event.type === EventClassNames.prospective) {
      return null
    }
    if (event.type === EventClassNames.individual) {
      const modalRef = Modal.confirm({
        className: 'container-operations-cal-modal',
        centered: true,
        icon: <CalendarTwoTone />,
        title: <h3 className="calendar-event-detail-title">Event Details</h3>,
        content: renderContent(event.item),
        maskClosable: true,
        cancelText: 'Reschedule',
        onCancel: cancelEvent => {
          modalRef.destroy()
          // Only launch Reschedule modal if Event Details modal is closed by clicking "Reschedule" button
          if (typeof cancelEvent === 'function') {
            dispatch(
              showModal({
                props: {
                  studentID: (event.item as StudentTutoringSession).student,
                  tutorID: (event.item as StudentTutoringSession).individual_session_tutor,
                  sessionID: event.item.pk,
                  sessionDetails: event.item,
                },
                modal: MODALS.EDIT_TUTORING_SESSION,
              }),
            )
          }
        },
      })
    }
    if (event.type === EventClassNames.group) {
      Modal.info({
        className: 'container-operations-cal-modal',
        centered: true,
        icon: <CalendarTwoTone />,
        title: <h3 className="calendar-event-detail-title">Event Details</h3>,
        content: renderContent(event.item),
        maskClosable: true,
      })
    }
  }

  return (
    <div className={styles.operationsCalendar}>
      <div className="timezone-warning center">
        Please note that everything on this calendar is shown in your local timezone: {moment.tz.guess()}
      </div>
      <Calendar
        localizer={momentLocalizer(moment)}
        defaultView={Views.Week}
        style={{ height: 800 }}
        showMultiDayTimes={true}
        views={values(Views)}
        selectable={props.disableEventCreation ? false : 'ignoreEvents'}
        onSelectSlot={slotSelected}
        events={filteredEvents}
        eventPropGetter={eventStyler}
        tooltipAccessor={tooltipAccessor}
        titleAccessor={titleAccessor}
        formats={calendarDateFormats}
        onDoubleClickEvent={handleDoubleClickEvent}
      />
    </div>
  )
}

export default OperationsCalendar
