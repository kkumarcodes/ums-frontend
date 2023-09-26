// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Skeleton } from 'antd'
import styles from 'apps/student/styles/Home.scss'
import HoursCounter from 'components/tutoring/HoursCounter'
import TaskSessionList from 'components/tutoring/TaskSessionList'
import useActiveStudent from 'libs/useActiveStudent'
import React, { useEffect } from 'react'
import { Platform } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { fetchStudent } from 'store/user/usersThunks'

const ParentTutoringHome = () => {
  const activeStudent = useActiveStudent()
  const dispatch = useReduxDispatch()

  // We always re-fetch active student's tutoring details since they may be stale
  const studentPK = activeStudent?.pk
  useEffect(() => {
    if (studentPK) dispatch(fetchStudent(studentPK, Platform.CAS))
  }, [dispatch, studentPK])

  const renderListView = () => {
    if (!activeStudent) return null
    return (
      <div className="lists-containers">
        <TaskSessionList student={activeStudent} showSessions={true} />
        <hr />
        <TaskSessionList student={activeStudent} showTasks={true} />
      </div>
    )
  }

  if (activeStudent) {
    return (
      <div className={`${styles.studentHome} app-home`}>
        <div className="student-hours-actions">
          <HoursCounter studentPK={activeStudent?.pk} />
        </div>
        <div className="app-cta-buttons">
          <button
            type="button"
            onClick={() => {
              dispatch(
                showModal({
                  modal: MODALS.SELF_ASSIGN_DIAGNOSTIC,
                  props: { studentID: activeStudent.pk },
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
                  props: { studentID: activeStudent.pk },
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
            <a href="#">List View</a>
          </div>

          {renderListView()}
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
  return <Skeleton />
}
export default ParentTutoringHome
