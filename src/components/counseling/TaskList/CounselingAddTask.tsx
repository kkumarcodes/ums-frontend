// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from 'react'
import { filter, sortBy, uniqBy, values } from 'lodash'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'
import { Button, Input, Popover, Tag, Tooltip } from 'antd'

import { BuildFilled, FilterOutlined, PlusOutlined, RedoOutlined } from '@ant-design/icons'
import { Task } from 'store/task/tasksTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { getFullName } from 'components/administrator'
import { selectTasksForStudent } from 'store/task/tasksSelectors'
import styles from './styles/CounselingAddTask.scss'

type Props = {
  studentID: number
}

const CounselingAddTask = ({ studentID }: Props) => {
  const [visible, setVisible] = useState(false)
  const [search, setSearch] = useState('')
  const dispatch = useReduxDispatch()
  const tasks = uniqBy(
    useSelector(selectTasksForStudent(studentID)).filter(t => !t.completed && !t.is_prompt_task),
    t => t.task_template ?? t.title,
  )
  // Repeatable tasks will appear more than once, but all have a unique task template. We filter accordingly

  const studentName = useSelector((state: RootState) => getFullName(state.user.students[studentID]))
  // Todo: Fallback to sorting on meeting order if no start
  const counselorMeetings = sortBy(
    useSelector((state: RootState) => filter(state.counseling.counselorMeetings, { student: studentID })),
    ['start', 'order'],
  )

  // We sort tasks by when their first associated meeting is
  const sortedTasks = sortBy(tasks, t => {
    const meetingIdx = counselorMeetings.findIndex(m => m.tasks.includes(t.pk))
    return meetingIdx > -1 ? meetingIdx : tasks.length
  })

  // const studentUserID: number = useSelector((state: RootState) => state.user.students[studentID]?.user_id)

  /**
   * Show task modal then hide this popover
   * If a taskID param is supplied, then counselor is going to get to edit that task to set a due date
   * Otherwise, they wll get blank counseling task modal from which they can create a new custom task
   * If task is repeatable, then we create a new task with the same template instead of editing the existing task
   */
  const onAddTask = (taskID?: number) => {
    const task = tasks.find(t => t.pk === taskID)
    setVisible(false)
    setSearch('')
    if (task && task.task_template && task.repeatable) {
      dispatch(
        showModal({ modal: MODALS.CREATE_COUNSELING_TASK, props: { studentID, taskTemplateID: task.task_template } }),
      )
    } else {
      dispatch(showModal({ modal: MODALS.CREATE_COUNSELING_TASK, props: { studentID, taskID } }))
    }
  }
  // Show apply roadmap modal then hide this popover
  const onApplyRoadmap = () => {
    setVisible(false)
    dispatch(showModal({ modal: MODALS.APPLY_ROADMAP, props: { studentID } }))
  }

  // Render a single task in our popover content. Task is clickable, which opens task modal for task
  const renderTask = (task: Task) => {
    const meeting = counselorMeetings.find(m => m.tasks.includes(task.pk))
    const meetingTitle = meeting?.title || task.counselor_meeting_template_name
    return (
      <div
        key={task.slug}
        onKeyPress={() => onAddTask(task.pk)}
        role="button"
        tabIndex={0}
        onClick={() => onAddTask(task.pk)}
        className="task flex"
      >
        {task.affects_tracker && (
          <Tooltip title="Affects Tracker">
            <BuildFilled className="repeatable" />
          </Tooltip>
        )}
        {!task.affects_tracker && task.repeatable && (
          <Tooltip title="Repeatable Task">
            <RedoOutlined className="repeatable" />
          </Tooltip>
        )}

        <div className="task-title">{task.title}</div>
        <div className="class-meeting">{meetingTitle && <Tag color="default">{meetingTitle}</Tag>}</div>
      </div>
    )
  }

  /** Render all content in our popover (when someone clicks + button). Includes button to create custom task,
   * search, and a list of existing tasks sorted by their related meeting date or order.
   */
  const filteredTasks =
    search.length > 2 ? sortedTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase())) : sortedTasks
  const popoverContent = (
    <div className={styles.popoverContent}>
      <div className="header flex">
        <div className="filter">
          <Input
            prefix={<FilterOutlined />}
            placeholder="Filter tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
          />
        </div>
        <Button type="default" size="small" onClick={onApplyRoadmap} className="apply-roadmap">
          Apply Roadmap
        </Button>
        <Button type="primary" size="small" onClick={() => onAddTask()}>
          Add Custom Task...
        </Button>
      </div>
      <div className="banner">Task Bank for {studentName}</div>
      <div className="tasks-list-container">
        {filteredTasks.map(renderTask)}
        {!tasks.length && <p className="help center">No tasks in task bank...</p>}
        {tasks.length && !filteredTasks.length ? <p className="help center">No tasks match search term...</p> : ''}
      </div>
    </div>
  )

  return (
    <div className={`${styles.counselingAddTask} counseling-add-task`}>
      <Popover content={popoverContent} visible={visible} trigger="click" onVisibleChange={setVisible}>
        <Button
          type="primary"
          shape="circle"
          className="popover-btn"
          icon={<PlusOutlined />}
          onClick={() => setVisible(!visible)}
        />
      </Popover>
    </div>
  )
}
export default CounselingAddTask
