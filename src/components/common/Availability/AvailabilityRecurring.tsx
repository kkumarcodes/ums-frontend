// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Select, Tag } from 'antd'
import { reverseEnumKeys, TagColors } from 'components/administrator'
import { delocalizeAvailability, getTrimester } from 'libs/ScheduleSelector/date-utils'
import { isEmpty } from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  getRecurringAvailability,
  selectLocalizedRecurringAvailabilityTrimester,
} from 'store/availability/availabilitySelectors'
import {
  createRecurringAvailability,
  deleteRecurringAvailability,
  fetchRecurringAvailability,
} from 'store/availability/availabilityThunks'
import { TrimesterLocations, Trimesters, Weekdays } from 'store/availability/availabilityTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import { Location } from 'store/tutoring/tutoringTypes'
import { getActiveUser, selectCWUser } from 'store/user/usersSelector'
import { Counselor, Tutor } from 'store/user/usersTypes'

moment.locale('en-gb')

const time12Format = 'h:mm a'

const TrimesterDescriptions = {
  [Trimesters.FALL]: 'Sep 1 - Dec 31',
  [Trimesters.SUMMER]: 'Jun 1 - Aug 31',
  [Trimesters.SPRING]: 'Jan 1 - May 31',
}

const REMOTE_LOCATION = 'remote'
const REMOTE_LOCATION_VALUE = 'null'

type Props = {
  tutor?: number
  counselor?: number
}
/**
 * Component renders a table of recurring weekly availabilities for a tutor or a counselor
 *
 * Note that we don't load recurring availability here because we assume it is loaded in parent component
 * (AvailabilitySummary)
 */
export const AvailabilityRecurring = ({ tutor, counselor }: Props) => {
  const dispatch = useReduxDispatch()
  const [selectedTrimester, setSelectedTrimester] = useState<Trimesters>(getTrimester())
  const activeUser = useSelector(getActiveUser)
  const activeCWUser = useSelector(selectCWUser(activeUser?.cwUserID, activeUser?.userType)) as Tutor | Counselor
  const locations = useSelector(selectLocations)
  const primaryLocation = activeCWUser.location
  const remoteLocation = (locations.find(l => l.name.toLowerCase().includes(REMOTE_LOCATION)) as unknown) as Location
  const locationsMinusPrimaryAndRemote = locations.filter(
    l => l.name !== primaryLocation?.name && !l.name.toLowerCase().includes(REMOTE_LOCATION),
  )
  // Pull recurring availability out of store. Map it from UTC to local time so we can display on the calendar
  const recurringAvailability = useSelector(selectLocalizedRecurringAvailabilityTrimester(selectedTrimester))
  // Pull recurring availability locations and determine active trimester locations JSON
  const recurringAvailabilityLocations = useSelector(getRecurringAvailability)?.locations as TrimesterLocations
  const activeTrimesterLocations = recurringAvailabilityLocations[selectedTrimester]

  const openAvailabilityModal = (isRecurring: boolean, day: string) => {
    dispatch(
      showModal({
        modal: MODALS.AVAILABILITY,
        props: {
          tutor,
          counselor,
          isRecurring,
          recurringTrimester: selectedTrimester,
          day: day.toLowerCase(),
          //! Change I made that might break things
          start: moment().hour(6).minute(0).second(0).millisecond(0).toISOString(),
          end: moment().hour(23).minute(0).second(0).millisecond(0).toISOString(),
          defaultLocation: activeTrimesterLocations[day.toLowerCase()],
        },
      }),
    )
  }

  const updateRecurringAvailabilityLocations = async (selectedLocationPK: string, weekday: string) => {
    // Converts string "null" into literal null; (Location Select component works with string values (e.g. "null"); Backend expects literal null)
    const selectedLocationPKOrNull = selectedLocationPK === REMOTE_LOCATION_VALUE ? null : selectedLocationPK
    await dispatch(
      createRecurringAvailability({
        tutor,
        counselor,
        trimester: selectedTrimester,
        availability: delocalizeAvailability(recurringAvailability),
        locations: { ...activeTrimesterLocations, [weekday]: selectedLocationPKOrNull },
      }),
    )
    // Creating recurring availability only returns TrimesterAvailabilities,
    // We launch a fetch to get back updated RecurringAvailabilityLocations
    dispatch(fetchRecurringAvailability({ tutor, counselor }))
  }
  /** Render a select to select trimester, which determines which recurring availability schedule we
   * show
   */
  const renderSelectTrimester = () => {
    return (
      <div className="trimesterSelect">
        <label>Select Time Period:</label>
        <Select value={selectedTrimester} onChange={setSelectedTrimester}>
          <Select.Option value={Trimesters.SPRING}>Spring ({TrimesterDescriptions[Trimesters.SPRING]})</Select.Option>
          <Select.Option value={Trimesters.SUMMER}>Summer ({TrimesterDescriptions[Trimesters.SUMMER]})</Select.Option>
          <Select.Option value={Trimesters.FALL}>Fall ({TrimesterDescriptions[Trimesters.FALL]})</Select.Option>
        </Select>
      </div>
    )
  }

  return (
    <>
      <div className="recurringControls">
        {renderSelectTrimester()}
        <div className="resetContainer">
          <Button
            className="buttonReset"
            type="danger"
            onClick={() => dispatch(deleteRecurringAvailability({ counselor, tutor, trimester: selectedTrimester }))}
          >
            Reset
          </Button>
        </div>
      </div>

      {reverseEnumKeys(Weekdays).map((ele, index) => (
        <div key={ele} className="row">
          <div className="flexRowItemDays">{`${Weekdays[Number(ele)]}s`}</div>
          <div className="flexRowItemTimes">
            {recurringAvailability &&
              recurringAvailability[Weekdays[Number(ele)].toLowerCase()]?.map(({ start, end }, idx) => {
                return (
                  <Tag
                    key={`${Weekdays[Number(ele)].toLowerCase()}-${start}-${idx}`}
                    color={TagColors.blue}
                  >{`${start.format(time12Format)} - ${(end.minute() ? end.add(1, 'hour').startOf('hour') : end).format(
                    time12Format,
                  )}`}</Tag>
                )
              })}
            {recurringAvailability && isEmpty(recurringAvailability[Weekdays[Number(ele)].toLowerCase()]) && (
              <span key={index}>--</span>
            )}
          </div>
          <div className="flexRowItemTimes">
            <Select
              style={{ width: 180 }}
              value={activeTrimesterLocations[Weekdays[Number(ele)].toLowerCase()] ?? REMOTE_LOCATION_VALUE}
              onChange={value => updateRecurringAvailabilityLocations(value, Weekdays[Number(ele)].toLowerCase())}
            >
              {primaryLocation && (
                <Select.OptGroup label="Primary Location">
                  <Select.Option value={primaryLocation.pk}>{primaryLocation.name}</Select.Option>
                </Select.OptGroup>
              )}
              <Select.OptGroup label="Remote Location">
                <Select.Option value={REMOTE_LOCATION_VALUE}>{remoteLocation.name}</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="Other Locations">
                {locationsMinusPrimaryAndRemote.map(location => (
                  <Select.Option key={location.pk} value={location.pk}>
                    {location.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </div>
          <div className="flexRowItemEdit">
            <Button type="link" onClick={() => openAvailabilityModal(true, Weekdays[Number(ele)])}>
              Edit
            </Button>
          </div>
        </div>
      ))}
    </>
  )
}
