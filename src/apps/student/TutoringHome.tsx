// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { message, Skeleton } from 'antd'
import { TaskSessionCalendarContainer } from 'components/common/TaskSession'
import HoursCounter from 'components/tutoring/HoursCounter'
import TaskSessionList from 'components/tutoring/TaskSessionList'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Platform } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectActiveUser, selectStudent } from 'store/user/usersSelector'
import { fetchStudent, fetchTutors } from 'store/user/usersThunks'
import styles from './styles/Home.scss'

enum Views {
  List,
  Calendar,
}

interface OwnProps {
  studentPK?: number // If not included, then we'll use active user if they're a student
}

const StudentHome = ({ studentPK }: OwnProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)

  const [activeView, setActiveView] = useState(Views.List)
  const activeUser = useSelector(selectActiveUser)

  const studentID = studentPK || (activeUser?.userType === 'student' ? activeUser.cwUserID : undefined)
  const activeStudent = useSelector(selectStudent(studentID))

  // If we are displaying this component on the counseling platfor, then we need to load student's
  // tutoring data
  const mustLoad = !activeStudent?.loaded_tutoring_data || activeStudent?.individual_test_prep_hours === undefined
  useEffect(() => {
    if (studentID && mustLoad) {
      setLoading(true)
      dispatch(fetchStudent(studentID, Platform.CAS)).finally(() => setLoading(false))
      // We don't need to wait for this to finish to render
      dispatch(fetchTutors())
    }
  }, [studentID, mustLoad, dispatch])

  const renderListView = () => {
    return (
      <div className="lists-containers">
        <TaskSessionList student={activeStudent} showSessions={true} />
        <hr />
        <TaskSessionList student={activeStudent} showTasks={true} />
      </div>
    )
  }
  if (activeStudent && studentID && !loading) {
    return (
      <div className={`${styles.studentHome} app-home`}>
        <div className="student-hours-actions">
          {activeStudent.loaded_tutoring_data && <HoursCounter studentPK={studentID} />}
        </div>
        <div className="app-cta-buttons">
          <button
            type="button"
            onClick={() => {
              dispatch(
                showModal({
                  modal: MODALS.SELF_ASSIGN_DIAGNOSTIC,
                  props: { studentID },
                }),
              )
            }}
            className="cta-button-mobile"
          >
            Take Diagnostic
          </button>
          <button
            type="button"
            onClick={() => {
              dispatch(
                showModal({
                  modal: MODALS.CREATE_TUTORING_SESSION,
                  props: { studentID },
                }),
              )
            }}
            className="cta-button-mobile cta-button-primary"
          >
            Schedule Session
          </button>
        </div>
        <div className="student-tasks-sessions-container app-white-container">
          <h2 className="page-title">Upcoming Sessions and Tasks</h2>
          <div className="app-tab-container">
            <a
              href="#"
              className={activeView === Views.List ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(Views.List)
              }}
            >
              List View
            </a>
            <a
              href="#"
              className={activeView === Views.Calendar ? 'active' : ''}
              onClick={e => {
                e.preventDefault()
                setActiveView(Views.Calendar)
              }}
            >
              Calendar View
            </a>
          </div>

          {activeView === Views.List && renderListView()}
          {activeView === Views.Calendar && <TaskSessionCalendarContainer />}
        </div>

        <div className="student-tasks-sessions-container completed app-white-container">
          <h2 className="page-title">Completed Sessions and Tasks</h2>
          <div className="lists-containers">
            <TaskSessionList student={activeStudent} showSessions={true} showCompleted={true} />
            <hr />
            <TaskSessionList student={activeStudent} showTasks={true} showCompleted={true} />
          </div>
        </div>
      </div>
    )
  }
  return <Skeleton loading />
}
export default StudentHome
