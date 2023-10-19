// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { AgendaItemTemplate } from 'store/counseling/counselingTypes'
import { useReduxDispatch } from 'store/store'
import { getTaskTemplates } from 'store/task/tasksSelectors'
import { useSelector } from 'react-redux'
import { Button, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { updateAgendaItemTemplate } from 'store/counseling/counselingThunks'

/**Props needed to properly render the list of Task Templates for an AgendaItemTemplate
 * @taskID the task template PK.
 * @agendaItem the template that contains the task templates
 * @fieldValue determines whether the task is part of the PRE or POST meeting template array for the AgendaItemTemplate
 */

type Props = {
  taskID: number
  agendaItem: AgendaItemTemplate
  fieldValue: string
}

/**@hasForm is needed to disable editing on a TaskTemplate that has a form */
/** Component renders an accuarate and editable list of TaskTemplates for each AgendaItemTemplate on a
 * CounselorMeetingTemplate for the CounselorMeetingTemplate Table
 * */

export const RenderTaskList = ({ taskID, agendaItem, fieldValue }: Props) => {
  const dispatch = useReduxDispatch()
  const taskTemplates = useSelector(getTaskTemplates)
  const hasForm: boolean = taskTemplates[taskID]?.form !== null

  /**Handles Edit of the Task Template */
  const handleEditTaskTemplate = (taskID: number, agendaItem: AgendaItemTemplate) => {
    dispatch(
      showModal({
        props: { taskTemplateID: taskID, agendaItemTemplateID: agendaItem.pk },
        modal: MODALS.TASK_TEMPLATE_MODAL,
      }),
    )
  }

  /**Handles the removal of a Task, determines if its a PRE or POST task. */
  const handleRemoveTask = (agendaItem: AgendaItemTemplate, fieldValue: string, taskID: number) => {
    const field = fieldValue === 'pre' ? 'pre_meeting_task_templates' : 'post_meeting_task_templates'
    const meetingTaskArray = agendaItem[field] || []
    dispatch(
      updateAgendaItemTemplate(agendaItem.pk, {
        [field]: meetingTaskArray.filter(function (task: number) {
          return task !== taskID
        }),
      }),
    )
  }

  return (
    <ul className="task-unordered-list-container" key={taskID}>
      <li className="list-items-tasks">{taskTemplates[taskID]?.title}</li>
      <div className="icon-row">
        {hasForm ? (
          <Tooltip title="Task templates with a form cannot be edited" placement="topLeft">
            <Button
              className="slim-btn"
              type="link"
              icon={<EditOutlined className="edit-tasks-icon-dis" />}
              disabled={hasForm}
            />
          </Tooltip>
        ) : (
          <Button
            className="slim-btn-edit"
            type="link"
            icon={<EditOutlined id="edit-task" className="edit-tasks-icon" />}
            onClick={() => handleEditTaskTemplate(taskID, agendaItem)}
          />
        )}
        <Popconfirm
          title="Are you sure you want to remove this task?"
          onConfirm={() => {
            handleRemoveTask(agendaItem, fieldValue, taskID)
          }}
        >
          <MinusCircleOutlined className="remove-tasks-icon" />
        </Popconfirm>
      </div>
    </ul>
  )
}

export default RenderTaskList
