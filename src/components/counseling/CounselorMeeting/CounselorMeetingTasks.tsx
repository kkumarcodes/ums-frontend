// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { Button, DatePicker, Select } from 'antd'
import { AutocompleteCustomValue } from 'components/common/FormItems/AutocompleteCustomValue'
import { filter, find, keys, map, pickBy, values } from 'lodash'
import moment, { Moment } from 'moment'
import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { getTaskTemplates } from 'store/task/tasksSelectors'
import { IsApplying } from 'store/university/universityTypes'
import { CounselorMeetingTask, useCounselorMeetingCtx } from './counselorMeetingContext'
import styles from './styles/CounselorMeetingModal.scss'

const CounselorMeetingTasks = () => {
  const context = useCounselorMeetingCtx()
  const { meetingTasks, setMeetingTasks, addMeetingTask, getSUDsForTemplate } = context
  const taskTemplates = useSelector(getTaskTemplates)
  const SUDs = useSelector((state: RootState) =>
    filter(
      values(state.university.studentUniversityDecisions),
      sud => sud.student === context.student && sud.is_applying !== IsApplying.No,
    ),
  )

  const studentTasks = useSelector((state: RootState) =>
    pickBy(state.task.tasks, t => t.for_student === context.student),
  )

  // We are adding a new custom task to our list of tasks
  // Note that if task is repeatable, we actually create a NEW task for it instead of just updating the old task
  const onAddCustomTask = (value: string) => {
    setMeetingTasks([...meetingTasks, { newTask: value, due: context.start ? context.start.toISOString() : undefined }])
  }
  const onAddTask = (pk: number) => {
    const task = studentTasks[pk]
    if (task) {
      if (task.task_template && task.repeatable) {
        addMeetingTask({ taskTemplate: task.task_template, newTask: task.title })
      } else {
        addMeetingTask({ task: pk, taskTemplate: task.task_template })
      }
    }
  }

  // The due date for one of the tasks we're creating gets changed
  const onSetDue = (newDue: Moment | null, idx: number) => {
    setMeetingTasks(
      map(meetingTasks, (t, i) => {
        return i === idx ? { ...t, due: newDue ? newDue.toISOString() : undefined } : t
      }),
    )
  }
  // Update the StudentUniversityDecision(s) associated with a task
  const updateSUDs = (newValue: number[] | null, idx: number) => {
    setMeetingTasks(
      map(meetingTasks, (t, i) => {
        return i === idx ? { ...t, student_university_decisions: newValue || [] } : t
      }),
    )
  }

  // Update the SUDs associated with a meetingTask to be those that matching task template's include_school_sud_values
  const onPullSUDsFromTracker = (idx: number) => {
    const meetingTask = meetingTasks[idx]
    const task = meetingTask.task ? studentTasks[meetingTask.task] : null
    const taskTemplate = task?.task_template || meetingTask.taskTemplate
    setMeetingTasks(
      map(meetingTasks, (t, i) => {
        return i === idx ? { ...t, student_university_decisions: getSUDsForTemplate(taskTemplate) } : t
      }),
    )
  }

  // Render one of our tasks in the list, with datepicker to set due and button to remove task
  const renderMeetingTask = (meetingTask: CounselorMeetingTask, idx: number) => {
    const task = find(studentTasks, t => t.pk === meetingTask.task)
    const taskTemplate = task?.task_template ? taskTemplates[task.task_template] : null
    const displayPullFromTracker = taskTemplate && keys(taskTemplate.include_school_sud_values || {}).length
    return (
      <div className="meeting-task-row" key={idx}>
        <div className="close">
          <Button
            shape="circle"
            type="link"
            className="remove-item"
            icon={<CloseCircleOutlined />}
            onClick={() => setMeetingTasks(meetingTasks.filter((_, i) => i !== idx))}
          />
        </div>
        <div className="task-due">
          <DatePicker
            value={meetingTask.due ? moment(meetingTask.due) : null}
            allowClear={true}
            onChange={v => onSetDue(v, idx)}
            placeholder="due..."
            format="MM/DD"
            size="small"
          />
        </div>
        <div className="task-schools-container">
          <div className="tasks">{task?.title || meetingTask.newTask}</div>
          <div className="schools">
            <label>Colleges</label>
            <Select
              mode="tags"
              size="small"
              value={meetingTask.student_university_decisions}
              onChange={v => updateSUDs(v, idx)}
            >
              {SUDs.map(sud => (
                <Select.Option key={sud.slug} value={sud.pk}>
                  {sud.university_name}
                </Select.Option>
              ))}
            </Select>
            {displayPullFromTracker ? (
              <Button size="small" type="link" onClick={() => onPullSUDsFromTracker(idx)}>
                <SyncOutlined />
                Pull From Tracker
              </Button>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.counselorMeetingTasks}>
      <div className="section-header">
        <h2>Tasks</h2>
        <div className="instructions">
          Based on the agenda, below are the homework/prep tasks we’d suggest adding (you can add additional tasks at
          the bottom). Setting a due date will add the task to the student&apos;s task list when this meeting is saved.
        </div>
      </div>
      <div className="task-items-table">
        <div className="table-header">
          <div className="close" />
          <div className="task-due">
            <h4>Due Date</h4>
          </div>
          <div className="task">
            <h4>Task</h4>
          </div>
        </div>
        {meetingTasks.map(renderMeetingTask)}
      </div>
      <div className="meeting-task-row add-custom">
        <div className="close" />

        <div className="task">
          <AutocompleteCustomValue
            options={values(studentTasks).map(t => ({ label: t.title, value: t.pk }))}
            onSelect={v => onAddTask(Number(v))}
            onSelectCustomValue={onAddCustomTask}
          />
        </div>
      </div>
    </div>
  )
}

export default CounselorMeetingTasks
