// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Checkbox, DatePicker, Input, message, Modal, Row, Select, Skeleton, TimePicker } from 'antd'
import { AxiosError } from 'axios'
import { getFullName, mergeDateAndTime } from 'components/administrator'
import IndividualTutoringSessionSelector from 'components/tutoring/CreateTutoringSessionModal/IndividualTutoringSessionSelector'
import GroupTutoringSessionSelector from 'components/tutoring/GroupTutoringSessionSelector'
import styles from 'components/tutoring/styles/CreateTutoringSessionModal.scss'
import { map, pick, sortBy, values, find } from 'lodash'
import moment, { Moment } from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { Platform } from 'store/common/commonTypes'
import { selectActiveModal, selectVisibleCreateTutoringSessionModal } from 'store/display/displaySelectors'
import { closeModal, showModal } from 'store/display/displaySlice'
import {
  CreateTutoringSessionModalProps,
  EditTutoringSessionModalProps,
  isEditType,
  MODALS,
  PaygoPurchaseModalProps,
} from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectLocationsObject, selectTutoringServices } from 'store/tutoring/tutoringSelectors'
import {
  createStudentTutoringSession,
  fetchTutoringServices,
  updateStudentTutoringSession,
} from 'store/tutoring/tutoringThunks'
import { StudentTutoringSession, TutoringSessionType } from 'store/tutoring/tutoringTypes'
import { getActiveUser, selectCWUser, selectIsAdmin, selectIsTutor } from 'store/user/usersSelector'
import { fetchStudent, fetchStudents, fetchTutor } from 'store/user/usersThunks'
import { UserType } from 'store/user/usersTypes'
import { InsufficientHoursPrompt, InsufficientHoursPromptViews } from '../InsufficientHoursPrompt'
import { TutoringSessionModalContext, TutoringSessionModalContextProvider } from './TutoringSessionModalContext'

export enum Views {
  Individual, // Note that this can create both individual test prep and individual curriculum sessions
  Group,
}
const REMOTE_LOCATION_NAME = 'remote'
const NULL_LOCATION_STRING = 'null'

const DURATION_OPTIONS = [30, 60, 90, 120]
const DEFAULT_DURATION = 60

