// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Input, Skeleton, Table, Tooltip } from 'antd'
import { createColumns, renderHighlighter, sortString } from 'components/administrator'
import { find, isEmpty, map } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getRoadmaps } from 'store/counseling/counselingSelectors'
import { fetchRoadmaps } from 'store/counseling/counselingThunks'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTaskTemplates } from 'store/task/tasksSelectors'
import { deleteTaskTemplate, fetchTaskTemplates } from 'store/task/tasksThunks'
import { TaskTemplate } from 'store/task/tasksTypes'
import styles from './styles/CounselorTaskTemplatesPage.scss'

type Props = {
  counselorCWUserID: number
}

const CounselorTaskTemplatesPage = ({ counselorCWUserID }: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<number[]>([])

  // Need access to roadmaps for Roadmap column
  const roadmaps = useSelector(getRoadmaps)

  // Show all stock roadmap task templates and counselor custom task templates
  const taskTemplates = useSelector(selectTaskTemplates).filter(
    tt => tt.roadmap_key || tt.created_by === counselorCWUserID,
  )
  // PKs of task templates that override roadmap task templates
  const overrideTaskTemplates = new Set(
    map(
      taskTemplates.filter(tt => tt.created_by && tt.roadmap_key),
      'roadmap_key',
    ),
  )
  // The task templates to display. We don't display roadmap task templates that are overridden
  // We also filter out task templates for inactive roadmaps
  const displayTaskTemplates = taskTemplates.filter(tt => {
    const roadmap = tt.roadmap ? roadmaps[tt.roadmap] : undefined
    // Not a task overridden by custom roadmap, and not a task for an inactive roadmap
    return !(!tt.created_by && overrideTaskTemplates.has(tt.roadmap_key)) && (!roadmap || roadmap.active)
  })

  const noRoadmaps = isEmpty(roadmaps)
  const noTaskTemplates = isEmpty(taskTemplates)

  useEffect(() => {
    if (noTaskTemplates) {
      setLoading(true)
      dispatch(fetchTaskTemplates()).finally(() => setLoading(false))
    }
  }, [dispatch, noTaskTemplates])

  // Fetch roadmaps if empty
  useEffect(() => {
    if (noRoadmaps) {
      dispatch(fetchRoadmaps())
    }
  }, [dispatch, noRoadmaps])

  // Action event handlers
  const doDeleteTaskTemplate = async (pk: number) => {
    setDeleting([...deleting, pk])
    try {
      await dispatch(deleteTaskTemplate(pk))
    } finally {
      setDeleting(deleting.filter(d => d !== pk))
    }
  }
  const doEditTaskTemplate = async (taskTemplateID: number) => {
    dispatch(showModal({ modal: MODALS.TASK_TEMPLATE_MODAL, props: { taskTemplateID } }))
  }

  const renderActions = (_: string, tt: TaskTemplate) => {
    // Check if a custom task template has already been created for the current stock roadmap task template
    const hasExistingCustomRoadmapTaskTemplate = taskTemplates.some(
      _tt => _tt.pk !== tt.pk && tt.is_stock && tt.roadmap_key && _tt.roadmap_key === tt.roadmap_key,
    )
    return (
      <div className="actions">
        {hasExistingCustomRoadmapTaskTemplate && (
          <Tooltip title="Custom task template already exists.">
            <Button size="small" shape="circle" disabled={true} icon={<EditOutlined />} />
          </Tooltip>
        )}
        {!hasExistingCustomRoadmapTaskTemplate && (
          <Button
            size="small"
            shape="circle"
            onClick={() => doEditTaskTemplate(tt.pk)}
            loading={deleting.includes(tt.pk)}
            icon={<EditOutlined />}
          />
        )}
        {tt.is_stock && (
          <Tooltip title="Can not delete stock task template">
            <Button size="small" shape="circle" disabled={tt.is_stock} icon={<DeleteOutlined />} />
          </Tooltip>
        )}
        {!tt.is_stock && (
          <Button
            size="small"
            shape="circle"
            onClick={() => doDeleteTaskTemplate(tt.pk)}
            loading={deleting.includes(tt.pk)}
            icon={<DeleteOutlined />}
          />
        )}
      </div>
    )
  }
  const renderCreated = (created: string) => (created ? moment(created).format('MMM Do, YYYY') : '')

  const renderRoadmap = (_: string, record: TaskTemplate) => {
    // If task template is custom, we look for roadmap task template with same key to display roadmap type
    let roadmapName = ''
    if (!record.roadmap && record.roadmap_key) {
      const roadmapTaskTemplate = find(taskTemplates, t => t.roadmap && t.roadmap_key === record.roadmap_key)
      if (roadmapTaskTemplate?.roadmap) roadmapName = roadmaps[(roadmapTaskTemplate as TaskTemplate).roadmap]?.category
    }
    if (!roadmapName) roadmapName = record.roadmap ? roadmaps[record.roadmap]?.category : ''
    return roadmaps && renderHighlighter(roadmapName, search)
  }

  const renderType = (_: string, record: TaskTemplate) => {
    return record.created_by ? 'Custom' : 'Stock'
  }

  // createColumns is just setting sortDirections=[ascend, descend, ascend] behavior
  const columns = createColumns([
    {
      title: 'Title',
      dataIndex: 'title',
      width: 600,
      render: (text: string) => renderHighlighter(text, search),
      sorter: (a: TaskTemplate, b: TaskTemplate) => sortString(a?.title, b?.title),
    },
    {
      title: 'Roadmap Type',
      dataIndex: 'category',
      render: renderRoadmap,
      sorter: (a: TaskTemplate, b: TaskTemplate) =>
        sortString(a.roadmap ? roadmaps[a.roadmap]?.title : '', b.roadmap ? roadmaps[b.roadmap]?.title : ''),
    },
    {
      title: 'Type',
      dataIndex: 'created_by',
      width: 100,
      sorter: (a: TaskTemplate, b: TaskTemplate) => (a.created_by || b.created_by ? -1 : 1),
      render: renderType,
    },
    {
      title: 'Created',
      dataIndex: 'created',
      defaultSortOrder: 'descend',
      sorter: (a: TaskTemplate, b: TaskTemplate) => moment(a.created).valueOf() - moment(b.created).valueOf(),
      render: renderCreated,
    },
    {
      title: 'Actions',
      render: renderActions,
    },
  ])

  const filteredTemplates = displayTaskTemplates.filter(
    t =>
      t?.title.toLowerCase().includes(search.trim().toLowerCase()) ||
      roadmaps[t.roadmap as keyof typeof roadmaps]?.title.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <div className={styles.counselorTaskTemplatesPage}>
      <h3 className="f-title">Task Templates</h3>
      <p className="help">This page displays all of the task templates that you have created.</p>
      <div className="wisernet-toolbar">
        <Input.Search size="small" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="wisernet-toolbar-group">
          <Button
            type="primary"
            size="small"
            onClick={() => dispatch(showModal({ modal: MODALS.TASK_TEMPLATE_MODAL, props: {} }))}
          >
            Create Task Template&nbsp;
            <PlusCircleOutlined />
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => dispatch(showModal({ modal: MODALS.BULK_ASSIGN_TASK_MODAL, props: {} }))}
          >
            Bulk Assign Task&nbsp;
            <PlusCircleOutlined />
          </Button>
        </div>
      </div>
      {loading && <Skeleton loading />}
      {!loading && <Table rowKey="pk" columns={columns} dataSource={filteredTemplates} size="small" />}
    </div>
  )
}
export default CounselorTaskTemplatesPage
