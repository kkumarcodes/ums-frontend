// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretDownOutlined, CaretUpOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { Button, Dropdown, Menu, message, Modal, Radio, Skeleton } from 'antd'
import { ClickParam } from 'antd/lib/menu'
import { AddUserForm, getFullName } from 'components/administrator'
import { StudentResourceManager } from 'components/common/StudentResourceManager'
import { TaskSessionCalendarContainer } from 'components/common/TaskSession'
import ViewDiagnostics from 'components/student/ViewDiagnostics'
import { StudentProfile } from 'components/common/StudentProfile'
import TaskSessionList from 'components/tutoring/TaskSessionList'
import _ from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { CreateableNotification, createNotification } from 'store/notification/notificationsThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectIsCounselor } from 'store/user/usersSelector'
import { fetchParents, fetchStudents } from 'store/user/usersThunks'
import { Counselor, Parent, Student, Tutor, UserType } from 'store/user/usersTypes'
import SessionNotes from './SessionNotes'
import styles from './styles/StudentList.scss'

interface OwnProps {
  tutor?: number
  counselor?: number
  searchText?: string
}

enum ExpandedRowViews {
  Tutoring,
  SessionNotes,
  Tasks,
  Calendar,
  Diagnostics,
  Resources,
  Courses,
  Profile,
}

enum SortProperties {
  name = 'last_name',
  nextMeeting = 'next_meeting',
  location = 'locationName',
}

enum TaskDisplay {
  upcoming = 'upcoming',
  completed = 'completed',
}

interface StudentWithLocation extends Student {
  locationName?: string
}

/**
 * Renders an expandable list of students for given tutor/counselor
 * @param tutor tutorID
 * @param counselor counselorID
 * @param searchText searchText used to filter student list
 */
