// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  CheckSquareFilled,
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  Loading3QuartersOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, Empty, Input, message, Popconfirm, Skeleton, Tag, Tooltip } from 'antd'
import { filter, isEmpty, orderBy, sortBy } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { selectCounselorMeetingsForStudent } from 'store/counseling/counselingSelectors'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import { deleteTask, fetchTasksForStudent, syncEssayTasks } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'
import { selectSUDsForStudent } from 'store/university/universitySelectors'
import { selectIsCounselor, selectIsCounselorOrAdmin, selectIsParent, selectIsStudent } from 'store/user/usersSelector'
import CounselingAddTask from './CounselingAddTask'
import styles from './styles/CounselingStudentParentTaskList.scss'

type Props = {
  studentID: number
  condensed?: boolean
  includeAddTask?: boolean
  // If true, then this component will only display tasks that have a form for a student. It will display
  // complete and incomplete items, with and without dates
  formsOnly?: boolean
  // If true (default) We always load task when component opens
  alwaysLoad?: boolean
  showStudentTasks?: boolean
  showParentTasks?: boolean
  // Control whether or not this component will fetch tasks. Use false if parent is responsible for fetching
  fetchTasks?: boolean
}

const CounselingStudentParentTaskList = ({
  studentID,
  condensed = false,
  includeAddTask = false,
  formsOnly = false,
  alwaysLoad = true,
  showStudentTasks = true,
  showParentTasks = true,
  fetchTasks = true,
}: Props) => {
  const dispatch = useReduxDispatch()
  const location = useLocation()
  const routerURLParams = new URLSearchParams(location.search)
  const [displayComplete, setDisplayComplete] = useState(false)
  const [search, setSearch] = useState('')
  const [syncingEssays, setSyncingEssays] = useState(false)
  const studentUniversityDecisions = useSelector(selectSUDsForStudent(studentID))
  const isCounselor = useSelector(selectIsCounselor)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const allStudentTasks = useSelector(selectTasksForStudent(studentID))

  // Break out predicate for filtering tasks since there are so many cases
  const taskFilter = (t: Task) => {
    // Counselors see all due tasks and all tasks visible to student that aren't due
    if (isCounselor && !(t.due || t.visible_to_counseling_student)) return false
    // Students/parents see all tasks visible to student as well as prompt tasks that have a due date
    if (!isCounselor && !(t.visible_to_counseling_student || (t.is_prompt_task && t.due))) return false

    // Futher filter based on props
    if (!showParentTasks && t.counseling_parent_task) return false
    if (!showStudentTasks && !t.counseling_parent_task) return false
    return true
  }

  const tasks = orderBy(filter(allStudentTasks, taskFilter), ['completed', 'due'])
  const meetings = sortBy(useSelector(selectCounselorMeetingsForStudent(studentID)), 'order')

  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const paramMeeting = routerURLParams.get('meeting')
    ? meetings.find(m => m.pk === Number(routerURLParams.get('meeting')))
    : null

  // Actions to edit or delete task
  const showEditTask = (task: number) =>
    dispatch(showModal({ modal: MODALS.CREATE_COUNSELING_TASK, props: { taskID: task, studentID } }))

  const doDeleteTask = async (task: number) => {
    setDeleting(true)
    await dispatch(deleteTask(task))
    setDeleting(false)
  }

  // Load tasks according to alwaysLoad
  const tasksExist = !isEmpty(tasks)
  useEffect(() => {
    if (fetchTasks && (alwaysLoad || !tasksExist)) {
      setLoading(!tasksExist)
      dispatch(fetchTasksForStudent(studentID)).then(() => setLoading(false))
    }
  }, [dispatch, studentID]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync essay tasks with Prompt
  const syncEssays = useCallback(() => {
    setSyncingEssays(true)
    dispatch(syncEssayTasks(studentID))
      .catch(e => message.error('Failed to sync essays'))
      .finally(() => setSyncingEssays(false))
  }, [dispatch, studentID])

  const refreshTaskList = () => {
    setRefreshing(true)
    dispatch(fetchTasksForStudent(studentID)).then(() => setRefreshing(false))
  }

  const renderTask = (task: Task) => {
    const meeting = meetings.find(m => m.tasks.includes(task.pk))
    const suds = task.student_university_decisions.length
      ? studentUniversityDecisions.filter(s => task.student_university_decisions.includes(s.pk))
      : []
    return (
      <div className={`task ${task.completed && !formsOnly && 'completed'}`} key={task.slug}>
        <div className="row-content flex">
          <span
            className="title"
            role="button"
            tabIndex={0}
            onKeyPress={() => dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: task.pk } }))}
            onClick={() => dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: task.pk } }))}
          >
            <span>{task.title}</span>
          </span>
          {!condensed && <div className="meeting">{meeting?.title}</div>}
          {!formsOnly && <div className="due">{task.due && moment(task.due).format('MMM Do')}</div>}

          <div className="complete">
            {task.completed ? (
              <Button
                className="completed-btn"
                type="ghost"
                onClick={() => dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: task.pk } }))}
              >
                <CheckSquareFilled className="completed-icon" />
              </Button>
            ) : (
              // eslint-disable-next-line jsx-a11y/control-has-associated-label
              <div
                className="complete-box"
                role="button"
                tabIndex={0}
                onKeyPress={() => dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: task.pk } }))}
                onClick={() => dispatch(showModal({ modal: MODALS.SUBMIT_TASK, props: { taskID: task.pk } }))}
              />
            )}
            {isCounselorOrAdmin && (
              <div className="counselor-actions-container">
                <Button
                  type="default"
                  shape="circle"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => showEditTask(task.pk)}
                />
                <Popconfirm onConfirm={() => doDeleteTask(task.pk)} title="Are you sure you want to delete this task?">
                  <Button type="default" shape="circle" size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              </div>
            )}
          </div>
        </div>
        {suds.length ? (
          <div className="row-schools">
            {suds.map(s => (
              <Tag key={s.slug}>{s.university_name}</Tag>
            ))}
          </div>
        ) : (
          ''
        )}
      </div>
    )
  }

  let filteredTasks: Task[] = []
  if (formsOnly) {
    filteredTasks = tasks.filter(t => t.form)
  } else {
    // Search will turn up complete tasks
    filteredTasks = tasks.filter(t => !t.completed || displayComplete || search.length > 2)
    // Counselors can only see counseling and diagnostic tasks
    if (isCounselor) {
      filteredTasks = filteredTasks.filter(t => t.is_cap_task)
    }
    if (search.length > 2) {
      filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()))
    }
    if (paramMeeting) {
      filteredTasks = filteredTasks.filter(t => paramMeeting.tasks.includes(t.pk))
    }
  }

  return (
    <div className={styles.CounselingStudentParentTaskList}>
      {tasks.length > 0 && !formsOnly && !loading && (
        <>
          <div className="wisernet-toolbar">
            {paramMeeting && (
              <div className="meeting-filter-alert center">
                You are viewing tasks for the meeting: {paramMeeting.title}
                <Button type="link" href={`#${location.pathname}`}>
                  View All Tasks
                </Button>
              </div>
            )}
            <div className="filter">
              <Tooltip title="Refresh Tasks">
                <Button
                  className="refresh-tasks-btn"
                  type="default"
                  shape="circle"
                  loading={refreshing}
                  icon={<Loading3QuartersOutlined />}
                  onClick={refreshTaskList}
                />
              </Tooltip>
              <Button type="default" className="sync-essay-tasks" onClick={syncEssays} loading={syncingEssays}>
                <CloudSyncOutlined /> Sync Essay Tasks
              </Button>
              <span className="complete-switch">
                <Checkbox checked={displayComplete} onChange={e => setDisplayComplete(e.target.checked)}>
                  Display Complete Tasks
                </Checkbox>
              </span>
              <Input.Search
                value={search}
                allowClear={true}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="search-input"
              />
              {includeAddTask && <CounselingAddTask studentID={studentID} />}
            </div>
          </div>
          <div className="subheader">
            <div className="title">Task</div>
            {!condensed && <div className="meeting">Meeting</div>}
            <div className="due">Due</div>
            <div className="complete">{isCounselorOrAdmin ? 'Actions' : 'Complete'}</div>
          </div>
        </>
      )}
      {tasks.length === 0 && !formsOnly && !loading && (
        <Empty description={`No tasks yet. ${isCounselor ? 'Add tasks with the + button.' : ''}`} />
      )}
      {loading && <Skeleton loading />}
      {!loading && <div className="task-list-rows">{filteredTasks.map(renderTask)}</div>}
    </div>
  )
}
export default CounselingStudentParentTaskList
