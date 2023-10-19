// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { HomeOutlined, InfoCircleTwoTone, LaptopOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import { handleError, handleSuccess } from 'components/administrator/utils'
import styles from 'components/tutoring/styles/TutorAvailabilityScheduler.scss'
import { ScheduleSelector } from 'libs/ScheduleSelector'
import { delocalizeAvailability, getTrimester, localizeAvailability } from 'libs/ScheduleSelector/date-utils'
import { capitalize, flatten, isEmpty, range } from 'lodash'
import moment, { Moment } from 'moment'
import React, { MouseEvent, Ref, useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  getRecurringAvailability,
  selectLocalizedRecurringAvailabilityTrimester,
} from 'store/availability/availabilitySelectors'
import {
  createAvailability,
  createRecurringAvailability,
  fetchAvailabilities,
  fetchRecurringAvailability,
} from 'store/availability/availabilityThunks'
import {
  Availabilities,
  Availability,
  AvailabilityTimespan,
  MomentAvailability,
  TrimesterLocations,
  Trimesters,
  Weekdays,
} from 'store/availability/availabilityTypes'
import { closeModal } from 'store/display/displaySlice'
import { useReduxDispatch } from 'store/store'
import { getLocations } from 'store/tutoring/tutoringSelectors'
import styled from 'styled-components'

moment.locale('en-gb')

export type DateAndLocation = {
  date: Date
  location: number | null
  isFirst?: boolean
  isLast?: boolean
}

export type Selection = DateAndLocation[]

type DateCellProps = {
  selected?: boolean
  isTop?: boolean
  isBottom?: boolean
}

const weekday = new Date().getDay()
const daysSinceLastMonday = weekday > 0 ? weekday - 1 : 6
const dateFormat = 'YYYY-MM-DD'
const time12Format = 'h:mm a'

// Styled component for custom dataCell
const DataCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1 1 0;
  height: 100%;
  border-bottom: 1px solid rgba(162, 198, 248, 0.8);
  border-left: 1px solid rgba(162, 198, 248, 0.8);
  background-color: ${(props: DateCellProps) => (props.selected ? '#ffc069' : 'rgba(219,237,255, .5)')};
  border-top-left-radius: ${({ isTop }) => (isTop ? '8px' : null)};
  border-top-right-radius: ${({ isTop }) => (isTop ? '8px' : null)};
  border-bottom-left-radius: ${({ isBottom }) => (isBottom ? '8px' : null)};
  border-bottom-right-radius: ${({ isBottom }) => (isBottom ? '8px' : null)};
  &:hover {
    background-color: rgba(89, 154, 242, 1);
    cursor: pointer;
  }
