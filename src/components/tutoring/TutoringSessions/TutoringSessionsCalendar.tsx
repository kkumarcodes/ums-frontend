// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CalendarTwoTone, LoadingOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Modal, Popconfirm } from 'antd'
import { ModalFuncProps } from 'antd/lib/modal'
import { getFullName, handleError, handleSuccess, renderAddressDetails } from 'components/administrator'
import styles from 'components/tutoring/styles/TutoringSessionsCalendar.scss'
import { SessionStatus, SessionType, useTutoringSessionsCtx } from 'components/tutoring/TutoringSessions'
import { useShallowSelector } from 'libs'
import { calendarDateFormats } from 'libs/ScheduleSelector/date-utils'
import { isEmpty, values } from 'lodash'
import moment from 'moment'
import 'moment/locale/en-gb'
import React, { useEffect, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { getLocations, selectTutoringSessions } from 'store/tutoring/tutoringSelectors'
import { fetchLocations, updateStudentTutoringSession } from 'store/tutoring/tutoringThunks'
import { GroupTutoringSession, StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { getStudents, getTutors, selectCWUserID, selectUserType } from 'store/user/usersSelector'
import { fetchStudents } from 'store/user/usersThunks'
import { UserType } from 'store/user/usersTypes'
import { useLocaleCtx } from '../../../apps/LocaleContext'

const DNDCalendar = withDragAndDrop(Calendar)

type TableRecord = Partial<StudentTutoringSession> | Partial<GroupTutoringSession>

enum Views {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

enum EventClassNames {
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
  item: StudentTutoringSession | GroupTutoringSessionand
}

const localMap = {
  enGB: 'en-GB',
  enUS: 'en-US',
}

/**
 * Renders a calendar that displays upcoming individual and group tutoring sessions for a tutor
 */
export const TutoringSessionsCalendar = () => {
  const { sessionType, sessionStatus } = useTutoringSessionsCtx()

  const dispatch = useReduxDispatch()

  /** Note: tutoringSessions is a mix of StudentTutoringSessions (individual and booked group) and GroupTutoringSessions */
  const tutoringSessions = useSelector(selectTutoringSessions)
  const userType = useSelector(selectUserType)
  const currentCWUserID = useSelector(selectCWUserID)
  const studentsByPK = useShallowSelector(getStudents)
  const tutorsByPK = useShallowSelector(getTutors)
  const locationsByPK = useShallowSelector(getLocations)

  const [loading, setLoading] = useState(false)
  const { locale } = useLocaleCtx()

  moment.locale(localMap[locale])
  const localizer = momentLocalizer(moment)

  useEffect(() => {
    const promises: Promise<any>[] = []
    if (isEmpty(studentsByPK)) {
      promises.push(dispatch(fetchStudents({})))
    }
    if (isEmpty(locationsByPK)) {
      promises.push(dispatch(fetchLocations()))
    }
    setLoading(true)
    Promise.all(promises).finally(() => setLoading(false))
  }, [dispatch, locationsByPK, studentsByPK])

  const createEventsFromSessions = (tutoringSessions: any): Event[] => {
    const sessionsToUse =
      userType === UserType.Tutor
        ? tutoringSessions.filter(
            s => s.primary_tutor === currentCWUserID || s.individual_session_tutor === currentCWUserID,
          )
        : tutoringSessions
    return sessionsToUse.map((ele: TableRecord) => {
      let { title } = ele
      if ((ele as StudentTutoringSession).individual_session_tutor) {
        const session = ele as StudentTutoringSession
        if (userType === UserType.Tutor) {
          const student = studentsByPK[session.student]
          title = student ? getFullName(student) : title
        }
      }

      if ((ele as StudentTutoringSession).is_tentative) {
        title = `TENTATIVE ${title}`
      }

      const getClassName = () => {
        if ((ele as StudentTutoringSession)?.individual_session_tutor) {
          return ele.start && moment(ele.start).isBefore() ? EventClassNames.individualPast : EventClassNames.individual
        }
        return ele.start && moment(ele.start).isBefore() ? EventClassNames.groupPast : EventClassNames.group
      }

      return {
        title,
        start: new Date(ele.start as string),
        end: new Date(ele.end as string),
        allDay: false,
        className: getClassName(),
        item: ele,
      }
    })
  }

  const handleFilter = (tutoringSessions: TableRecord[]) => {
    let filtered = tutoringSessions
    // Used to only filter out "Completed Sessions" that took place yesterday or later
    const startOfDay = moment().startOf('day')

    // Session Status filters (Upcoming, Completed, Missed, Cancelled)
    if (!sessionStatus.includes(SessionStatus.cancelled)) {
      filtered = filtered.filter(ele => !ele.cancelled)
    }
    if (!sessionStatus.includes(SessionStatus.missed)) {
      filtered = filtered.filter(ele => !(ele as StudentTutoringSession).missed)
    }
    if (!sessionStatus.includes(SessionStatus.completed)) {
      filtered = filtered.filter(
        ele => !moment(ele.start).isBefore(startOfDay) || (ele as StudentTutoringSession).missed || ele.cancelled,
      )
    }
    if (!sessionStatus.includes(SessionStatus.upcoming)) {
      filtered = filtered.filter(ele => !moment(ele.start).isAfter() || ele.cancelled)
    }
    // Special Case that deals with "Completed Sessions" funny logic on line 102
    // We hide Completed sessions on current date if Upcoming and Completed filters unchecked
    if (!sessionStatus.includes(SessionStatus.upcoming) && !sessionStatus.includes(SessionStatus.completed)) {
      filtered = filtered.filter(
        ele => !moment(ele.start).isSame(moment(), 'd') || (ele as StudentTutoringSession).missed || ele.cancelled,
      )
    }
    // Session Type filter
    if (!sessionType.includes(SessionType.individual)) {
      filtered = (filtered as StudentTutoringSession[]).filter(ele => !ele?.individual_session_tutor)
    }
    if (!sessionType.includes(SessionType.group)) {
      filtered = (filtered as GroupTutoringSession[]).filter(ele => !ele?.support_tutors)
    }
    return filtered
  }

  const renderContent = (item: StudentTutoringSession | GroupTutoringSession) => {
    let itemLabel: string
    if ((item as StudentTutoringSession).individual_session_tutor) {
      // Must be an individual tutoring session
      itemLabel = 'Individual Session:'
    } else if (item.primary_tutor) {
      // Must be a group tutoring session
      itemLabel = 'Group Session:'
    } else {
      // Fallback
      itemLabel = 'Event:'
    }
    const student = studentsByPK[(item as StudentTutoringSession)?.student]
    return (
      <div className="wrapper-tutoring-session-calendar-event-detail">
        <div className="event-detail-row">
          <div className="event-detail-label">{itemLabel}</div>
          <div className="event-detail-value">{item.verbose_title ? item.verbose_title : item.title}</div>
        </div>
        {/* Note: Only StudentTutoringSessions have an associated student */}
        {(item as StudentTutoringSession).individual_session_tutor && (
          <div className="event-detail-row">
            <div className="event-detail-label">Student:</div>
            <div className="event-detail-value">
              {getFullName(student)}
              <p className="help">
                {student.phone && <br />}

                {student.email}
              </p>
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
            <div className="event-detail-value">{renderAddressDetails(locationsByPK[item.location])}</div>
          </div>
        )}
      </div>
    )
  }

  // Add icons to events
  const titleAccessor = (event: Event) => {
    let icon = <UserOutlined />
    if (event.className.includes(EventClassNames.group)) {
      icon = <TeamOutlined />
    }
    return (
      <div className="title-accessor-wrapper">
        {icon}
        <strong>&nbsp;&nbsp;{moment(event.start).format('h:mma')}</strong>
        <div className="calendar-event-title">&nbsp;&nbsp;{event.title}</div>
      </div>
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
    // Make sure we're not just selecting a date, which is not that useful
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

  // We start events at 7am unless there is an earlier event
  const events = createEventsFromSessions(handleFilter(tutoringSessions))
  const startHours = [7, ...events.map(e => moment(e.start).hour())]
  const min = new Date(
    moment()
      .hour(Math.min(...startHours))
      .minute(0)
      .millisecond(0)
      .toISOString(),
  )
  const max = new Date(moment().hour(23).minute(0).millisecond(0).toISOString())

  const confirm = (pk, modalRef) => {
    const cancelledSession = {
      set_cancelled: true,
      missed: false,
    }

    dispatch(updateStudentTutoringSession(pk, cancelledSession))
      .then(() => {
        handleSuccess('Session cancelled!')
      })
      .catch(err => handleError('Failed to cancel session.'))
      .finally(() => {
        modalRef.destroy()
      })
  }

  const renderTitle = (
    item: StudentTutoringSession,
    modalRef: {
      destroy: () => void
      update: (newConfig: ModalFuncProps) => void
    },
  ) => {
    return (
      <div className="calendar-event-title-wrapper">
        <h3 className="calendar-event-detail-title">Event Details</h3>
        {(item as StudentTutoringSession).individual_session_tutor && (
          <Popconfirm
            title="Are you sure you want to cancel?"
            onConfirm={() => {
              confirm(item.pk, modalRef)
            }}
            okText="Yes, cancel"
            cancelText="No"
          >
            <Button className="cancel-session" type="dashed">
              Cancel Session
            </Button>
          </Popconfirm>
        )}
      </div>
    )
  }

  // Individual Events have the added option to launch a rescheduling modal
  const handleDoubleClickEvent = (event: Event) => {
    if (event.className.includes(EventClassNames.individual)) {
      const modalRef = Modal.confirm({
        className: 'container-tutoring-session-cal-modal',
        centered: true,
        icon: <CalendarTwoTone />,

        content: renderContent(event.item),
        maskClosable: true,
        cancelText: 'Reschedule',
        cancelButtonProps: { disabled: (event.item as StudentTutoringSession).is_tentative },
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
      modalRef.update({ title: renderTitle(event.item as StudentTutoringSession, modalRef) })
    }
    if (event.className.includes(EventClassNames.group)) {
      Modal.info({
        className: 'container-tutoring-session-cal-modal',
        centered: true,
        icon: <CalendarTwoTone />,
        title: <h3 className="calendar-event-detail-title">Event Details</h3>,
        content: renderContent(event.item),
        maskClosable: true,
      })
    }
  }

  const handleDrop = ({ start, end, event }: { start: Date; end: Date; event: Event }) => {
    dispatch(
      showModal({
        props: {
          studentID: (event.item as StudentTutoringSession).student,
          tutorID: (event.item as StudentTutoringSession).individual_session_tutor,
          sessionID: event.item.pk,
          sessionDetails: event.item,
          start: moment(start).toISOString(),
        },
        modal: MODALS.EDIT_TUTORING_SESSION,
      }),
    )
  }

  return loading ? (
    <div className={styles.calendarLoader}>
      <LoadingOutlined className={styles.calendarSpinner} spin />
    </div>
  ) : (
    // calendar month view requires a container height
    <div className={styles.tutoringSessionsCalendar}>
      <DNDCalendar
        popup
        titleAccessor={titleAccessor}
        tooltipAccessor={tooltipAccessor}
        localizer={localizer}
        defaultView={Views.Month}
        views={values(Views)}
        min={min}
        max={max}
        events={events}
        eventPropGetter={event => ({
          className: event.className,
        })}
        selectable="ignoreEvents"
        onSelectSlot={slotSelected}
        formats={calendarDateFormats}
        onDoubleClickEvent={handleDoubleClickEvent}
        onEventDrop={handleDrop}
        draggableAccessor={(event: Event) => !(event.item as GroupTutoringSession).primary_tutor}
      />
    </div>
  )
}
