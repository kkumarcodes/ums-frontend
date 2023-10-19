// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { InfoCircleTwoTone } from '@ant-design/icons'
import { Button, ConfigProvider, DatePicker, Skeleton, Tag } from 'antd'
import en_GB from 'antd/es/locale/en_GB'
import { reverseEnumKeys, TagColors } from 'components/administrator'
import styles from 'components/tutoring/styles/TutorAvailabilitySummary.scss'
import { getTrimester } from 'libs/ScheduleSelector/date-utils'
import { has } from 'lodash'
import moment, { Moment } from 'moment-timezone'
import 'moment/locale/en-gb'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  getRecurringAvailability,
  selectAvailability,
  selectLocalizedRecurringAvailability,
} from 'store/availability/availabilitySelectors'
import { fetchAvailabilities, fetchRecurringAvailability } from 'store/availability/availabilityThunks'
import { Availabilities, Weekdays } from 'store/availability/availabilityTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { fetchLocations } from 'store/tutoring/tutoringThunks'
import { fetchCounselor, fetchTutor } from 'store/user/usersThunks'
import { AvailabilityRecurring } from './AvailabilityRecurring'

moment.locale('en-gb')

const dateFormat = 'YYYY-MM-DD'
const timeFormat = 'h:mm a'

const weekday = new Date().getDay()
const daysFromMonday = weekday > 0 ? weekday - 1 : 6

type Props = {
  tutor?: number
  counselor?: number
}

