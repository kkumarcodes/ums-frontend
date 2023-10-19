// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretRightOutlined, CheckCircleFilled, EditOutlined } from '@ant-design/icons'
import { Button, DatePicker, message, Skeleton } from 'antd'
import extractSessionTimes from 'libs/extractSessionTimes'
import { findIndex, groupBy, map, uniq, uniqBy } from 'lodash'
import moment, { Moment } from 'moment'
import React, { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAvailability } from 'store/availability/availabilitySelectors'
import { fetchAvailabilities } from 'store/availability/availabilityThunks'
import { useReduxDispatch } from 'store/store'
import { selectCounselor, selectIsAdmin, selectIsTutor } from 'store/user/usersSelector'
import styles from '../styles/IndividualSessionSelector.scss'

type MyProps = {
  duration?: number // Minutes
  availableMinutes: number // How many available hours (in minutes) student has. Determins ability to allow repeat
  granularity?: number
  tutorID?: number
  counselorID?: number
  start?: Moment
  end?: Moment
  disallowRepeat?: boolean
  sessionLocation?: number | 'null'
  onConfirm: (selectedTimes: Moment[]) => void
}

const DEFAULT_GRANULARITY = 30
const DEFAULT_DURATION = 6
// When booking multiple sessions, we try to show sessions on future same day of week and time as first
// selected session. This is tolerance in time (i.e. 1.5 hours after or before for selected time)
const RECURRING_SESSION_HOUR_TOLERANCE = 1.5

// Students and parents can only schedule sessions after this many hours from now

