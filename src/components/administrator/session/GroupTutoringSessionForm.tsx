// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Form, Row, Input, Checkbox } from 'antd'
import { Store } from 'antd/lib/form/interface'
import { handleError, handleSuccess, mergeDateAndTime } from 'components/administrator'
import {
  WrappedDatePicker,
  WrappedEntitySelect,
  WrappedFormControl,
  WrappedGenericSelect,
  WrappedPersonSelect,
  WrappedTextInput,
  WrappedTimePicker,
} from 'components/common/FormItems'
import styles from 'components/administrator/styles/GroupTutoringSession.scss'
import { useShallowSelector } from 'libs'
import { map } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { closeModal } from 'store/display/displaySlice'
import { getResources, selectResources } from 'store/resource/resourcesSelectors'
import { fetchResources } from 'store/resource/resourcesThunks'
import { Resource } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectLocations } from 'store/tutoring/tutoringSelectors'
import {
  createGroupTutoringSession,
  fetchGroupTutoringSession,
  fetchLocations,
  updateGroupTutoringSession,
} from 'store/tutoring/tutoringThunks'
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import { getZoomURLs, selectTutors } from 'store/user/usersSelector'
import { fetchTutors, fetchZoomURLs } from 'store/user/usersThunks'
import { selectDiagnostics } from 'store/diagnostic/diagnosticSelectors'
import { fetchDiagnostics } from 'store/diagnostic/diagnosticThunks'

type Error = {
  non_field_errors: string[]
}

interface Payload extends Partial<Omit<GroupTutoringSession, 'location' | 'duration'>> {
  location_id?: number
  update_resources?: string[]
  start?: string
  end?: string
}

const DURATIONS = [60, 90, 105, 120, 150, 180, 210]
/**
 * @param values Ant Form controlled values
 * @param resourcesObj All resources from DB
 * @returns payload A GroupTutoringSession object with fields suitable for post/update request to backend
 * @description Helper function that shapes form values into a server compatible payload for create/update GroupTutoringSession
 */
const createServerPayloadFromFormValues = (values: Store, resourcesObj: { [pk: number]: Resource }) => {
  const {
    start,
    duration,
    date,
    location,
    resources,
    set_charge_student_duration,
    set_pay_tutor_duration,
    ...partialPayload
  } = values
  // merge client-form-fields (date + start) to create server start; start + duration = end
  const payload: Payload = { ...partialPayload }
  payload.start = mergeDateAndTime(date, start)
  payload.end = moment(payload.start).add(duration, 'minutes').toISOString()
  payload.location_id = values.location
  payload.update_resources = values?.resources?.map((resourceID: number) => resourcesObj[resourceID].slug)
  payload.zoom_url = values.zoom_url === 'custom' ? values.custom_zoom_url : values.zoom_url
  payload.set_charge_student_duration = set_charge_student_duration
  payload.set_pay_tutor_duration = set_pay_tutor_duration
  return payload
}

// Sets initial start time to next available granularity minute (e.g. currently 4:04pm; set to 4:30pm)
const handleInitialStart = (start?: string) => {
  const GRANULARITY = 30
  if (start) {
    return moment(start)
  }
  const currentMin = moment().minute()
  let nextIncMin = Math.floor(currentMin / GRANULARITY) * GRANULARITY
  nextIncMin += currentMin % GRANULARITY ? GRANULARITY : 0

  return moment(start).set({ minute: nextIncMin, second: 0 })
}

const initialValues = {
  date: moment(),
  start: handleInitialStart(),
  duration: DURATIONS[0],
}

type Props = {
  sessionID?: number
}