export const AvailabilitySummary = ({ tutor, counselor }: Props) => {
  const dispatch = useReduxDispatch()

  // Monday at 6 am on of the selected week
  const [selectedDate, setSelected] = useState(
    // moment().hour(8).minute(0).second(0).millisecond(0).subtract(daysFromMonday, 'd'),
    //! Change I made that might break things
    moment().hour(6).minute(0).second(0).millisecond(0).subtract(daysFromMonday, 'd'),
  )

  // Pull recurring availability out of store. Map it from UTC to local time so we can display on the calendar
  // Note that we need to be careful to account for transition between trimesters being in middle of week
  const recurringAvailability = useSelector(selectLocalizedRecurringAvailability(selectedDate))
  // Pull recurring availability locations and determine active trimester locations JSON
  const recurringAvailabilityLocations = useSelector(getRecurringAvailability)?.locations

  const availabilities = useSelector(selectAvailability({ tutor, counselor })).filter(availability => {
    return (
      moment(availability.start).isSameOrAfter(selectedDate) &&
      moment(availability.start).isSameOrBefore(moment(selectedDate).add(1, 'week'))
    )
  })

  const [loading, setLoading] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)

  // New date is chosen
  const onChange = (date: Moment | null, dateString: string) => {
    const selectedDaysFromSunday = date?.day() || 0
    const newDate = date
      ? moment(date).subtract(selectedDaysFromSunday > 0 ? selectedDaysFromSunday - 1 : 6, 'd')
      : selectedDate
    setSelected(newDate)
  }

  useEffect(() => {
    if (!isRecurring) {
      setLoading(true)
      const promises: Promise<any>[] = [
        dispatch(
          fetchAvailabilities(
            { tutor, counselor },
            {
              start: selectedDate.clone().toISOString(),
              end: selectedDate.clone().add(6, 'd').hour(23).minute(0).second(0).millisecond(0).toISOString(),
              exclude_sessions: false,
              use_recurring_availability: false,
              for_availability_view: true,
            },
          ),
        ),
        dispatch(fetchRecurringAvailability({ tutor, counselor })),
        dispatch(fetchLocations()),
      ]
      if (tutor) promises.push(dispatch(fetchTutor(tutor)))
      else if (counselor) promises.push(dispatch(fetchCounselor(counselor)))

      Promise.all(promises).finally(() => setLoading(false))
    }
  }, [dispatch, selectedDate, isRecurring, tutor, counselor])

  const openAvailabilityModal = (start: Moment, isRecurring: boolean, day: string) => {
    const defaultLocation = recurringAvailabilityLocations
      ? recurringAvailabilityLocations[getTrimester(start)][day]
      : undefined
    dispatch(
      showModal({
        modal: MODALS.AVAILABILITY,
        props: {
          tutor,
          counselor,
          isRecurring,
          //! Change I made that might break things
          // start: moment(start).hour(8).minute(0).second(0).millisecond(0).toISOString(),
          // end: moment(start).hour(23).minute(0).second(0).millisecond(0).toISOString(),
          start: moment(start).hour(6).minute(0).second(0).millisecond(0).toISOString(),
          end: moment(start).hour(23).minute(0).second(0).millisecond(0).toISOString(),
          defaultLocation,
          day,
        },
      }),
    )
  }

  // create AvailabilitiesByDate (i.e. what we show) from availabilities
  let availabilitiesByDate: Availabilities = {}
  // Is this a non-trivial availabilities => [{tutor: [tutorID]}] is returned if no availabilities for selected range
  const daysWithEmptyAvailability = new Set()
  if (availabilities[0]?.start) {
    availabilitiesByDate = availabilities.reduce((acc, cur: { start: string; end: string }) => {
      const { start, end } = cur
      // Exclude availabilities with duration 0
      if (start !== end) {
        if (has(acc, moment(start).format(dateFormat))) {
          acc[moment(start).format(dateFormat)].push({
            start: moment(start).format(timeFormat),
            end: moment(end).format(timeFormat),
          })
          return acc
        }
        acc[moment(start).format(dateFormat)] = [
          { start: moment(start).format(timeFormat), end: moment(end).format(timeFormat) },
        ]
      } else {
        daysWithEmptyAvailability.add(moment(start).format(dateFormat))
      }
      return acc
    }, {} as Availabilities)
  }

  /**
   * Returns all of the tags - including both recurring and standard availability - that should be displayed
   * for a day
   * @param date  the date (we'll format with dateFormat) on which we want to display tags
   * @returns One or more Tag JSX elements
   */
  const getTagsForDay = (date: Moment) => {
    const dateIdx = date.format(dateFormat)
    if (
      !availabilitiesByDate[dateIdx] &&
      !daysWithEmptyAvailability.has(dateIdx) &&
      recurringAvailability &&
      recurringAvailability[date.format('dddd').toLowerCase()]
    ) {
      // Display recurring availability
      return recurringAvailability[date.format('dddd').toLowerCase()].map(ra => {
        const end = ra.end.minute() === 59 ? moment(ra.end).add(1, 'minute') : ra.end
        return (
          <Tag key={`ra-${ra.start.toISOString()}`} color={TagColors.default}>
            Recurring: {`${ra.start.format(timeFormat)} - ${end.format(timeFormat)}`}
          </Tag>
        )
      })
    }
    if (availabilitiesByDate[dateIdx]) {
      // Display standard availability
      return availabilitiesByDate[dateIdx].map(ava => (
        <Tag key={`${ava.start}`} color={TagColors.blue}>{`${ava.start} - ${ava.end}`}</Tag>
      ))
    }
    return null
  }

  /** Renders table that user can use to set their (non-recurring) availability for the selected week */
  const renderSummaryTable = () => {
    if (loading || isRecurring) {
      return null
    }
    return reverseEnumKeys(Weekdays).map((ele, idx) => {
      const rowDate = moment(selectedDate).add(idx, 'd')
      return (
        <React.Fragment key={ele}>
          <div key={ele} className="row">
            <div className="flexRowItemDays">{`${Weekdays[Number(ele)]}, ${rowDate.format('MMM DD')}`}</div>
            <div className="flexRowItemTimes">{getTagsForDay(moment(selectedDate).add(idx, 'd'))}</div>
            <div className="flexRowItemEdit">
              <Button
                type="link"
                onClick={() => openAvailabilityModal(rowDate, false, Weekdays[Number(ele)].toLowerCase())}
              >
                Edit
              </Button>
            </div>
          </div>
        </React.Fragment>
      )
    })
  }

  return (
    <section className={styles.containerTutorAvailabilitySummary}>
      <h2 className="header page-title">{`${isRecurring ? 'Recurring ' : ''}Availability`}</h2>
      <ConfigProvider locale={en_GB}>
        <div className="controlsAvailabilitySummary">
          <div>
            <Button className="buttonRecurring" type="primary" onClick={() => setIsRecurring(prev => !prev)}>
              {`${isRecurring ? 'Return to Weekly Availability' : 'View Recurring Availability'}`}
            </Button>
          </div>
          {!isRecurring && (
            <DatePicker
              autoFocus
              inputReadOnly
              className="picker"
              format="[Week of] MMMM DD, YYYY"
              picker="week"
              onChange={onChange}
              value={selectedDate}
            />
          )}
        </div>
      </ConfigProvider>
      <div className="containerTutorAvailabilitySummaryTable">
        <div className="headerRow">
          <div className="flexRowItemDays">Days</div>
          <div className="flexRowItemTimes">Times</div>
          {isRecurring && <div className="flexRowItemTimes">Location</div>}
          <div className="flexRowItemEdit" />
        </div>
        {loading && <Skeleton active />}
        {renderSummaryTable()}
        {!loading && isRecurring && <AvailabilityRecurring tutor={tutor} counselor={counselor} />}
        <span className="timezoneWarning">
          <InfoCircleTwoTone />
          All times are shown in your local timezone ({moment.tz.guess()})
        </span>
      </div>
    </section>
  )
}