const CreateTutoringSessionModal = () => {
  const dispatch = useReduxDispatch()
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingTutors, setLoadingTutors] = useState(false)
  const loading = loadingStudents || loadingTutors
  const [saving, setSaving] = useState(false)
  const [isTentative, setIsTentative] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [activeView, setActiveView] = useState(Views.Individual)

  const props = useSelector(selectActiveModal)?.modalProps as
    | CreateTutoringSessionModalProps
    | EditTutoringSessionModalProps
  // Clears up ambiguity in type of session being booked. Only applies to individual sessions
  // as group sessions are always test prep
  const [sessionType, setSessionType] = useState<TutoringSessionType | null>(null)
  const [selectedTutoringService, setSelectedTutoringservice] = useState<number>()

  const [selectedIndividualTimes, setSelectedIndividualTimes] = useState<Moment[]>(
    props?.start ? [moment(props.start)] : [],
  )

  const [selectedGroupSession, setSelectedGroupSession] = useState<number | null>(null)
  const [note, setNote] = useState('')

  const locationObject = useSelector(selectLocationsObject)

  const tutoringServices = useSelector(selectTutoringServices)
  const isTutor = useSelector(selectIsTutor)
  const isAdmin = useSelector(selectIsAdmin)
  const userType = useSelector(getActiveUser)?.userType
  const userID = useSelector(getActiveUser)?.cwUserID
  const studentLocation = useSelector(selectCWUser(userID, UserType.Student))?.location
  const visible = useSelector(selectVisibleCreateTutoringSessionModal)
  const sessionID = isEditType(props) ? props.sessionID : null
  const updateSession = useSelector((state: RootState) =>
    sessionID ? state.tutoring.studentTutoringSessions[sessionID] : null,
  )
  const tutorID = props?.tutorID || (isTutor ? userID : null)
  const [selectedTutor, setSelectedTutor] = useState<number | undefined | null>(tutorID || undefined)
  const isUpdate = Boolean(sessionID)
  const [selectedStudentID, setSelectedStudentID] = useState(userType === UserType.Student ? userID : undefined)
  const [fetchedStudents, setFetchedStudents] = useState(false)

  // Custom Individual Session state variables
  const [isCustomSession, setCustomSession] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Moment | null>(null)
  const [selectedTime, setSelectedTime] = useState<Moment | null>(null)
  const [selectedDuration, setSelectedDuration] = useState(
    updateSession ? updateSession.duration_minutes : DEFAULT_DURATION,
  )
  const [sessionLocation, setSessionLocation] = useState<number | string>()
  // Initialize our context value
  const contextValue: TutoringSessionModalContext = {
    studentID: selectedStudentID,
    loading,
    sessionType,
    setSessionType,
    selectedDuration,
    setSelectedDuration,
    sessionLocation,
    setSessionLocation,
  }

  // If we're rescheduling, default to existing session start
  const updateSessionStart = updateSession?.start
  useEffect(() => {
    if (updateSessionStart) {
      setSelectedDate(moment(updateSessionStart))
      setSelectedTime(moment(updateSessionStart))
    }
  }, [updateSessionStart])

  const { student, students, tutors, session } = useSelector((state: RootState) => {
    const selectorStudent = selectedStudentID ? state.user.students[selectedStudentID] : null
    return {
      student: selectorStudent,
      students: sortBy(values(state.user.students), 'last_name'),
      tutors: selectorStudent ? map(pick(state.user.tutors, selectorStudent.tutors)) : [],
      session: sessionID ? state.tutoring.studentTutoringSessions[sessionID] : null,
    }
  }, shallowEqual)

  const resetSelections = useCallback(() => {
    setActiveView(Views.Individual)
    setSelectedTutor(tutorID)
    setSelectedIndividualTimes([])
    setSelectedGroupSession(null)
    setSessionType(null)
    setSelectedTutoringservice(undefined)
    setCustomSession(false)
    setSelectedDate(null)
    setSelectedTime(null)
    setNote('')
    setSelectedDuration(DEFAULT_DURATION)
    setSelectedStudentID(undefined)
  }, [tutorID])

  // This useEffect must be FIRST!
  // It resets the form on opening, but still allows for initial values on editting
  useEffect(() => {
    if (visible) {
      resetSelections()
    }
  }, [resetSelections, visible])

  // Change selected student when prop or student user ID changes
  const sessionNote = session?.note
  useEffect(() => {
    if (props?.studentID) {
      setSelectedStudentID(props?.studentID)
    } else if (userType === UserType.Student && userID) {
      setSelectedStudentID(userID)
    }
    if (isEditType(props) && props.sessionID && sessionNote) {
      setNote(sessionNote)
    }
  }, [props, sessionNote, setSelectedStudentID, userID, userType])

  // Whether or not we should show option to select student in a <Select> (for admins/tutors)
  const allowSelectStudent = userType === UserType.Administrator || (userType === UserType.Tutor && !props?.studentID)
  const isStudentOrParent = userType === UserType.Student || userType === UserType.Parent

  // Loading for students
  const loadStudent = selectedStudentID && !student
  const studentsExist = students.length > 0
  useEffect(() => {
    // Load our student and tutors if necessary
    const promises: Promise<any>[] = []
    if (!loadingStudents) {
      if (loadStudent) {
        promises.push(dispatch(fetchStudent(selectedStudentID as number, Platform.CAS)))
      }
      if (allowSelectStudent && !studentsExist && !fetchedStudents) {
        promises.push(dispatch(fetchStudents({})).finally(() => setFetchedStudents(true)))
      }
    }
    if (promises.length) {
      setLoadingStudents(true)
      Promise.all(promises).then(() => setLoadingStudents(false))
    }
  }, [dispatch, selectedStudentID, allowSelectStudent, studentsExist, loadStudent, loadingStudents, fetchedStudents])

  // Loading for tutors
  const tutorPKs = map(tutors, 'pk')
  const tutorsToLoad = student?.tutors.filter(pk => !tutorPKs.includes(pk)) || []
  useEffect(() => {
    const promises: Promise<any>[] = []
    if (!loadingTutors) {
      if (tutorsToLoad.length) {
        tutorsToLoad.map(tutorID => promises.push(dispatch(fetchTutor(tutorID))))
      }
      if (promises.length) {
        setLoadingTutors(true)
        Promise.all(promises).then(() => setLoadingTutors(false))
      }
    }
  }, [loadingTutors, dispatch, tutorsToLoad])

  // Loading for tutoring services
  const tutoringServicesExist = tutoringServices.length > 0
  useEffect(() => {
    if (!tutoringServicesExist) {
      dispatch(fetchTutoringServices())
    }
  }, [dispatch, tutoringServicesExist])

  // When student or their tutors change, update selected tutor to the first one :)
  const tutorsForStudent = student?.tutors || []
  useEffect(() => {
    if (isUpdate || isTutor) setSelectedTutor(tutorID)
    else if (tutorsForStudent.length) {
      const availableTutors = tutors.filter(
        t => tutorsForStudent.includes(t.pk) && (!isStudentOrParent || t.students_can_book),
      )
      if (availableTutors.length) {
        setSelectedTutor(availableTutors[0].pk)
      }
    }
  }, [isUpdate, tutorID, tutorsForStudent]) // eslint-disable-line react-hooks/exhaustive-deps

  // When student or selected tutor changes, we may change selected session type to match what's possible
  const selectedTutorObject = tutors?.find(t => t.pk === selectedTutor)
  // If student or tutor necessitates a single package type
  let requiredSessionType: TutoringSessionType | null = null
  if (selectedTutorObject?.is_test_prep_tutor && !selectedTutorObject.is_curriculum_tutor) {
    requiredSessionType = TutoringSessionType.TestPrep
  } else if (!selectedTutorObject?.is_test_prep_tutor && selectedTutorObject?.is_curriculum_tutor) {
    requiredSessionType = TutoringSessionType.Curriculum
  }

  useEffect(() => {
    if (requiredSessionType) {
      setSessionType(requiredSessionType)
    }
  }, [requiredSessionType])

  // Setting initial values for session type and subject(tutoringService) when "rescheduling"
  // (i.e. props.sessionDetails defined)
  const rescheduleSessionType = (props as EditTutoringSessionModalProps)?.sessionDetails?.session_type
  const rescheduleTutoringService = (props as EditTutoringSessionModalProps)?.sessionDetails?.tutoring_service

  useEffect(() => {
    if (rescheduleSessionType) {
      setSessionType(rescheduleSessionType)
    }
    if (rescheduleTutoringService) {
      setSelectedTutoringservice(rescheduleTutoringService)
    }
  }, [rescheduleSessionType, rescheduleTutoringService])

  const submit = () => {
    setErrors([])
    if (!student) {
      setErrors([...errors, 'Missing student'])
    }
    if (!selectedIndividualTimes.length && !selectedGroupSession && !rescheduleSessionType && !selectedDate) {
      setErrors([...errors, 'Missing tutoring session'])
    }
    if (!selectedTutoringService && !selectedGroupSession) {
      // if group session is selected, subject not needed
      setErrors([...errors, 'Missing subject'])
    }
    if (!sessionType && !selectedGroupSession) {
      // if group session is selected, session type not needed
      setErrors([...errors, 'Missing session type'])
    }
    // Don't need the ||, just included so we don't have to walrus student later on
    if (errors.length || !student) {
      return
    }
    const newSession: Partial<StudentTutoringSession> = {}
    newSession.student = student.pk
    newSession.note = note

    const individualSessionStarts: Moment[] = []
    if (isCustomSession && selectedDate && selectedTime) {
      individualSessionStarts.push(moment(mergeDateAndTime(selectedDate, selectedTime)))
    } else if (selectedIndividualTimes.length || props?.start) {
      individualSessionStarts.push(...selectedIndividualTimes)
      if (individualSessionStarts.length === 0 && props?.start) {
        // We got start as prop because session is being created from a calendar view
        individualSessionStarts.push(moment(props.start))
      }
    }
    //TODO: set new session location to value null
    if (sessionLocation !== NULL_LOCATION_STRING) {
      newSession.location = Number(sessionLocation)
    } else if (sessionLocation === NULL_LOCATION_STRING) {
      newSession.location = null
    }

    // One or more individual sessions
    if (selectedGroupSession) {
      newSession.group_tutoring_session = selectedGroupSession
      newSession.session_type = TutoringSessionType.TestPrep
    } else if (individualSessionStarts.length) {
      newSession.individual_session_tutor = selectedTutor as number
      newSession.duration_minutes = selectedDuration
      newSession.session_type = sessionType as TutoringSessionType
      newSession.tutoring_service = selectedTutoringService
      newSession.is_tentative = isTentative
    } else {

      message.error('An error occurred while scheduling this session')
      return
    }
    setSaving(true)
    let promise

    // Construct promise either updating session or creating our 1+ individual sessions
    if (isUpdate) {
      if (individualSessionStarts.length) {
        newSession.start = individualSessionStarts[0].toISOString()
        newSession.end = moment(newSession.start).add(newSession.duration_minutes, 'minute').toISOString()
      }
      promise = dispatch(
        updateStudentTutoringSession(sessionID as number, {
          ...newSession,
          missed: false,
        }),
      )
    } else if (selectedGroupSession) {
      promise = dispatch(createStudentTutoringSession(newSession))
    } else {
      // In else as Extra safeguard to ensure we only create repeat sessions for tutor/admin creating individual session
      // Loop through individual session times to create session
      const promises = individualSessionStarts.map(t => {
        const sessionData: Partial<StudentTutoringSession> = {
          ...newSession,
          start: moment(t).toISOString(),
          end: moment(t).add(newSession.duration_minutes, 'minute').toISOString(),
        }
        return dispatch(createStudentTutoringSession(sessionData))
      })
      promise = Promise.all(promises)
    }
    promise
      .then((session: StudentTutoringSession) => {
        dispatch(closeModal())
        // If student is paygo, then we show paygo modal for this brand new session :)
        if (
          !isUpdate &&
          student.is_paygo &&
          selectedIndividualTimes.length &&
          (userType === UserType.Student || userType === UserType.Parent)
        ) {
          const paygoModalProps: PaygoPurchaseModalProps = { individualTutoringSessionID: session.pk }
          dispatch(showModal({ modal: MODALS.PAYGO_PURCHASE, props: paygoModalProps }))
        }
        setSelectedIndividualTimes([])
        setSelectedGroupSession(null)
        setNote('')
      })
      .catch((err: AxiosError) => {
        console.warn(err.response) // Deliberately leaving this so it gets picked up by Fullstory
        if (err.response?.status === 400 && err?.response.data) {
          message.error(err.response.data.message || err.response.data)
        }
      })
      .finally(() => {
        setSaving(false)
        setSessionLocation('')
      })
  }

  /**
   * Display list of errors, if there are any
   */
  const renderErrors = () => {
    if (errors.length) {
      return (
        <ul className="modal-errors">
          {errors.map((err, idx) => (
            <li key={idx}>{err}</li>
          ))}
        </ul>
      )
    }
    return null
  }

  /** Render tabs for individual/group session */
  const renderTabs = () => {
    if (props?.start) {
      return null
    }
    return (
      <div className="app-tab-container">
        <Button
          type="link"
          className={activeView === Views.Individual ? 'active' : ''}
          onClick={() => {
            setActiveView(Views.Individual)
            setSelectedGroupSession(null)
          }}
        >
          Individual Session
        </Button>
        {!(props as EditTutoringSessionModalProps)?.sessionDetails && (
          <Button
            type="link"
            className={activeView === Views.Group ? 'active' : ''}
            onClick={() => {
              setActiveView(Views.Group)
              setSelectedIndividualTimes([])
              setSelectedDate(null)
              setSelectedTime(null)
            }}
          >
            Group Session
          </Button>
        )}
      </div>
    )
  }

  /** There can be ambiguity in the type of individual session being booked (curriculum vs test prep)
   * In that instance, this renders a dropdown to clear it up :)
   */
  const renderSelectSessionType = () => {
    const selectedTutorObject = tutors?.find(t => t.pk === selectedTutor)
    if (activeView === Views.Group || !student || !selectedTutorObject) {
      return null
    }
    if (!requiredSessionType) {
      return (
        <div className="ind-session-form-item">
          <label>Tutoring session type:</label>
          <Select
            value={sessionType}
            onChange={(value: TutoringSessionType) => {
              setSessionType(value)
              setSelectedTutoringservice(undefined)
            }}
          >
            <Select.Option value={TutoringSessionType.Curriculum}>Curriculum</Select.Option>
            <Select.Option value={TutoringSessionType.TestPrep}>Test Prep</Select.Option>
          </Select>
        </div>
      )
    }
    return null
  }

  // Render a dropdown to select a student
  const renderSelectStudent = () => {
    if (!allowSelectStudent) {
      return null
    }
    return (
      <div className="ind-session-form-item render-select-student">
        <label>Student:</label>
        <Select value={selectedStudentID} onChange={setSelectedStudentID} showSearch={true} optionFilterProp="children">
          {students.map(s => (
            <Select.Option key={s.pk} value={s.pk}>
              {getFullName(s)}
            </Select.Option>
          ))}
        </Select>
      </div>
    )
  }

  // Render dropdown to select tutor
  const renderSelectTutor = () => {
    if (isUpdate || isTutor) {
      return null
    }

    const filteredTutors = isStudentOrParent ? tutors.filter(t => t.students_can_book) : tutors

    // Helper method that allows us to reset subject selection if new tutor does not support
    // selected service
    const updateSelectedTutor = (newTutor: number) => {
      if (selectedTutoringService) {
        const newTutorObj = tutors.find(t => t.pk === newTutor)
        if (!newTutorObj || !newTutorObj.tutoring_services.includes(selectedTutoringService)) {
          setSelectedTutoringservice(undefined)
        }
      }
      setSelectedTutor(newTutor)
    }

    return (
      <div className="ind-session-form-item render-select-tutor">
        <label>Tutor:</label>
        <Select onChange={updateSelectedTutor} value={selectedTutor} showSearch={true} optionFilterProp="children">
          {filteredTutors.map(t => (
            <Select.Option value={t.pk} key={t.slug}>
              {getFullName(t)}
            </Select.Option>
          ))}
        </Select>
      </div>
    )
  }

  // Render option to select session duration
  const renderSelectDuration = () => {
    return (
      <Row className="duration-custom-session-wrapper">
        <div className="ind-session-form-item">
          <label>Duration:</label>
          {isStudentOrParent && <span>&nbsp;{selectedDuration} minutes</span>}
          {!isStudentOrParent && (
            <Select onChange={setSelectedDuration} value={selectedDuration}>
              {DURATION_OPTIONS.map(val => (
                <Select.Option key={val} value={val}>
                  {val} minutes
                </Select.Option>
              ))}
            </Select>
          )}
        </div>
        {!(props?.start || isStudentOrParent) && (
          <div className="ind-session-form-item custom-session">
            <Button
              type="link"
              className="custom-session-button"
              disabled={!(sessionType && selectedTutoringService)}
              onClick={() => {
                setCustomSession(prev => !prev)
                setSelectedDate(null)
                setSelectedTime(null)
              }}
            >
              {isCustomSession ? 'Select Available Session' : 'Create a Custom Session'}
            </Button>
          </div>
        )}
      </Row>
    )
  }

  // Render <select> for TutoringService (subject)
  const renderSelectTutoringService = () => {
    const filteredServices = tutoringServices.filter(
      s =>
        s.applies_to_individual_sessions &&
        s.session_type === sessionType &&
        selectedTutorObject?.tutoring_services.includes(s.pk),
    )
    return (
      <div className="ind-session-form-item">
        <label>Subject:</label>
        <Select onChange={setSelectedTutoringservice} value={selectedTutoringService}>
          {filteredServices.map(s => (
            <Select.Option value={s.pk} key={s.pk}>
              {s.name}
            </Select.Option>
          ))}
        </Select>
      </div>
    )
  }

  // Render <select> for Location for Session (location)
  const renderLocationPreference = () => {
    return (
      <div className="ind-session-form-item">
        <label>Session Location:</label>
        <Select onChange={setSessionLocation} value={sessionLocation}>
          <Select.Option value={student?.location || studentLocation} key={student?.location || studentLocation}>
            {student
              ? locationObject[student.location]?.name + ' ' + '(In-Person)'
              : locationObject[studentLocation]?.name + ' ' + '(In-Person)'}
          </Select.Option>
          <Select.Option value={NULL_LOCATION_STRING} key={NULL_LOCATION_STRING}>
            Remote
          </Select.Option>
        </Select>
      </div>
    )
  }

  const hours =
    sessionType === TutoringSessionType.TestPrep
      ? student?.individual_test_prep_hours
      : student?.individual_curriculum_hours
  const studentIndividualTimeInMin = hours ? hours * 60 : 0

  // Prevents showing InsufficientHours if no sessionType/Subject selected
  const shouldShowInsufficientHours =
    !isTentative &&
    sessionType &&
    selectedTutoringService &&
    userType &&
    !isUpdate &&
    ![UserType.Administrator, UserType.Counselor].includes(userType) &&
    selectedTutor &&
    studentIndividualTimeInMin < selectedDuration &&
    !(student?.is_paygo && studentIndividualTimeInMin >= 0)

  // Available minutes for individual session. Paygo and rescheduling allows booking a single session w/o hours
  let availableMinutes = studentIndividualTimeInMin
  if ((student?.is_paygo && studentIndividualTimeInMin <= 0) || isUpdate) {
    availableMinutes = selectedDuration
  }
  // We don't limit tentative sessions by student time Allow 1200 minutes for scheduling tentative sessions
  if (isTentative) {
    availableMinutes = 1200
  }

  /** Render UI for selecting a time with an individual tutor */
  const renderIndividualTime = () => {
    return (
      <div className={`individual-session-container ${props?.start ? 'remove-top-margin' : ''}`}>
        {!selectedIndividualTimes.length && (
          <div className="options-header">
            {renderSelectStudent()}
            {renderLocationPreference()}
            {renderSelectTutor()}
            {renderSelectSessionType()}
            {renderSelectTutoringService()}
            {renderSelectDuration()}
          </div>
        )}
        {shouldShowInsufficientHours && student && (
          <InsufficientHoursPrompt
            student={student}
            activeView={
              sessionType === TutoringSessionType.TestPrep
                ? InsufficientHoursPromptViews.IndividualTestPrep
                : InsufficientHoursPromptViews.IndividualCurriculum
            }
            duration={selectedDuration}
          />
        )}
        {props?.start && (
          <label className="time-label">
            {isUpdate ? 'Edit session to be' : 'Creating a session'} on {moment(props.start).format('dddd MMM Do')} at{' '}
            {moment(props.start).format('h:mma')}
          </label>
        )}
        {/* MUST BE AVAILABLE INDIVIDUAL SESSIONS */}
        {!props?.start &&
          selectedTutor &&
          selectedTutoringService &&
          sessionLocation &&
          !shouldShowInsufficientHours &&
          !isCustomSession && (
            <IndividualTutoringSessionSelector
              duration={selectedDuration}
              onConfirm={setSelectedIndividualTimes}
              tutorID={selectedTutor as number}
              availableMinutes={availableMinutes}
              disallowRepeat={isUpdate}
              sessionLocation={sessionLocation}
            />
          )}
        {/* MUST BE CUSTOM INDIVIDUAL SESSIONS (with date & time set) ... time to submit note */}
        {isCustomSession && selectedDate && selectedTime && !shouldShowInsufficientHours && (
          <div className={styles.timeSelectedContainer}>
            You selected:&nbsp;
            <label>
              {moment(mergeDateAndTime(selectedDate, selectedTime)).format('MMM Do')}&nbsp;at&nbsp;
              {moment(mergeDateAndTime(selectedDate, selectedTime)).format('h:mma')}
            </label>
            <Button
              onClick={() => {
                setSelectedDate(null)
                setSelectedTime(null)
              }}
            >
              Change
            </Button>
          </div>
        )}
        {/* MUST BE CUSTOM INDIVIDUAL SESSIONS but date and time not selected yet*/}
        {isCustomSession && (!selectedDate || !selectedTime) && !shouldShowInsufficientHours && (
          <div className="custom-datetime-wrapper">
            <div className="date-wrapper">
              <label>Date:</label>
              <DatePicker
                defaultValue={selectedDate}
                value={selectedDate}
                onChange={(date: Moment) => setSelectedDate(date)}
              />
            </div>
            <div className="time-wrapper">
              <label>Time:</label>
              <TimePicker
                use12Hours
                inputReadOnly
                defaultPickerValue={updateSessionStart ? moment(updateSessionStart) : null}
                value={selectedTime}
                onChange={(value: Moment) => setSelectedTime(value)}
                minuteStep={15}
                format="h:mm a"
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  /** Render UI for selecting a group tutoring session */
  const renderGroupTime = () => {
    let studentGroupTimeInMin = 0
    if (student?.group_test_prep_hours) {
      studentGroupTimeInMin = student.group_test_prep_hours * 60
    }
    return (
      <GroupTutoringSessionSelector
        groupMinsAvailable={studentGroupTimeInMin}
        location={student?.location || undefined}
        onSelect={setSelectedGroupSession}
      />
    )
  }

  /** Render note (added only for individual sessions after session time is selected) */
  const renderNote = () => {
    return (
      <div className="form-group note-container">
        {userType && [UserType.Student, UserType.Parent].includes(userType) && (
          <label>Enter an (optional) note for your tutor:</label>
        )}
        {userType && [UserType.Tutor, UserType.Administrator].includes(userType) && (
          <label>Optional note about this session (won&apos;t be visible to {student?.first_name}):</label>
        )}
        <Input.TextArea value={note} onChange={e => setNote(e.target.value)} />
      </div>
    )
  }

  const getIsDisabled = () => {
    if (activeView === Views.Individual) {
      // Custom Individual Time
      if (isCustomSession) {
        return !(
          sessionType &&
          selectedTutoringService &&
          selectedDuration &&
          selectedDate &&
          !shouldShowInsufficientHours
        )
      }
      //  Individual Session from Ops Calendar with props.start (create session by clicking on calendar)
      if (props?.start) {
        return !(selectedStudentID && selectedTutor && sessionType && selectedTutoringService && selectedDuration)
      }
      // Individual session w/o props.start (Tutoring Session from Tutor Availabilities)
      return !(
        sessionType &&
        selectedTutoringService &&
        selectedDuration &&
        selectedIndividualTimes.length &&
        !shouldShowInsufficientHours
      )
    }
    if (activeView === Views.Group) {
      return !selectedGroupSession
    }
    // by default enable confirm button (i.e. don't disable) (should never reach this code - just making linter happy)
    return false
  }

  // Used on cancel/close
  const doCloseModal = () => {
    resetSelections()
    dispatch(closeModal())
  }

  const disableSubmit = getIsDisabled()

  const modalFooter = (
    <div className="modal-footer">
      {(isTutor || isAdmin) && (
        <div className="tentative-container">
          <Checkbox checked={isTentative} onChange={e => setIsTentative(e.target.checked)} />
          Is Tentative
          <br />
          <span className="help">(student will not see session; does not use hours)</span>
        </div>
      )}
      <div className="buttons-container">
        <Button type="default" onClick={doCloseModal}>
          Cancel
        </Button>
        <Button loading={saving} type="primary" disabled={disableSubmit} onClick={submit}>
          Confirm
        </Button>
      </div>
    </div>
  )

  return (
    <Modal
      wrapClassName="modal-tutoring-session"
      className={styles.createTutoringSessionModal}
      visible={visible}
      footer={modalFooter}
      destroyOnClose
      title={`${isUpdate ? 'Reschedule' : 'Schedule'} Tutoring Session ${isTutor ? `for ${student?.first_name}` : ''}`}
      onCancel={doCloseModal}
    >
      <TutoringSessionModalContextProvider value={contextValue}>
        {loading && <Skeleton />}
        {!loading && !props?.start && renderTabs()}
        {!loading && activeView === Views.Individual && renderIndividualTime()}
        {!loading && activeView === Views.Group && renderGroupTime()}
        {selectedIndividualTimes.length > 0 && renderNote()}
        {selectedDate && selectedTime && !shouldShowInsufficientHours && renderNote()}
        {renderErrors()}
      </TutoringSessionModalContextProvider>
    </Modal>
  )
}

export default CreateTutoringSessionModal
