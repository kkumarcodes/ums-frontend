// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { fetchCounselorMeetingTemplates, fetchRoadmaps } from 'store/counseling/counselingThunks'
import { useSelector } from 'react-redux'
import { getRoadmaps, selectCounselorMeetingTemplate, selectCounselorMeetingTemplates } from 'store/counseling/counselingSelectors'
import { Table, Button, Input, message, Row } from 'antd'
import { renderHighlighter } from 'components/administrator/helpers'
import { useReduxDispatch } from 'store/store'
import { CounselorMeetingTemplate } from 'store/counseling/counselingTypes'
import { TableProps } from 'antd/lib/table'
import { createColumns, sortString } from '../utils'
import { CounselorMeetingTemplateExpandedRow } from './CounselorMeetingTemplateExpandedRow'
import { showModal } from 'store/display/displaySlice'
import { EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { MODALS } from 'store/display/displayTypes'

export const CounselorMeetingTemplateTable = () => {
  const dispatch = useReduxDispatch()
  const counselorMeetingTemplates = useSelector(selectCounselorMeetingTemplates)
  const roadmaps = useSelector(getRoadmaps)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([dispatch(fetchCounselorMeetingTemplates()), dispatch(fetchRoadmaps())]).finally(() =>
      setLoading(false),
    )
  }, [dispatch])

  const refreshCounselorMeetingTemplates = () => {
    setRefreshing(true)
    dispatch(fetchCounselorMeetingTemplates())
      .then(_ => message.success('Counselor Meeting Templates successfully refreshed'))
      .catch(_ => message.error('Could not refresh Counselor Meeting Templates...'))
      .finally(() => setRefreshing(false))
  }

  const renderExpandedRow = (record: CounselorMeetingTemplate) => {
    let meetingTemplateID = record.pk
    return <CounselorMeetingTemplateExpandedRow meetingTemplateID={meetingTemplateID} />
  }

  const tableProps: TableProps<CounselorMeetingTemplate> = {
    rowKey: 'slug',
    className: 'CounselorMeetingTemplateTable',
    loading: loading,
    expandRowByClick: true,
  }

  const renderTitle = (text: string) => {
    return renderHighlighter(text, search)
  }

  const renderRoadmap = (roadmapID: number) => {
    return roadmapID ? renderHighlighter(roadmaps[roadmapID]?.title, search) : ''
  }

  const renderActions = (text: string, record: CounselorMeetingTemplate) => (
    <Row>
      <Button
        className="editButton"
        size="small"
        onClick={e => {
          e.stopPropagation()
          dispatch(
            showModal({ modal: MODALS.CREATE_COUNSELOR_MEETING_TEMPLATE, props: { meetingTemplateID: record.pk } }),
          )
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
      sorter: (a: CounselorMeetingTemplate, b: CounselorMeetingTemplate) => sortString(a.title, b.title),
    },
    {
      title: 'Roadmap',
      dataIndex: 'roadmap',
      render: renderRoadmap,
      sorter: (a: CounselorMeetingTemplate, b: CounselorMeetingTemplate) =>
        sortString(a.roadmap ? roadmaps[a.roadmap]?.title : '', b.roadmap ? roadmaps[b.roadmap]?.title : ''),
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      sorter: (a: CounselorMeetingTemplate, b: CounselorMeetingTemplate) => a.grade - b.grade,
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      sorter: (a: CounselorMeetingTemplate, b: CounselorMeetingTemplate) => a.semester - b.semester,
    },
    {
      title: 'Create with Roadmap',
      dataIndex: 'create_when_applying_roadmap',
      render: (value: boolean) => <div className="boolean-phrase">{value ? 'Yes' : 'No'}</div>,
      sorter: (a, b) => a.create_when_applying_roadmap - b.create_when_applying_roadmap,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
    },
  ])

  const handleFilter = (counselorMeetingTemplates: CounselorMeetingTemplate[]) => {
    const trimmedText = search.trim().toLowerCase()
    return counselorMeetingTemplates.filter(counselorMeetingTemplate => {
      const roadmapID = counselorMeetingTemplate.roadmap
      return (
        counselorMeetingTemplate.title.toLowerCase().includes(trimmedText) ||
        roadmaps[roadmapID as keyof typeof Roadmaps]?.title?.toLowerCase()?.includes(trimmedText)
      )
    })
  }

  return (
    <div>
      <h2>Counselor Meeting Templates</h2>
      <div className="wisernet-toolbar">
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <Button type="primary" onClick={refreshCounselorMeetingTemplates} disabled={refreshing}>
          Refresh Meetings
        </Button>
        <Button
          className="buttonCreate"
          type="primary"
          onClick={() => dispatch(showModal({ props: {}, modal: MODALS.CREATE_COUNSELOR_MEETING_TEMPLATE }))}
        >
          <PlusCircleOutlined />
          Add Meeting
        </Button>
      </div>
      <Table
        {...tableProps}
        dataSource={handleFilter(counselorMeetingTemplates)}
        columns={columns}
        expandedRowRender={renderExpandedRow}
      />
    </div>
  )
}

export default CounselorMeetingTemplateTable
