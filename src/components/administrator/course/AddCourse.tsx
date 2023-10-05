// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { RightCircleOutlined } from '@ant-design/icons'
import { Button, Checkbox, Form, Input, message, Select, Switch } from 'antd'
import OperationsCalendar, { ProspectiveEvent } from 'components/administrator/operations/OperationsCalendar'
import { WrappedEntitySelect } from 'components/common/FormItems'
import {history} from 'App'
import { map, sortBy, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchDiagnostics } from 'store/diagnostic/diagnosticThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import {
  createCourse,
  createGroupTutoringSession,
  fetchLocations,
  fetchTutoringPackages,
} from 'store/tutoring/tutoringThunks'
import { Categories, GroupTutoringSession, PostCourse, TutoringPackage } from 'store/tutoring/tutoringTypes'
import { fetchTutors, fetchZoomURLs } from 'store/user/usersThunks'
import { OperationsCalendarProvider, useCreateOpsCalendarCtx } from '../operations/OperationsCalendarContext'
import styles from './AddCourse.scss'
import CourseGTS, { CourseGTSInterface } from './CourseGTS'
import { CourseGTSContext, CourseGTSContextProvider } from './CourseGTSContext'

const InitialCourseDetails: Partial<PostCourse> = {
  name: '',
  description: '',
  location_id: undefined,
  display_on_landing_page: true,
}

const initialPackageDetails: Partial<TutoringPackage> = {
  individual_test_prep_hours: 0,
  group_test_prep_hours: 0,
  individual_curriculum_hours: 0,
  title: 'New Package',
  price: 0,
}