const SessionSelector = (props: MyProps) => {
  const dispatch = useReduxDispatch()

  const counselor = useSelector(selectCounselor(props.counselorID))
  const SCHEDULE_BUFFER_HOURS = counselor?.student_schedule_meeting_buffer_hours || 24

  const [loading, setLoading] = useState(false)
  // If we show all times for multiple sessions or just recurring times
  const [selectedIndividualTimes, setSelectedIndividualTimes] = useState<Moment[]>([])
  const [dateRange, setDateRange] = useState<[Moment, Moment]>([
    props.start || moment(),
    props.end || moment().add(2, 'week'),
  ])
  const [confirming, setConfirming] = useState(false)
  const duration = props.duration || DEFAULT_DURATION
  const numSessions = Math.floor(props.availableMinutes / duration)
  const isAdmin = useSelector(selectIsAdmin)
  const isTutor = useSelector(selectIsTutor)

  // Object where keys are the beginning of days and values are arrays of Moments
  // representing selectable times on that day

  // We only show times after this date
  const showTimesAfter = isAdmin || isTutor ? moment() : moment().add(SCHEDULE_BUFFER_HOURS, 'h')
  const availabilities = useSelector(selectAvailability({ counselor: props.counselorID, tutor: props.tutorID })).filter(
    a =>
      moment(a.start).isAfter(showTimesAfter) &&
      moment(a.start).isAfter(dateRange[0]) &&
      moment(a.start).isBefore(dateRange[1]),
  )

  const availableSessionTimes = useMemo(() => {
    // Duplicate times can get created when we cross UTC day boundary
    let allTimes = uniqBy(extractSessionTimes(availabilities, props.granularity || DEFAULT_GRANULARITY, duration), m =>
      m.valueOf(),
    )
    // If all selected times are on the same day of week, we filter for times around selected time
    if (selectedIndividualTimes.length && uniq(map(selectedIndividualTimes, t => t.day())).length === 1) {
      const startTime = selectedIndividualTimes[0]
      allTimes = allTimes.filter(
        t => t.day() === startTime.day() && Math.abs(t.hour() - startTime.hour()) <= RECURRING_SESSION_HOUR_TOLERANCE,
      )
    }
    return groupBy(allTimes, time => moment(time).startOf('D').toISOString())
  }, [availabilities, duration, props.granularity, selectedIndividualTimes])

  useEffect(() => {
    // Always re-load available session times
    setLoading(true)
    dispatch(
      fetchAvailabilities(
        { tutor: props.tutorID, counselor: props.counselorID },
        {
          start: moment(dateRange[0]).startOf('day').toISOString(),
          end: dateRange[1].endOf('day').toISOString(),
          location: props.sessionLocation,
        },
      ),
    ).then(() => setLoading(false))
  }, [dateRange, dispatch, props.counselorID, props.tutorID, props.sessionLocation])

  useEffect(() => {
    // If selecting first time, then we change range to be for as many sessions as can be booked
    // (and we'll filter shown sessions for those around the same time/day as first session)
    if (selectedIndividualTimes.length === 1) {
      const newMax = moment(selectedIndividualTimes[0]).add(numSessions, 'week').add(1, 'day')
      if (newMax.valueOf() > dateRange[1].valueOf()) {
        // Expand our date range to pull in times for potential recurring session
        setDateRange([dateRange[0], newMax])
      }
    }
  }, [duration, numSessions, props.availableMinutes, selectedIndividualTimes]) // eslint-disable-line react-hooks/exhaustive-deps

  // Set confirming (so we show summary and set times in our parent using props.onConfirm)
  const confirm = (times = selectedIndividualTimes) => {
    setConfirming(true)
    props.onConfirm(times)
  }

  // Reset selected times in parent to none (keep them locally) and turn off edit mode
  const unconfirm = () => {
    props.onConfirm([])
    setConfirming(false)
  }

  // Select or deselect a time
  const toggleTime = (time: Moment) => {
    const idx = findIndex(selectedIndividualTimes, t => t.valueOf() === time.valueOf())
    if (idx > -1) {
      setSelectedIndividualTimes(selectedIndividualTimes.filter(t => t.valueOf() !== time.valueOf()))
    } else {
      if (selectedIndividualTimes.length >= numSessions) {
        message.warning('You have used all of your hours. Please deselect a time to select a new time')
        return
      }
      const newTimes = [...selectedIndividualTimes, time].sort((a, b) => a.valueOf() - b.valueOf())
      if (numSessions - newTimes.length < 1) {
        confirm(newTimes)
      }
      setSelectedIndividualTimes(newTimes)

      // If we can't select any more times, then let's move on!
      if (numSessions <= newTimes.length || (newTimes.length > 0 && props.disallowRepeat)) {
        confirm(newTimes)
      }
    }
  }

  // Render confirmation button
  const renderConfirmationContainer = () => {
    if (!selectedIndividualTimes.length || confirming) {
      return ''
    }
    return (
      <div className="confirmation-container">
        <Button type="primary" onClick={() => confirm(selectedIndividualTimes)}>
          Confirm {selectedIndividualTimes.length} session{selectedIndividualTimes.length !== 1 ? 's' : ''}
          <CaretRightOutlined />
        </Button>
      </div>
    )
  }

  // Renders a summary of selected times, for when we're in confirmation mode
  const renderSummary = () => {
    return (
      <div className="individual-session-times-confirmation">
        <p>You are creating sessions on:</p>
        <ul>
          {selectedIndividualTimes.map(t => (
            <li key={t.valueOf()}>{moment(t).format('MMM Do h:mma')}</li>
          ))}
        </ul>
        <Button type="link" onClick={unconfirm}>
          <EditOutlined />
          Edit Selected Session Times
        </Button>
      </div>
    )
  }

  // Renders our list of potential times as toggle-able buttons
  const renderSessionTimeButtons = () => {
    const sessionTimeValues = selectedIndividualTimes.map(t => t.valueOf())
    return (
      <div className="individual-session-times">
        {!Object.keys(availableSessionTimes).length && <p className="center empty-state">No available session times</p>}
        {Object.keys(availableSessionTimes).map(dayStart => {
          return (
            <div className="day" key={dayStart.valueOf()}>
              <div className="day-header">{moment(dayStart).format('dddd MMM Do')}</div>
              <div className="toggle-buttons-container">
                {availableSessionTimes[dayStart].map(time => (
                  <Button onClick={() => toggleTime(time)} key={time.valueOf()} className="toggle-button">
                    {sessionTimeValues.includes(time.valueOf()) ? <CheckCircleFilled /> : ''}
                    {time.format('h:mma')}
                  </Button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderRangePicker = () => {
    return (
      <div className="range-container">
        <DatePicker.RangePicker
          value={dateRange}
          defaultValue={dateRange}
          allowClear={false}
          onChange={setDateRange}
          disabledDate={d => d.isAfter(moment().add(9, 'month')) || d.isBefore(moment())}
        />
        {numSessions > 1 && !props.disallowRepeat && (
          <p className="help">You may select up to {numSessions} session times</p>
        )}
      </div>
    )
  }

  if (loading) {
    return <Skeleton />
  }

  return (
    <div className={styles.sessionSelector}>
      {!confirming && renderRangePicker()}
      {confirming && renderSummary()}
      {!confirming && renderSessionTimeButtons()}
      {renderConfirmationContainer()}
    </div>
  )
}

export default SessionSelector
