// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EllipsisOutlined, InfoCircleOutlined, ReadOutlined } from '@ant-design/icons'
import { Dropdown, Menu, message, Spin, Tooltip } from 'antd'
import { CalendarIcon } from 'components/common/CalendarIcon'
import _ from 'lodash'
import moment from 'moment'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { UploadFile } from 'store/common/commonTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { Resource } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { deleteTask } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'

interface OwnProps {
  task: Task
  tutorUser?: boolean | undefined
}

const TaskListItem = (props: OwnProps) => {
  const dispatch = useDispatch()
  const { resources } = useSelector((state: RootState) => {
    const resourcePKs = props.task.resources || []
    return {
      resources: _.filter(_.values(state.resource.resources), (r: Resource) => resourcePKs.includes(r.pk)),
    }
  })

  const startSubmit = () => {
    if (props.task.diagnostic && props.task.for_student) {
      dispatch(
        showModal({
          modal: MODALS.SUBMIT_DIAGNOSTIC_RESULT,
          props: {
            diagnosticID: props.task.diagnostic,
            studentID: props.task.for_student,
          },
        }),
      )
    } else if (props.task.diagnostic) {
      throw new Error('Attempting to submit diagnostic not for student')
    } else {
      dispatch(
        showModal({
          modal: MODALS.SUBMIT_TASK,
          props: { taskID: props.task.pk },
        }),
      )
    }
  }

  const archiveTask = () => {
    try {
      dispatch(deleteTask(props.task.pk))
      message.success('Task has been archived')
    } catch {
      message.error('Uh, oh, something went wrong')
    }
  }

  const editDueDate = () => {
    dispatch(
      showModal({
        modal: MODALS.EDIT_TASK_DUE_DATE,
        props: {
          currentDueDate: props.task.due,
          taskID: props.task.pk,
        },
      }),
    )
  }

  /** Opening Modal for Vimeo */
  const launchVimeoResourceModal = (pk: number) => {
    dispatch(
      showModal({
        modal: MODALS.VIMEO_RESOURCE_MODAL,
        props: {
          pk: pk,
        },
      }),
    )
  }

  const renderResources = () => {
    if (props.task.resources.length) {
      return (
        <div className="item-resources">
          &nbsp;&nbsp;
          <ReadOutlined />
          &nbsp;&nbsp;
          {(resources as Array<Resource>).map((r: Resource) => {
            if (r.link.includes('vimeo')) {
              return (
                <a
                  onClick={() => {
                    launchVimeoResourceModal(r.pk)
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="task-resource"
                >
                  {r.title}
                </a>
              )
            }
            return (
              <a key={r.pk} href={r.url} target="_blank" rel="noopener noreferrer" className="task-resource">
                {r.title}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              </a>
            )
          })}
        </div>
      )
    }
    return null
  }

  const menu = (
    <Menu>
      <Menu.Item>
        <a role="button" tabIndex={0} onClick={startSubmit} onKeyDown={startSubmit}>
          Submit
        </a>
      </Menu.Item>
      {props.tutorUser ? (
        <Menu.Item>
          <a role="button" tabIndex={0} onClick={archiveTask} onKeyDown={archiveTask}>
            Archive
          </a>
        </Menu.Item>
      ) : null}
      <Menu.Item>
        <a role="button" tabIndex={0} onClick={editDueDate} onKeyDown={editDueDate}>
          Edit Due Date
        </a>
      </Menu.Item>
    </Menu>
  )

  const renderAction = () => {
    if (props.task.loading) {
      return <Spin />
    }

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <EllipsisOutlined />
      </Dropdown>
    )
  }

  const renderDate = () => {
    if (props.task.completed) {
      return (
        <>
          <CalendarIcon date={moment(props.task.completed).toDate()} bgColor="#293a68" />
          <div className="item-date-inner completed">{moment(props.task.completed).format('ddd, MMM D')}</div>
        </>
      )
    }
    if (props.task.due) {
      return (
        <>
          <CalendarIcon date={moment(props.task.due).toDate()} bgColor="#293a68" />
          <div className="item-date-inner">{moment(props.task.due).format('ddd, MMM D')}</div>
        </>
      )
    }
    return (
      <div className="noDue center">
        No Due
        <div className="center">Date</div>
      </div>
    )
  }

  const toolTip = (content_submission: string) => {
    if (content_submission && props.tutorUser) {
      return (
        <>
          &nbsp;&nbsp;
          <Tooltip title={content_submission} placement="right">
            <InfoCircleOutlined />
          </Tooltip>
        </>
      )
    }
    return null
  }

  const renderTasks = (uploadFiles: Array<UploadFile>) => {
    if (!_.isEmpty(uploadFiles)) {
      return (
        <div className="item-resources">
          &nbsp;&nbsp;
          {uploadFiles.map((t, index: number) => (
            <a
              key={index}
              href={`/cw/upload/${t.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="task-resource"
            >
              Upload {index + 1}&nbsp;&nbsp;
            </a>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="task-session-list-item">
      <div className="item-title">
        <div className="item-date">{renderDate()}</div>
        <div className="item-title-text">{props.task.title}</div>
        <div className="item-title-bottom">
          {toolTip(props.task.content_submission)}
          {renderResources()}
          {renderTasks(props.task.file_uploads)}
        </div>
      </div>
      {!props.task.completed && <div className="item-actions">{renderAction()}</div>}
    </div>
  )
}

export default TaskListItem