const AddCourse = () => {
  const dispatch = useReduxDispatch()
  const [courseForm] = Form.useForm()
  const [packageForm] = Form.useForm()
  const courseGTS = useRef<CourseGTSInterface>()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<number>()
  const [showCustomZoom, setShowCustomZoom] = useState(false)
  const [timezone, setTimezone] = useState(moment.tz.guess())

  // Context for ops calendar
  const opsCalendarContextValue = useCreateOpsCalendarCtx()

  useEffect(() => {
    opsCalendarContextValue.setIncludeTutorAvailability(true)
    opsCalendarContextValue.setTutors([])
    opsCalendarContextValue.setAvailabilityTutors([])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Context for component that creates GTS
  const [GTSCourses, setGTSCourses] = useState<Partial<GroupTutoringSession>[]>([])
  const gtsContextValue: CourseGTSContext = {
    GTSCourses,
    setGTSCourses,
    timezone,
  }

  const { locations, tutors, packages, resources, zoomURLs } = useSelector((state: RootState) => {
    return {
      locations: values(state.tutoring.locations),
      tutors: values(state.user.tutors),
      // Only supply as options packages with a sku or magento id
      packages: values(state.tutoring.tutoringPackages).filter(p => p.sku || p.magento_purchase_link),
      resources: values(state.resource.resources).filter(res => res.is_stock),
      zoomURLs: state.user.proZoomURLs,
    }
  })

  // Load initial data. We just do this if not already loaded
  const packageLen = packages.length
  const locationLen = locations.length
  const tutorsLen = tutors.length
  useEffect(() => {
    const promises: Promise<any>[] = [dispatch(fetchDiagnostics())]
    if (!packageLen) {
      promises.push(dispatch(fetchTutoringPackages({})))
    }
    if (!locationLen) {
      promises.push(dispatch(fetchLocations()))
    }
    if (!tutorsLen) {
      promises.push(dispatch(fetchTutors()))
    }
    if (!zoomURLs.length) {
      promises.push(dispatch(fetchZoomURLs()))
    }
    if (promises) {
      setLoading(true)
      Promise.all(promises).then(() => setLoading(false))
    }
  }, [packageLen, locationLen, tutorsLen, dispatch, zoomURLs.length])

  // Change location. When location changes, we change the timezone being used for GTS and calendar
  const updateLocation = (newLocationID: number) => {
    const newLocation = locations.find(l => l.pk === newLocationID)
    setSelectedLocation(newLocationID)
    if (newLocation?.timezone) {
      setTimezone(newLocation.timezone)
    }
  }

  /** Alrighty, we try to submit this bad boy. We
   *  1) Validate our GTS, package, and course
   *  2) Create our GTS, then package, then course
   */
  const handleCreateCourse = async () => {
    if (!courseGTS.current) {
      return null
    }
    let courseData: PostCourse & { zoom_url: string }
    let packageData: { tutoring_package: number }
    let partialSessionData: Partial<GroupTutoringSession>[]

    // Validate data
    try {
      courseData = (await courseForm.validateFields()) as PostCourse & { custom_zoom_url: string; zoom_url: string }
      if (courseData.zoom_url === 'custom') {
        courseData.zoom_url = courseData.custom_zoom_url
      }
      packageData = (await packageForm.validateFields()) as { tutoring_package: number }
      partialSessionData = await courseGTS.current.getSessions()
    } catch {
      return null
    }

    // Validation succeeded. Now we attempt saves
    try {
      setSaving(true)
      const createSessionPromises: Promise<GroupTutoringSession>[] = partialSessionData.map(session => {
        session.location_id = courseData.location_id
        session.title = `${courseData.name} ${session.title}`
        session.zoom_url = courseData.zoom_url || ''
        return dispatch(createGroupTutoringSession(session))
      })
      const courses = await Promise.all(createSessionPromises)
      courseData.group_tutoring_session_ids = map(courses, 'pk')
      courseData.package = packageData.tutoring_package

      await dispatch(createCourse(courseData))
      setSaving(false)
      message.success('Course created!')
      History.push('/courses/')
    } catch (err) {
      console.log(err)

      setSaving(false)
      message.error('Failed to save :(')
    }
    return null
  }

  // When selected tutor changes, we pass new context to our calendar
  const courseTutors: number[] = map(gtsContextValue.GTSCourses, 'primary_tutor')
    .filter(v => v) // FIlter out undefined
    .sort()

  useEffect(() => {
    opsCalendarContextValue.setAvailabilityTutors(courseTutors)
    opsCalendarContextValue.setTutors(courseTutors)
  }, [JSON.stringify(courseTutors)]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderCourseForm = () => {
    return (
      <Form layout="vertical" form={courseForm} className="course-form" initialValues={InitialCourseDetails}>
        <Form.Item required label="Course Name" name="name" rules={[{ required: true, message: 'Required' }]}>
          <Input placeholder="Defense against the dark arts" />
        </Form.Item>
        <WrappedEntitySelect label="Course Category" name="category" entities={values(Categories)} />
        <Form.Item label="Course Description" name="description">
          <Input.TextArea placeholder="Defence Against the Dark Arts (abbreviated as DADA) is a subject taught at Hogwarts School of Witchcraft and Wizardry and Ilvermorny School of Witchcraft and Wizardry. In this class, students study and learn how to defend themselves against all aspects of the Dark Arts, including dark creatures, curses, hexes and jinxes (dark charms), and duelling." />
        </Form.Item>
        <Form.Item
          label="Display on Landing Page"
          name="display_on_landing_page"
          extra="Whether or not this course should be an option for families registering via courses landing page"
        >
          <Switch defaultChecked={!!InitialCourseDetails.display_on_landing_page} />
        </Form.Item>
        <Form.Item required label="Location" name="location_id" rules={[{ required: true, message: 'Required' }]}>
          <Select value={selectedLocation} onChange={updateLocation}>
            {locations.map(loc => (
              <Select.Option key={loc.pk} value={loc.pk}>
                {loc.name} {loc.timezone && <span>(timezone: {loc.timezone})</span>}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Zoom URL" name="zoom_url" extra="Only select a Zoom URL if the session will be remote">
          <Select onChange={v => setShowCustomZoom(v === 'custom')}>
            {zoomURLs.map(url => (
              <Select.Option value={url} key={url}>
                {url}
              </Select.Option>
            ))}
            <Select.Option value="custom">Custom...</Select.Option>
          </Select>
        </Form.Item>
        {showCustomZoom && (
          <Form.Item
            label="Custom Zoom URL"
            name="custom_zoom_url"
            extra="Don't like any of the Zoom links above? Enter your own link here :)"
          >
            <Input />
          </Form.Item>
        )}
        <Form.Item label="Resources" name="resources">
          <Select mode="tags">
            {resources.map(r => (
              <Select.Option value={r.pk} key={r.pk}>
                {r.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    )
  }

  /** Form to select package. Though a single field, we use a form for validation */
  const renderPackageForm = () => {
    // Package options filtered by selected location. All active non-paygo packages displayed
    const packageOptions: TutoringPackage[] = packages.filter(
      p =>
        p.active &&
        !p.is_paygo_package &&
        (p.all_locations || (selectedLocation && p.locations.includes(selectedLocation))),
    )
    return (
      <Form layout="vertical" form={packageForm} className="package-form" initialValues={initialPackageDetails}>
        <Form.Item
          label="Select Product (package)"
          name="tutoring_package"
          rules={[{ required: true, message: 'Required' }]}
          extra={selectedLocation ? '' : 'Select a location to view available packages'}
        >
          <Select disabled={!selectedLocation}>
            {packageOptions.map(p => (
              <Select.Option value={p.pk} key={p.pk}>
                {p.title}
                <br />
                <span className="tiny">
                  <strong>Test Prep:</strong>
                  {p.individual_test_prep_hours} individual hours; {p.group_test_prep_hours} group hours
                  <br />
                  <strong>Curriculum:</strong>
                  {p.individual_curriculum_hours} individual hours
                </span>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    )
  }

  // We do a little calculation on our potential GTS courses to determine their start date and the
  // number of weeks they run
  const sortedGTS = sortBy(GTSCourses, 'start')
  const firstGTS = sortedGTS.length ? sortedGTS[0].start : null
  let numWeeks = null
  if (firstGTS) {
    numWeeks = moment.duration(moment(sortedGTS[sortedGTS.length - 1].start).diff(moment(firstGTS))).asWeeks() + 1
  }

  const GTSProspectiveEvents: ProspectiveEvent[] = sortedGTS.map(gts => {
    // Convert start to local timezone from timezone time
    // Note that timezone on actual gts.start/end should be IGNORED as the UX has them select in timezone of LOCATION
    // instead of their local timezone
    const start = moment.tz(moment(gts.start).format('YYYY-MM-DD HH:mm:ss'), timezone).tz(moment.tz.guess())
    const end = gts.end
      ? moment.tz(moment(gts.end).format('YYYY-MM-DD HH:mm:ss'), timezone).tz(moment.tz.guess())
      : moment(start).add(60, 'm')

    return {
      title: gts.title || '',
      start: start.toDate(), // Need to get from location timezone to local
      end: end.toDate(),
    }
  })

  return (
    <div className={styles.addCourseContainer}>
      <div className="add-course-inner-container">
        <div className="course-details-container">
          <h2>Add Course</h2>
          {renderCourseForm()}
          <hr />
          {renderPackageForm()}
          <div className="right actions-container">
            <Button size="large" type="primary" onClick={handleCreateCourse} loading={loading || saving}>
              Create Course <RightCircleOutlined />
            </Button>
          </div>
        </div>
        <div className="group-sessions-container">
          <CourseGTSContextProvider value={gtsContextValue}>
            <CourseGTS ref={courseGTS} />
          </CourseGTSContextProvider>
        </div>
        <div className="calendar-utilities-container">
          <h4>Calendar</h4>
          <p className="help">
            Use the calendar and utilities below to identify the best time to hold sessions for this course. Enter a
            session date, tutor, and location to start using the calendar.
          </p>
          <OperationsCalendarProvider value={opsCalendarContextValue}>
            {firstGTS && numWeeks && courseTutors.length && (
              <OperationsCalendar
                showConsistentAvailability={true}
                prospectiveEvents={GTSProspectiveEvents}
                start={firstGTS}
                numWeeks={numWeeks}
                disableEventCreation={true}
              />
            )}
          </OperationsCalendarProvider>
        </div>
      </div>
    </div>
  )
}

export default AddCourse