export const GroupTutoringSessionForm = ({ sessionID }: Props) => {
  const [form] = Form.useForm()
  const { setFieldsValue } = form

  const dispatch = useReduxDispatch()
  const session = useShallowSelector((state: RootState) =>
    sessionID ? state.tutoring.groupTutoringSessions[sessionID] : null,
  )
  const tutors = useSelector(selectTutors)
  const locations = useSelector(selectLocations)
  const resources = useSelector(selectResources)
  const diagnostics = useSelector(selectDiagnostics)
  const zoomURLs = useSelector(getZoomURLs)
  const resourcesByPK = useSelector(getResources)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [primaryTutor, setPrimaryTutor] = useState<number | null>(null)
  const [supportTutors, setSupportTutors] = useState<number[]>([])
  const [showCustomZoom, setShowCustomZoom] = useState(false)
  const [hoursNotRequired, setHoursNotRequired] = useState(false)

  // Fetches all tutors, locations, resources, zoomURLs from DB for use in Select fields
  // Fetches session to edit if sessionID is defined and session is null in order to populate initial field values
  useEffect(() => {
    const promises: Array<Promise<any>> = []
    if (!tutors.length) {
      promises.push(dispatch(fetchTutors()))
    }
    if (!locations.length) {
      promises.push(dispatch(fetchLocations()))
    }
    if (!resources.length) {
      promises.push(dispatch(fetchResources({})))
    }
    if (!zoomURLs.length) {
      promises.push(dispatch(fetchZoomURLs()))
    }
    if (!diagnostics.length) promises.push(dispatch(fetchDiagnostics()))
    if (sessionID) {
      promises.push(dispatch(fetchGroupTutoringSession(sessionID)))
    }
    Promise.all(promises).catch(err => {
      handleError('Failed to load data')
    })
  }, [diagnostics.length, dispatch, locations.length, resources.length, sessionID, tutors.length, zoomURLs.length])

  useEffect(() => {
    if (session && sessionID) {
      setFieldsValue({
        title: session?.title,
        description: session?.description,
        capacity: session?.capacity,
        date: moment(session?.start),
        start: handleInitialStart(session?.start),
        duration: moment(session.end).diff(session.start, 'minutes'),
        primary_tutor: session.primary_tutor,
        support_tutors: session.support_tutors,
        location: session?.location,
        resources: map(session.resources, 'pk'),
        zoom_url: zoomURLs.includes(session.zoom_url) ? session.zoom_url : 'custom',
        custom_zoom_url: session.zoom_url,
        diagnostic: session.diagnostic,
      })
      setShowCustomZoom(!zoomURLs.includes(session.zoom_url))
      setSelectedLocation(session?.location)
      setPrimaryTutor(session?.primary_tutor)
      setSupportTutors(session?.support_tutors)
    }
  }, [session, sessionID, setFieldsValue, zoomURLs])

  const handleFinish = async (values: Store) => {
    if (hoursNotRequired) {
      values = { ...values, set_charge_student_duration: 0 }
    }

    const payload = createServerPayloadFromFormValues(values, resourcesByPK)
    setLoading(true)
    try {
      if (sessionID) {
        await dispatch(updateGroupTutoringSession(sessionID, payload))
      } else {
        await dispatch(createGroupTutoringSession(payload))
      }
      handleSuccess(`Session ${sessionID ? 'updated' : 'created'}!`)
      dispatch(closeModal())
    } catch (err) {
      setError(err?.response?.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form
      layout="vertical"
      form={form}
      className={styles.formGroupSession}
      onFinish={handleFinish}
      initialValues={initialValues}
      scrollToFirstError={true}
      onValuesChange={changedValues => {
        if (changedValues.location) {
          setSelectedLocation(changedValues.location)
          setFieldsValue({
            primary_tutor: null,
            support_tutors: [],
          })
        }
        if (changedValues.primary_tutor) {
          setPrimaryTutor(changedValues.primary_tutor)
        }
        if (changedValues.support_tutors) {
          setSupportTutors(changedValues.support_tutors)
        }
      }}
    >
      <Row>
        <Row justify="space-between" className={styles.dateAndCapacity}>
          <WrappedDatePicker name="date" label="Select Date" wrapperCN={styles.selectDate} />
          <WrappedTextInput
            name="capacity"
            label="Capacity"
            isRequired={false}
            placeholder="Session capacity"
            wrapperCN={styles.inputGroupSessionCapacity}
          />
        </Row>
      </Row>
      <Row>
        <Row justify="space-between" className={styles.startAndDuration}>
          <WrappedTimePicker name="start" label="Start Time" form={form} wrapperCN={styles.timePickerStart} />
          <WrappedEntitySelect
            name="duration"
            label="Session Duration"
            isRequired={true}
            entities={DURATIONS}
            showSearch={false}
            wrapperCN={styles.selectDuration}
          />
        </Row>
      </Row>
      {!sessionID && (
        <Row justify="space-between">
          <Checkbox checked={hoursNotRequired} onChange={e => setHoursNotRequired(!hoursNotRequired)}>
            This session does not require hours
          </Checkbox>
        </Row>
      )}
      <Row justify="space-between">
        <WrappedTextInput
          name="title"
          label="Title"
          isRequired={true}
          placeholder="Enter session title"
          wrapperCN={styles.inputGroupSessionTitle}
        />
        <WrappedTextInput
          name="description"
          label="Description"
          placeholder="Enter group session description"
          wrapperCN={styles.inputGroupSessionDescription}
        />
      </Row>
      <Row justify="space-between">
        <WrappedGenericSelect
          name="location"
          label="Location"
          entities={locations}
          propToDisplay="name"
          wrapperCN={styles.selectLocation}
        />
        <div className={styles.selectZoom}>
          <WrappedEntitySelect
            name="zoom_url"
            label="Zoom URL"
            isRequired={false}
            entities={[...zoomURLs, 'custom']}
            extra="Only select a Zoom URL if the session will be remote"
            onChange={v => setShowCustomZoom(v === 'custom')}
            allowClear
          />
          {showCustomZoom && (
            <Form.Item label="Custom Zoom URL" name="custom_zoom_url">
              <Input />
            </Form.Item>
          )}
        </div>
      </Row>
      <WrappedPersonSelect
        name="primary_tutor"
        label="Primary Tutor"
        entities={tutors.filter(
          tutor =>
            !supportTutors.includes(tutor.pk) && (tutor.can_tutor_remote || selectedLocation === tutor.location?.pk),
        )}
        disabled={!selectedLocation}
        extra="Please first select a tutoring location"
        notFoundContent="No tutors at selected location"
      />
      <WrappedPersonSelect
        mode="multiple"
        name="support_tutors"
        label="Support Tutors"
        placeholder="Select support tutor(s)"
        isRequired={false}
        entities={tutors.filter(
          tutor => tutor.pk !== primaryTutor && (tutor.can_tutor_remote || selectedLocation === tutor.location?.pk),
        )}
        disabled={!selectedLocation}
        extra="Please first select a tutoring location"
        notFoundContent="No tutors at selected location"
      />
      <WrappedGenericSelect
        name="diagnostic"
        label="Diagnostic"
        isRequired={false}
        entities={diagnostics}
        propToDisplay="title"
      />
      <WrappedGenericSelect
        mode="multiple"
        name="resources"
        label="Resources"
        isRequired={false}
        entities={resources}
        propToDisplay="title"
      />
      <div className="center error">{error?.non_field_errors}</div>
      <WrappedFormControl loading={loading} />
    </Form>
  )
}
