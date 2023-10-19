// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { fetchAllTaskTemplates } from 'store/task/tasksThunks'
import { fetchRoadmaps, fetchAgendaItemTemplates } from 'store/counseling/counselingThunks'
import { useSelector } from 'react-redux'
import { selectTaskTemplates } from 'store/task/tasksSelectors'
import { Table, Button, Input, Row } from 'antd'
import { renderHighlighter } from 'components/administrator/helpers'
import { useReduxDispatch } from 'store/store'
import { TaskTemplate } from 'store/task/tasksTypes'
import { TableProps } from 'antd/lib/table'
import { createColumns, sortString } from '../utils'
import { TaskTemplateExpandedRow } from './TaskTemplateExpandedRow'
import { showModal } from 'store/display/displaySlice'
import { EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { MODALS } from 'store/display/displayTypes'

export const CounselorMeetingTemplateTable = () => {
  const dispatch = useReduxDispatch()
  const taskTemplates = useSelector(selectTaskTemplates)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dispatch(fetchRoadmaps()),
      dispatch(fetchAgendaItemTemplates({})),
      dispatch(fetchAllTaskTemplates()),
    ]).finally(() => setLoading(false))
  }, [dispatch])

  const renderExpandedRow = (record: TaskTemplate) => {
    let taskTemplateID = record.pk
    return <TaskTemplateExpandedRow taskTemplateID={taskTemplateID} />
  }

  const tableProps: TableProps<TaskTemplate> = {
    rowKey: 'slug',
    className: 'CounselorMeetingTemplateTable',
    loading: loading,
    expandRowByClick: true,
  }

  const renderTitle = (text: string) => {
    return renderHighlighter(text, search)
  }

  const renderActions = (text: string, record: TaskTemplate) => (
    <Row>
      <Button
        className="editButton"
        size="small"
        onClick={e => {
          e.stopPropagation()
          dispatch(showModal({ modal: MODALS.TASK_TEMPLATE_MODAL, props: { taskTemplateID: record.pk } }))
        }}
      >
        <EditOutlined />
      </Button>
    </Row>
  )

  const columns = createColumns([
    {
      title: 'Title',
      dataIndex: 'title',
      render: renderTitle,
      sorter: (a: TaskTemplate, b: TaskTemplate) => sortString(a.title, b.title),
    },
    {
      title: '# of Roadmaps',
      dataIndex: 'roadmap_count',
      sorter: (a: TaskTemplate, b: TaskTemplate) => a.roadmap_count - b.roadmap_count,
    },
    {
      title: '# of Related Resources',
      dataIndex: 'resources',
      render: (value: Array<string>) => <div className="boolean-phrase">{value.length}</div>,
      sorter: (a: TaskTemplate, b: TaskTemplate) => a.resources.length - b.resources.length,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
    },
  ])

  const handleFilter = (taskTemplates: TaskTemplate[]) => {
    const trimmedText = search.trim().toLowerCase()
    return taskTemplates.filter(taskTemplate => {
      return taskTemplate.title.toLowerCase().includes(trimmedText) && taskTemplate.created_by === null
    })
  }

  /**Event handler for adding a TaskTemplate to an AgendaItemTemplate */
  const handleAddTaskTemplate = () => {
    dispatch(
      showModal({
        props: {},
        modal: MODALS.TASK_TEMPLATE_MODAL,
      }),
    )
  }

  return (
    <div>
      <h2>Task Templates</h2>
      <div className="wisernet-toolbar">
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <Button className="buttonCreate" type="primary" onClick={() => handleAddTaskTemplate()}>
          <PlusCircleOutlined />
          Add Task Template
        </Button>
      </div>
      <Table
        {...tableProps}
        dataSource={handleFilter(taskTemplates)}
        columns={columns}
        expandedRowRender={renderExpandedRow}
      />
    </div>
  )
}

export default CounselorMeetingTemplateTable
