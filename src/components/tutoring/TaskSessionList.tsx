// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Skeleton } from 'antd'
import TaskListItem from 'components/task/TaskListItem'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { fetchStudentTutoringSessions } from 'store/tutoring/tutoringThunks'
import { StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { selectIsParent, selectIsStudent } from 'store/user/usersSelector'
import { Student, Tutor } from 'store/user/usersTypes'
import styles from './styles/TaskSessionList.scss'
import TutoringSessionItem from './TutoringSessionItem'

// Number of tasks to show when displayAll is false
const NUMBER_TO_SHOW = 3

interface OwnProps {
  student?: Student
  tutor?: Tutor
  showCompleted?: boolean
  showTasks?: boolean
  showSessions?: boolean
  tutorUser?: boolean | undefined
}

enum ElementType {
  session,
  task,
}

interface DisplayElement {
  type: ElementType
  value: Task | StudentTutoringSession // TODO: OR Session
  date: Moment | null
}

const TaskList = (props: OwnProps) => {
  const dispatch = useReduxDispatch()
  const [displayAll, setDisplayAll] = useState(false)
  const [loading, setLoading] = useState(false)

  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)

  const { displayElements } = useSelector((state: RootState) => {
    let userPK = state.user.activeUser?.userID
    if (props.student) {
      userPK = props.student.user_id
    } else if (props.tutor) {
      userPK = props.tutor.user_id
    }

    const tasks = props.showTasks
      ? _.values(state.task.tasks)
          .filter(t => t.diagnostic || !t.is_cap_task)
          .filter(t => t.for_user === userPK && Boolean(t.completed) === Boolean(props.showCompleted))
          .map(t => ({ value: t, type: ElementType.task, date: t.due ? moment(t.due) : null }))
      : []

    // TODO: Show sessions for tutors
    let sessions: Array<DisplayElement> = []
    if (props.showSessions && props.student) {
      //if diff is negative or zero - session is upcoming. if diff is positive - session complete.
      sessions = Object.values(state.tutoring.studentTutoringSessions)
        .filter(
          s =>
            // Extra safeguard to ensure students aren't shown tentative sessions
            (!(isStudent || isParent) || !s.is_tentative) &&
            s.student === props.student?.pk &&
            (props.showCompleted ? moment(s.end) < moment() : moment(s.end) > moment()) &&
            !s.cancelled,
        )
        .map(s => ({ value: s, type: ElementType.session, date: moment(s.start) } as DisplayElement))
    }
    /**
     * We combine tasks and sessions, so we can sort them together by due date (tasks).
     *
     */

    return {
      displayElements: _.orderBy([...tasks, ...sessions], e => e.date),
    }
  }, shallowEqual)

  const studentUserID = props.student?.user_id
  const tutorUserID = props.tutor?.user_id
  const studentPK = props.student?.pk
  const tutorPK = props.tutor?.pk

  const fetchTasksCB = useCallback(() => {
    if (!displayElements.length) {
      setLoading(true)
      // Load Tasks and sessions
      const promises: Promise<any>[] = []
      if (props.showTasks && (studentUserID || tutorUserID)) {
        const userPK = studentUserID || tutorUserID
        promises.push(userPK ? dispatch(fetchTasks({ user: userPK })) : dispatch(fetchTasks()))
      }

      if (props.showSessions && studentPK) {
        promises.push(dispatch(fetchStudentTutoringSessions({ student: studentPK })))
      } else if (props.showSessions && tutorPK) {
        promises.push(dispatch(fetchStudentTutoringSessions({ tutor: tutorPK })))
      }

      Promise.all(promises).then(r => {
        setLoading(false)
      })
    }
  }, [
    dispatch,
    displayElements.length,
    props.showSessions,
    props.showTasks,
    studentPK,
    studentUserID,
    tutorPK,
    tutorUserID,
  ])

  useEffect(() => {
    fetchTasksCB()
  }, [fetchTasksCB])

  /**
   * Returns the elements that should be displayed, considering this.state.displayAll
   */
  const getDisplayElements = () => {
    return displayElements.slice(0, displayAll ? displayElements.length : NUMBER_TO_SHOW)
  }

  /** Helper function to get the name of the item to display */
  const getItemDisplayType = () => {
    if (props.showSessions && props.showTasks) {
      return `${props.showCompleted ? 'completed' : 'upcoming'} items`
    }
    if (props.showSessions && props.showCompleted) {
      return `${props.showCompleted ? 'completed' : 'upcoming'} sessions`
    }
    if (props.showTasks) {
      return `${props.showCompleted ? 'completed' : 'upcoming'} tasks`
    }
    return 'upcoming sessions'
  }

  const renderDisplayLabel = () => {
    return displayAll
      ? `SEE FEWER ${getItemDisplayType()}`
      : `SEE ALL ${getItemDisplayType()} (${displayElements.length})`
  }

  /** Display empty state. Displays skeleton while loading */
  if (!displayElements.length) {
    return (
      <div className={styles.taskList}>
        {loading && <Skeleton />}
        {!loading && <div className="empty-state">You do not have any {getItemDisplayType()}</div>}
      </div>
    )
  }
  /** Note displayCount and currentItem needed to conditionally style last element */
  return (
    <div className={`${styles.taskList} task-list`}>
      {getDisplayElements().map((t, index) =>
        t.type === ElementType.task ? (
          <TaskListItem key={t.value.pk} task={t.value as Task} tutorUser={props.tutorUser} />
        ) : (
          <TutoringSessionItem
            key={t.value.pk}
            session={t.value as StudentTutoringSession}
            tutorUser={props.tutorUser}
            displayCount={getDisplayElements()?.length - 1}
            currentItem={index}
          />
        ),
      )}

      {(displayAll || getDisplayElements().length < displayElements.length) && (
        <div
          className="toggle-all"
          role="tree"
          tabIndex={0}
          onKeyDown={e => {
            if (e.which === 13) {
              setDisplayAll(!displayAll)
            }
          }}
          onClick={e => {
            setDisplayAll(!displayAll)
          }}
        >
          {renderDisplayLabel()}
        </div>
      )}
    </div>
  )
}

export default TaskList
