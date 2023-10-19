// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons'
import { Button, Row, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/es/table'
import { handleError, handleSuccess, sortString, TagColors } from 'components/administrator'
import styles from 'components/administrator/styles/Table.scss'
import { useShallowSelector } from 'libs'
import moment from 'moment'
import React from 'react'
import { getDiagnostics } from 'store/diagnostic/diagnosticSelectors'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { selectResources } from 'store/resource/resourcesSelectors'
import { Resource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { deleteTask } from 'store/task/tasksThunks'
import { Task } from 'store/task/tasksTypes'

interface AntTask extends Omit<Task, 'resources'> {
  diagnosticTitle: string | null
  resources: Resource[] | null
}

type TaskListProps = {
  tasks: Task[]
}

const defaultTableProps: TableProps<Partial<AntTask>> = {
  rowKey: 'pk',
  size: 'small',
  className: styles.table,
  bordered: true,
  pagination: { hideOnSinglePage: true },
}

export const TaskList = ({ tasks }: TaskListProps) => {
  const dispatch = useReduxDispatch()
  const resources = useShallowSelector(selectResources)
  const diagnostics = useShallowSelector(getDiagnostics)
  const dataSource = tasks
    .filter(task => !task.archived)
    .map(task => {
      const { diagnostic: diagnosticID } = task

      let diagnosticTitle: string | null = null
      if (diagnosticID) {
        diagnosticTitle = diagnostics[diagnosticID]?.title || null
      }

      return {
        ...task,
        diagnosticTitle,
        // Resources associated with this task
        resources: resources.filter(r => task.resources.includes(r.pk)),
      }
    })

  const handleDelete = (taskID: number) => {
    dispatch(deleteTask(taskID))
      .then(() => handleSuccess('Task deleted!'))
      .catch(() => handleError('Failed to delete task!'))
  }

  const renderDiagnostic = (text: string, record: AntTask) => {
    return text ? <Tag>{text}</Tag> : ''
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

  const renderResources = (text: string, record: AntTask) => {
    let resourceLink // creating in the outer scope to return value properly
    record.resources?.map(r => {
      if (r.link.includes('vimeo')) {
        resourceLink = (
          <Tag>
            <Button
              onClick={() => {
                launchVimeoResourceModal(r.pk)
              }}
              target="_blank"
              type="link"
              size="small"
            >
              {r.title}
            </Button>
          </Tag>
        )
      } else {
        resourceLink = (
          <Tag>
            <Button href={r.url} target="_blank" type="link" size="small">
              {r.title}
            </Button>
          </Tag>
        )
      }
    })
    return resourceLink
  }

  const fileUploadMap = (record: AntTask) => {
    return record.file_uploads.map((t, index: number) => (
      <a key={index} href={`/cw/upload/${t.slug}`} target="_blank" rel="noopener noreferrer" className="task-resource">
        Upload {index + 1}&nbsp;&nbsp;
      </a>
    ))
  }

  const renderUploads = (text: string, record: AntTask) => {
    if (record.content_submission) {
      return (
        <>
          <Tooltip title={record.content_submission}>
            <PaperClipOutlined />
          </Tooltip>
          {fileUploadMap(record)}
        </>
      )
    }
    return <>{fileUploadMap(record)}</>
  }

  const renderCompleted = (text: string, record: AntTask) => {
    if (!record.completed) {
      return <Tag color={TagColors.red}>No</Tag>
    }
    return <Tag color={TagColors.green}>{moment(text).format('MM/DD/YY')}</Tag>
  }

  const renderCreated = (text: string, record: AntTask) => <span>{moment(text).format('MM/DD/YY')}</span>

  const renderDue = (text: string, record: AntTask) => {
    const dueDate = moment(text).isValid() ? moment(text).format('MM/DD/YY') : 'None'
    return <span>{dueDate}</span>
  }

  const renderActions = (text: string, record: AntTask) => (
    <Row>
      <Button size="small" onClick={() => handleDelete(record.pk)}>
        <DeleteOutlined />
      </Button>
    </Row>
  )

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: (a: AntTask, b: AntTask) => sortString(a.title, b.title),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      sorter: (a: AntTask, b: AntTask) => sortString(a.description, b.description),
    },
    {
      title: 'Created',
      dataIndex: 'created',
      render: renderCreated,
      sorter: (a: AntTask, b: AntTask) => moment(a.created).valueOf() - moment(b.created).valueOf(),
    },
    {
      title: 'Due Date',
      dataIndex: 'due',
      render: renderDue,
      sorter: (a: AntTask, b: AntTask) => (a.due && b.due ? moment(a.due).valueOf() - moment(b.due).valueOf() : -1),
    },
    {
      title: 'Completed?',
      dataIndex: 'completed',
      render: renderCompleted,
      sorter: (a: AntTask, b: AntTask) =>
        a.completed && b.completed ? moment(a.completed).valueOf() - moment(b.completed).valueOf() : -1,
    },
    {
      title: 'Diagnostic',
      dataIndex: 'diagnosticTitle',
      render: renderDiagnostic,
    },
    {
      title: 'Resources',
      dataIndex: 'resources',
      render: renderResources,
    },
    {
      title: 'Submission',
      dataIndex: 'file_uploads',
      render: renderUploads,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
    },
  ]

  return <Table {...defaultTableProps} dataSource={dataSource} columns={columns} />
}
