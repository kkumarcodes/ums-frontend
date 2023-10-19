// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, Children } from 'react'
import { values, map } from 'lodash'

import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { Checkbox, Select, Form, Button } from 'antd'
import { SessionType } from 'components/tutoring/TutoringSessions'
import { WrappedPersonSelect } from 'components/common/FormItems'
import { useOperationsCalendarCtx } from './OperationsCalendarContext'
import styles from './OperationsCalendar.scss'
import { getFullName } from '..'

const OperationsCalendarFilter = () => {
  // Note that this component DOES NOT LOAD ITS OWN DATA but instead assumes that data is being loaded
  // where our context is derived from (probably OperationsCalendarContainer)
  const { availableTutors, availableLocations, availableZoomURLs } = useSelector((state: RootState) => {
    return {
      availableTutors: values(state.user.tutors),
      availableLocations: values(state.tutoring.locations),
      availableZoomURLs: values(state.user.proZoomURLs),
    }
  })

  const {
    tutors,
    setTutors,
    locations,
    setLocations,
    sessionType,
    setSessionType,
    includeRemote,
    setIncludeRemote,
    includeTutorAvailability,
    setIncludeTutorAvailability,
    useRecurring,
    setUseRecurring,
    availabilityTutors,
    setAvailabilityTutors,
    zoomURLs,
    setZoomURLs,
    availabilityLocation,
    setAvailabilityLocation,
  } = useOperationsCalendarCtx()

  // Filter all tutors for those at location we're potentially displaying availability for
  const availabilityTutorOptions = availableTutors.filter(t => t.location.pk === availabilityLocation)
  const tutorPKs = map(availabilityTutorOptions, 'pk')

  // When availability location changes, remove availability tutors who aren't at new location

  useEffect(() => {
    setAvailabilityTutors(availabilityTutors.filter(t => tutorPKs.includes(t)))
  }, [availabilityLocation]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMostAvailabilityTUtors = availabilityTutors.length >= availabilityTutorOptions.length / 2
  const selectedMostTutors = tutors.length >= availableTutors.length / 2

  // Helper methods for select/deselect all
  const toggleSelectAvailabilityTutors = () => {
    setAvailabilityTutors(selectedMostAvailabilityTUtors ? [] : map(availabilityTutorOptions, 'pk'))
  }
  const toggleSelectTutors = () => {
    setTutors(selectedMostTutors ? [] : map(availableTutors, 'pk'))
  }

  return (
    <div className={`${styles.operationsCalendarFilter}`}>
      <div className="outer-filter-container flex">
        <div className="filter-container">
          <Form.Item label="Tutors">
            <Select value={tutors} onChange={setTutors} mode="multiple" showSearch={true} optionFilterProp="children">
              {availableTutors.map(t => (
                <Select.Option value={t.pk} key={t.pk}>
                  {getFullName(t)}
                </Select.Option>
              ))}
            </Select>
            <Button type="link" onClick={toggleSelectTutors} className="select-deselect">
              {selectedMostTutors ? 'Deselect' : 'Select'} all tutors
            </Button>
          </Form.Item>
        </div>
        <div className="filter-container">
          <Form.Item label="Remote">
            <Checkbox checked={includeRemote} onChange={e => setIncludeRemote(e.target.checked)}>
              Include remote sessions
            </Checkbox>
          </Form.Item>
          <Form.Item label="Locations">
            <Select value={locations} onChange={setLocations} mode="multiple">
              {availableLocations.map(t => (
                <Select.Option value={t.pk} key={t.pk}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
        <div className="filter-container small">
          <Form.Item label="Session Type">
            <Select value={sessionType} onChange={setSessionType} showSearch={true} optionFilterProp="children">
              {values(SessionType).map(v => (
                <Select.Option value={v} key={v}>
                  {v}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      </div>
      <div className="outer-filter-container tutor-availability flex">
        <div className="filter-container">
          <Form.Item label="Tutor Availability">
            <Checkbox checked={includeTutorAvailability} onChange={e => setIncludeTutorAvailability(e.target.checked)}>
              Display tutor availability
            </Checkbox>
          </Form.Item>
          {includeTutorAvailability && (
            <Form.Item
              label="Availability for location"
              extra="Availability can only be displayed for tutors at a single location"
            >
              <Select
                value={availabilityLocation}
                onChange={setAvailabilityLocation}
                showSearch={true}
                optionFilterProp="children"
              >
                {availableLocations.map(t => (
                  <Select.Option value={t.pk} key={t.pk}>
                    {t.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
        </div>
        <div className="filter-container">
          {includeTutorAvailability && availabilityLocation && (
            <>
              <Form.Item label="Tutors to show availability for">
                <Select value={availabilityTutors} onChange={setAvailabilityTutors} mode="multiple">
                  {availabilityTutorOptions.map(t => (
                    <Select.Option value={t.pk} key={t.pk}>
                      {getFullName(t)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Button type="link" onClick={toggleSelectAvailabilityTutors} className="select-deselect">
                {selectedMostAvailabilityTUtors ? 'Deselect' : 'Select'} all tutors
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
export default OperationsCalendarFilter