const CASStudentList = ({ tutor, counselor, searchText = '' }: OwnProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [showUpcomingTasks, setShowUpcomingTasks] = useState<TaskDisplay>(TaskDisplay.upcoming)
  const [showUpcomingSessions, setShowUpcomingSessions] = useState<TaskDisplay>(TaskDisplay.upcoming)
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  // PK of expanded student (or null if no student is expanded)
  const [expandedStudent, setExpandedStudent] = useState<number | null>(
    params.get('student') ? Number(params.get('student')) : null,
  )
  // Active view (tab) for expanded row
  const [activeView, setActiveView] = useState<ExpandedRowViews>(
    expandedStudent ? ExpandedRowViews.Profile : ExpandedRowViews.Tutoring,
  )
  const [sortKey, setSortKey] = useState(SortProperties.name)
  const [sortAsc, setSortAsc] = useState(false)
  const history = useHistory()

  const { students, parents, activeTutor, activeCounselor } = useSelector((state: RootState) => {
    let activeTutor: Tutor | null = null
    let activeCounselor: Counselor | null = null
    let students: Array<Student> = []
    let parents: { [pk: number]: Parent } = {}
    if (tutor) {
      activeTutor = state.user.tutors[tutor]
      students = activeTutor ? Object.values(state.user.students).filter(s => activeTutor?.students.includes(s.pk)) : []
      parents = activeTutor ? state.user.parents : {}
    } else if (counselor) {
      activeCounselor = state.user.counselors[counselor]
      students = activeCounselor
        ? Object.values(state.user.students).filter(s => s.counselor === activeCounselor.pk)
        : []
    }
    const returnStudents: Array<StudentWithLocation> = _.sortBy(
      students.map((s: StudentWithLocation) => {
        return { ...s, locationName: s.location ? state.tutoring.locations[s.location as number].name : '' }
      }),
      sortKey,
    )
    return {
      activeTutor,
      activeCounselor,
      students: sortAsc ? returnStudents.reverse() : returnStudents,
      parents,
    }
  })
  // Reload students whenever tutor or counselor changes
  const activeTutorPK = activeTutor?.pk
  const activeCounselorPK = activeCounselor?.pk
  const isCounselor = useSelector(selectIsCounselor)

  const loadStudents = students.length === 0

  useEffect(() => {
    if (loadStudents && !loading) {
      setLoading(true)
      Promise.all([
        dispatch(fetchStudents({ tutor: activeTutorPK, counselor: activeCounselorPK })),
        dispatch(fetchParents()),
      ])
        .catch(() => message.error('Failed to load students and parents'))
        .finally(() => setLoading(false))
    }
  }, [dispatch, activeTutorPK, activeCounselorPK]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Filter students based on searchText (filter targets: student name/email and parent name/email)
   */
  const filterStudents = (searchText: string, students: Student[]) => {
    const search = searchText.toLowerCase()
    return students.filter(s => {
      return (
        getFullName(s).toLowerCase().includes(search) ||
        s.email.includes(search) ||
        (s.parent && getFullName(parents[s.parent]).toLowerCase().includes(search)) ||
        (s.parent && parents[s.parent].email.includes(search))
      )
    })
  }

  /** User (counselor) wants to send student an email inviting them to take a diagnostic*/
  const confirmDiagRegistrationEmail = (student: Student) => {
    const confirm = () =>
      createNotification(student.notification_recipient, CreateableNotification.DiagnosticInvite)
        .then(() => message.success('Diagnostic invite sent'))
        .catch(() => message.error('Failed to send diagnostic invite'))

    Modal.confirm({
      title: `Send ${getFullName(student)} an email inviting them to register for a diagnostic?`,
      okText: 'Yup - send the email',
      onOk: confirm,
    })
  }

  /** User clicks on our actions menu for an expanded student */
  const actionsMenuClick = (menuItem: ClickParam, studentID: number) => {
    if (menuItem.key === 'task') {
      dispatch(showModal({ props: { studentID }, modal: MODALS.CREATE_TASK }))
    } else if (menuItem.key === 'session') {
      dispatch(showModal({ props: { studentID, tutorID: tutor }, modal: MODALS.CREATE_TUTORING_SESSION }))
    } else if (menuItem.key === 'message') {
      history.push('/message')
    } else if (menuItem.key === 'diagnostic') {
      confirmDiagRegistrationEmail(students.find(s => s.pk === studentID))
    }
  }

  // Toggle sort key and direction
  const toggleSort = (updateSortKey: SortProperties) => {
    if (sortKey === updateSortKey) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(updateSortKey)
      setSortAsc(true)
    }
  }

  // Toggle between Task and Session display
  const updateToggle = (componentType: string, value: TaskDisplay) => {
    if (componentType === 'Tasks') {
      setShowUpcomingTasks(value)
    } else {
      setShowUpcomingSessions(value)
    }
  }

  // display component depending upon selection
  const toggleCompletedAndUpcoming = (student: Student) => {
    const componentType = activeView === 0 ? 'Sessions' : 'Tasks'

    const taskShowUpcoming = () => showUpcomingTasks === TaskDisplay.completed
    const sessionShowUpcoming = () => showUpcomingSessions === TaskDisplay.completed

    const displayComponent =
      componentType === 'Sessions' ? (
        <TaskSessionList student={student} showSessions={true} showCompleted={sessionShowUpcoming()} tutorUser={true} />
      ) : (
        <TaskSessionList student={student} showTasks={true} showCompleted={taskShowUpcoming()} tutorUser={true} />
      )

    return (
      <div>
        <Radio.Group
          defaultValue="upcoming"
          buttonStyle="solid"
          onChange={e => updateToggle(componentType, e.target.value)}
        >
          <Radio.Button value="completed">Completed {componentType}</Radio.Button>
          <Radio.Button value="upcoming">Upcoming {componentType}</Radio.Button>
        </Radio.Group>
        {displayComponent}
      </div>
    )
  }

  /** Render Expanded Student row (Task/Sessions tab, Resources tab, Actions button) */
  const renderExpandStudent = (student: Student) => {
    const ActionsMenu = (
      <Menu onClick={e => actionsMenuClick(e, student.pk)}>
        <Menu.Item key="diagnostic">Invite to Diagnostic</Menu.Item>
        <Menu.Item key="task">Assign Task</Menu.Item>
        <Menu.Item key="session">Create Tutoring Session</Menu.Item>
        <Menu.Item key="message">Message</Menu.Item>
      </Menu>
    )

    return (
      <div className="student-row-expanded">
        <div className="student-row-expanded-header">
          <div className="app-tab-container">
            <a
              href="#"
              className={activeView === ExpandedRowViews.Tutoring ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setShowUpcomingSessions(TaskDisplay.upcoming)
                setActiveView(ExpandedRowViews.Tutoring)
              }}
            >
              Tutoring
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.SessionNotes ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(ExpandedRowViews.SessionNotes)
              }}
            >
              Notes
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.Tasks ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setShowUpcomingTasks(TaskDisplay.upcoming)
                setActiveView(ExpandedRowViews.Tasks)
              }}
            >
              Tasks
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.Calendar ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(ExpandedRowViews.Calendar)
              }}
            >
              Calendar
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.Diagnostics ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(ExpandedRowViews.Diagnostics)
              }}
            >
              Diagnostics
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.Resources ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(ExpandedRowViews.Resources)
              }}
            >
              Resources
            </a>
            <a
              href="#"
              className={activeView === ExpandedRowViews.Profile ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(ExpandedRowViews.Profile)
              }}
            >
              Profile
            </a>
          </div>
          <Dropdown overlay={ActionsMenu} trigger={['click']}>
            <Button type="primary">
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <div className="student-row-expanded-content">
          {activeView === ExpandedRowViews.Tutoring && toggleCompletedAndUpcoming(student)}
          {activeView === ExpandedRowViews.SessionNotes && <SessionNotes studentID={student.pk} tutorID={tutor} />}
          {activeView === ExpandedRowViews.Tasks && toggleCompletedAndUpcoming(student)}
          {activeView === ExpandedRowViews.Calendar && (
            <TaskSessionCalendarContainer studentID={student.pk} userID={student.user_id} />
          )}
          {activeView === ExpandedRowViews.Diagnostics && <ViewDiagnostics studentID={student.pk} />}
          {activeView === ExpandedRowViews.Resources && <StudentResourceManager studentID={student.pk} />}
          {activeView === ExpandedRowViews.Profile && <StudentProfile studentID={student.pk} />}
        </div>
      </div>
    )
  }

  /** Render a table row for a single student */
  const renderStudent = (student: StudentWithLocation) => {
    const expanded = student.pk === expandedStudent

    return (
      <div className={`student-list-row-outer ${expanded ? 'expanded' : ''}`} key={student.pk}>
        <div
          className="student-list-row-inner"
          role="button"
          tabIndex={0}
          onClick={() => {
            setExpandedStudent(expanded ? null : student.pk)
            setShowUpcomingTasks(TaskDisplay.upcoming)
            setShowUpcomingSessions(TaskDisplay.upcoming)
          }}
          onKeyPress={k => k.charCode === 13 && setExpandedStudent(expanded ? null : student.pk)}
        >
          <div className="student-row-name">
            {expanded ? <UpOutlined /> : <DownOutlined />}
            {getFullName(student)}
          </div>
          <div className="student-row-next-meeting">
            {student.next_meeting ? moment(student.next_meeting).format('ddd, MMM Do, h:mma') : ''}
          </div>
          <div className="student-row-location">{student.locationName}</div>
        </div>
        {expanded && renderExpandStudent(student)}
      </div>
    )
  }

  return (
    <div className={styles.studentList}>
      <div className="student-list-toolbar">
        <h2 className="f-title">Student List</h2>
        {isCounselor && (
          <AddUserForm userType={UserType.Student} isCounselorApp={false} counselorID={activeCounselor.pk} />
        )}
      </div>
      <div className="student-list-header">
        <div
          role="button"
          tabIndex={0}
          onKeyPress={e => e.charCode === 13 && toggleSort(SortProperties.name)}
          onClick={() => toggleSort(SortProperties.name)}
        >
          Name
          {sortKey === SortProperties.name && sortAsc && <CaretUpOutlined />}
          {sortKey === SortProperties.name && !sortAsc && <CaretDownOutlined />}
        </div>
        <div
          role="button"
          tabIndex={0}
          onKeyPress={e => e.charCode === 13 && toggleSort(SortProperties.nextMeeting)}
          onClick={() => toggleSort(SortProperties.nextMeeting)}
        >
          Next Meeting
          {sortKey === SortProperties.nextMeeting && sortAsc && <CaretUpOutlined />}
          {sortKey === SortProperties.nextMeeting && !sortAsc && <CaretDownOutlined />}
        </div>
        <div
          role="button"
          tabIndex={0}
          onKeyPress={e => e.charCode === 13 && toggleSort(SortProperties.location)}
          onClick={() => toggleSort(SortProperties.location)}
        >
          Location
          {sortKey === SortProperties.location && sortAsc && <CaretUpOutlined />}
          {sortKey === SortProperties.location && !sortAsc && <CaretDownOutlined />}
        </div>
      </div>
      <div className="student-list-table-container">
        {loading ? <Skeleton /> : filterStudents(searchText, students).map(renderStudent)}
      </div>
    </div>
  )
}

export default CASStudentList