`
/**
 * @description Creates ScheduleSelector selection prop from AvailabilityTimespan array
 * (i.e. chops up a timespan [2pm-4pm] into individual selection hour-blocks [2pm-3pm, 3-4pm])
 * @param availabilities { AvailabilityTimespan[] }
 * @returns selection { Selection }
 */
const createSelectionFromAvailabilityTimespans = (
  availabilities: AvailabilityTimespan[],
  isRecurring: boolean,
  recurringStartDate?: Moment,
) => {
  // goofy check for the case where the redux store contains only [{tutor: tutorID}]
  if (availabilities.length === 1 && !availabilities[0]?.start) {
    return []
  }
  const result: Selection = flatten(
    availabilities.map(availability => {
      const duration = moment.duration(moment(availability.end).diff(moment(availability.start)))
      const hours = duration.asHours()

      // Availabilities of 0 duration DO exist and are used to indicate no availability + not using recurring
      // availability for a day. We don't display these on calendar
      if (duration.asMinutes() > 0) {
        return range(hours).map(idx => {
          // Because we're dealing with UTC times, saturday and sunday can be either the next Saturday/Sunday or
          // the past one. We need it to be the future one to display properly on the scheduler
          // Need to bump Sunday times to be after start

          const startToUse =
            isRecurring && recurringStartDate && moment(availability.start) < recurringStartDate
              ? moment(availability.start).add(1, 'week')
              : moment(availability.start)
          return { date: new Date(startToUse.add(idx, 'h').toISOString()), location: availability.location }
        })
      }
    }),
  )
  return result.filter(ele => ele)
}

// Adds time-block positions to availabilities retrieved from backend
const addPositionToSelection = (selection: Selection) => {
  const lastSelectionIndex = selection.length - 1
  return selection.map((selectionItem, index) => {
    const prevIndex = index - 1
    const nextIndex = index + 1
    selectionItem.isFirst = index === 0
    selectionItem.isLast = index === lastSelectionIndex

    if (
      nextIndex < lastSelectionIndex &&
      (selection[nextIndex].location !== selectionItem.location ||
        selection[nextIndex].date.toISOString() !== moment(selectionItem.date).add(1, 'h').toISOString())
    ) {
      selectionItem.isLast = true
    }

    if (
      prevIndex >= 0 &&
      (selection[prevIndex].location !== selectionItem.location ||
        selection[prevIndex].date.toISOString() !== moment(selectionItem.date).subtract(1, 'h').toISOString())
    ) {
      selectionItem.isFirst = true
    }
    return selectionItem
  })
}

type Props = {
  tutor?: number
  counselor?: number
  isRecurring: boolean
  recurringTrimester?: Trimesters
  start: string
  end: string
  day: string
  defaultLocation: number | null
}
/**
 * Renders an Availability Scheduler (same component is used for tutor and counselor)
 * @param tutor tutorID
 * @param counselor counselorID
 * @param isRecurring boolean to determine if weekly or recurring availability is being set
 * @param start datestring representing earliest time that can be set in UTC (NOTE: only time portion used when setting recurring availability)
 * @param end datestring representing latest time that can be set in UTC (NOTE: only time portion used when setting recurring availability)
 * @param day weekday that is being set (NOTE: used only for recurring availability - overrides start/end date
 * @param defaultLocation active trimester default location selected for current day (i.e. locationPK | null)
 */
export const AvailabilityScheduler = ({
  tutor,
  counselor,
  isRecurring,
  start,
  end,
  day,
  recurringTrimester,
  defaultLocation,
}: Props) => {
  const daysToAdd = Weekdays[`${capitalize(day)}` as keyof typeof Weekdays]
  const recurringMondayStart = moment(start).subtract(daysSinceLastMonday, 'd')
  const recurringStartDate = recurringMondayStart.add(daysToAdd, 'd')

  const dispatch = useReduxDispatch()
  const [selection, setSelection] = useState<Selection>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pull recurring availability out of store. Map it from UTC to local time so we can display on the calendar
  const trimesterToUse = recurringTrimester || (getTrimester(moment(start)) as Trimesters)
  const recurringAvailability = useSelector(selectLocalizedRecurringAvailabilityTrimester(trimesterToUse))
  // Pull recurring availability locations and determine active trimester locations JSON
  const recurringAvailabilityLocations = useSelector(getRecurringAvailability)?.locations as TrimesterLocations
  const activeTrimesterLocations = recurringAvailabilityLocations[trimesterToUse]
  const locations = useSelector(getLocations)

  const fetchAvailabilityCB = useCallback(() => {
    if (!isRecurring) {
      setLoading(true)
      dispatch(
        fetchAvailabilities(
          { tutor, counselor },
          {
            start,
            end,
            exclude_sessions: false,
            use_recurring_availability: false,
            for_availability_view: true,
          },
        ),
      )
        .then(data => {
          setSelection(addPositionToSelection(createSelectionFromAvailabilityTimespans(data as Availability[], false)))
        })
        .finally(() => setLoading(false))
    }
  }, [isRecurring, dispatch, tutor, counselor, start, end])

  // We use a string here otherwise we get infinite loop because moment is recreated on each render
  const recurringStartDateString = recurringStartDate.toISOString()
  const fetchRecurringAvailabilityCB = useCallback(() => {
    if (isRecurring) {
      setLoading(true)
      dispatch(fetchRecurringAvailability({ tutor, counselor }))
        .then(newRecurringAvailability => {
          const localizedAvailability = localizeAvailability(newRecurringAvailability.availability[trimesterToUse])
          if (localizedAvailability && localizedAvailability[day as string]) {
            const todayAvailability: AvailabilityTimespan[] = localizedAvailability[day as string].map(a => ({
              start: a.start.toISOString(),
              end: a.end.toISOString(),
            }))
            setSelection(
              addPositionToSelection(
                createSelectionFromAvailabilityTimespans(todayAvailability, true, moment(recurringStartDateString)),
              ),
            )
          } else {
            setSelection([])
          }
        })
        .finally(() => setLoading(false))
    }
  }, [counselor, day, dispatch, isRecurring, recurringStartDateString, trimesterToUse, tutor])

  useEffect(() => {
    // TODO: Do this in parent component so we don't re-load for each day?
    // IDK maybe not -- it is extremely important that this data is correct
    // Decided to keep this since it's important data is fresh. I realize I'm just having this conversation with
    // myself.
    // Well actually, now that you've read this I suppose you're part of the convo, too 🤔
    fetchAvailabilityCB()
    fetchRecurringAvailabilityCB()
  }, [dispatch, fetchAvailabilityCB, fetchRecurringAvailabilityCB])

  const handleChange = (updatedSelection: Selection) => {
    setSelection(updatedSelection)
  }

  const handleCancel = () => {
    dispatch(closeModal())
  }

  /**
   * @description Creates availability object from ScheduleSelector selection prop
   * @param selection an array of currently selected time-blocks that are time-block location aware
   * @returns availabilities {Availabilities}; see type definition for details
   */
  const createServerAvailabilitiesFromSelection = (selection: Selection): Availabilities => {
    const newAvailabilities: Availabilities = {}
    // If selection is empty, we need to delete all availabilities on start date
    // Note that backend will create empty availability
    if (isEmpty(selection)) {
      newAvailabilities[moment(start).format(dateFormat)] = []
      return newAvailabilities
    }
    // Build Availabilities
    selection.forEach(selectionItem => {
      const start = moment(selectionItem.date) // note: datestring is in local time
      if (newAvailabilities[start.format(dateFormat)]) {
        newAvailabilities[start.format(dateFormat)].push({
          start: start.toISOString(),
          end: moment(start).add(1, 'h').toISOString(),
          location: selectionItem.location,
        })
      } else {
        newAvailabilities[start.format(dateFormat)] = [
          {
            start: start.toISOString(),
            end: moment(start).add(1, 'h').toISOString(),
            location: selectionItem.location,
          },
        ]
      }
    })
    return newAvailabilities
  }

  /** Create recurring availability objects from our selection */
  const createRecurringAvailabilityFromSelection = (selection: Selection): MomentAvailability[] => {
    const availabilities: MomentAvailability[] = []

    selection.forEach(selectionItem => {
      const start = moment(selectionItem.date).utc()
      const end = moment(moment(selectionItem.date).add(1, 'h')).utc()
      if (start.day() === end.day()) {
        availabilities.push({ start, end })
      } else {
        availabilities.push({ start, end: moment(start).endOf('day') })
        availabilities.push({ start: moment(end).startOf('day'), end })
      }
    })

    return availabilities.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf())
  }

  const handleSubmit = (e: MouseEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // start and end are needed for filtering tutorAvailabilities
    if (isRecurring) {
      const payload = { ...recurringAvailability }
      const mergedAvailability: MomentAvailability[] = []
      const newAvailability = createRecurringAvailabilityFromSelection(selection)
      // Merges adjacent availabilities before posting
      // (doesn't need to be location aware when merging abutting time-blocks,
      // since all availability locations are the same on the AvailabilityRecurring component)
      newAvailability.forEach(a => {
        if (mergedAvailability.length) {
          if (mergedAvailability[mergedAvailability.length - 1].end.toISOString() === a.start.toISOString()) {
            mergedAvailability[mergedAvailability.length - 1].end = a.end
          } else {
            mergedAvailability.push(a)
          }
        } else {
          mergedAvailability.push(a)
        }
      })

      payload[day as string] = mergedAvailability
      const delocalizedPayload = delocalizeAvailability(payload)

      dispatch(
        createRecurringAvailability({
          tutor,
          counselor,
          trimester: trimesterToUse,
          availability: delocalizedPayload,
          locations: activeTrimesterLocations,
        }),
      )
        .then(() => {
          handleSuccess('Availabilities created!')
          handleCancel()
        })
        .catch(err => {
          setError(err?.response?.data || null)
          handleError('Failed to create availabilities')
        })
        .finally(() => setLoading(false))
    } else {
      const newAvailabilities = createServerAvailabilitiesFromSelection(selection)
      dispatch(
        createAvailability({ availability: newAvailabilities, counselor, tutor, startRange: start, endRange: end }),
      )
        .then(() => {
          handleSuccess('Availabilities created!')
          handleCancel()
        })
        .catch(err => {
          setError(err?.response?.data || null)
          handleError('Failed to create availabilities')
        })
        .finally(() => setLoading(false))
    }
  }

  /** User clicks option to use recurring availability when editing availability for a day */
  const applyRecurringAvailability = () => {
    if (isRecurring) {
      return
    }
    const dayName = moment(start).format('dddd').toLowerCase()
    if (recurringAvailability && recurringAvailability[dayName]) {
      const todayAvailability: AvailabilityTimespan[] = recurringAvailability[dayName].map(a => ({
        start: a.start.toISOString(),
        end: a.end.toISOString(),
        location: defaultLocation,
      }))
      setSelection(addPositionToSelection(createSelectionFromAvailabilityTimespans(todayAvailability, true)))
    }
  }

  const flipOneHourTimeBlockLocation = (clickedIndex: number) =>
    setSelection(prev =>
      prev.map((selectionItem, index) =>
        index === clickedIndex
          ? {
              ...selectionItem,
              location: selectionItem.location === null ? defaultLocation : null,
            }
          : selectionItem,
      ),
    )

  const flipMultiHourTimeBlockLocation = (clickedIndex: number) => {
    let stepsToFirstIndex = 1
    while (!selection[clickedIndex - stepsToFirstIndex]?.isFirst) {
      stepsToFirstIndex += 1
    }
    setSelection(prev => [
      ...prev.slice(0, clickedIndex - stepsToFirstIndex),
      ...prev.slice(clickedIndex - stepsToFirstIndex, clickedIndex + 1).map(selectionItem => ({
        ...selectionItem,
        location: selectionItem.location === null ? defaultLocation : null,
      })),
      ...prev.slice(clickedIndex + 1),
    ])
  }

  return (
    <section className={styles.containerTutorAvailabilityScheduler}>
      <div className="subHeader">Mouse Over And Select Times You Are Available</div>
      <ScheduleSelector
        defaultLocation={defaultLocation}
        selection={selection}
        numDays={1}
        minTime={6}
        maxTime={22}
        // Determines correct day to set if setting recurring availability
        startDate={isRecurring ? recurringStartDate.toDate() : moment(start).toDate()}
        onChange={handleChange}
        dateFormat={`${isRecurring ? 'EEEE' : 'E M-d'}`}
        margin={0}
        renderDateCell={(time: Date, selected: boolean, selectionDraft: Selection, refSetter: Ref<HTMLDivElement>) => {
          const selectionDraftWithThisTime = selectionDraft.find(
            selectionItem => selectionItem.date.toISOString() === time.toISOString(),
          )
          const selectionWithThisTimeIndex: number = selection.findIndex(
            selectionItem => selectionItem.date.toISOString() === time.toISOString(),
          )
          const selectionWithThisTime: DateAndLocation = selection[selectionWithThisTimeIndex]

          const isTop = selected && selectionDraftWithThisTime?.isFirst
          const isBottom = selected && selectionDraftWithThisTime?.isLast

          return (
            <DataCell isTop={isTop} isBottom={isBottom} selected={selected} ref={refSetter}>
              {isTop && isBottom && (
                <div className="one-hour-block">
                  {moment(time).format(time12Format)}&nbsp;&nbsp; - &nbsp;&nbsp;
                  {moment(time).add(1, 'h').format(time12Format)}
                  {!isRecurring && (
                    <Tooltip
                      title={
                        selectionDraftWithThisTime?.location === null ? 'Remote' : locations[defaultLocation]?.name
                      }
                    >
                      <Button
                        type="link"
                        size="large"
                        className="in-person-icon slim-btn"
                        onClick={() => flipOneHourTimeBlockLocation(selectionWithThisTimeIndex)}
                      >
                        {selectionWithThisTime?.location === null ? <LaptopOutlined /> : <HomeOutlined />}
                      </Button>
                    </Tooltip>
                  )}
                  {isRecurring && (
                    <Tooltip title={defaultLocation ? locations[defaultLocation].name : 'Remote'}>
                      {defaultLocation ? <HomeOutlined /> : <LaptopOutlined />}
                    </Tooltip>
                  )}
                </div>
              )}
              {isTop && !isBottom && (
                <div className="top-block">From:&nbsp;&nbsp;{moment(time).format(time12Format)}</div>
              )}
              {!isTop && isBottom && (
                <div className="bottom-block">
                  To:&nbsp;&nbsp;{moment(time).add(1, 'h').format(time12Format)}
                  {!isRecurring && (
                    <Tooltip
                      title={
                        selectionDraftWithThisTime?.location === null ? 'Remote' : locations[defaultLocation]?.name
                      }
                    >
                      <Button
                        type="link"
                        size="large"
                        className="in-person-icon slim-btn"
                        onClick={() => flipMultiHourTimeBlockLocation(selectionWithThisTimeIndex)}
                      >
                        {selectionDraftWithThisTime?.location === null ? <LaptopOutlined /> : <HomeOutlined />}
                      </Button>
                    </Tooltip>
                  )}
                  {isRecurring && (
                    <Tooltip title={defaultLocation ? locations[defaultLocation].name : 'Remote'}>
                      {defaultLocation ? <HomeOutlined /> : <LaptopOutlined />}
                    </Tooltip>
                  )}
                </div>
              )}
            </DataCell>
          )
        }}
      />
      <div className="invalid-submission">{error && `Invalid Submission`}</div>
      <span className="timezoneWarning">
        <InfoCircleTwoTone />
        All times are shown in your local timezone ({moment.tz.guess()})
      </span>
      <div className="buttonWrapper">
        {!isRecurring && !loading && (
          <Button type="link" onClick={applyRecurringAvailability}>
            Apply recurring availability for {moment(start).format('dddd')}
          </Button>
        )}
        <Button type="default" onClick={handleCancel}>
          Cancel
        </Button>

        <Button className="buttonSubmit" type="primary" onClick={handleSubmit} loading={loading}>
          Save
        </Button>
      </div>
    </section>
  )
}
