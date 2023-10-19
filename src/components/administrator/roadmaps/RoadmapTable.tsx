// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import { fetchRoadmaps } from 'store/counseling/counselingThunks'
import { useSelector } from 'react-redux'
import { selectRoadmaps } from 'store/counseling/counselingSelectors'
import { Table, Button, Input, message, Row } from 'antd'
import { renderHighlighter } from 'components/administrator/helpers'
import { useReduxDispatch } from 'store/store'
import { Roadmap } from 'store/counseling/counselingTypes'
import { TableProps } from 'antd/lib/table'
import { sortString } from '../utils'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import styles from 'components/administrator/roadmaps/styles/Roadmap.scss'

export const RoadmapTable = () => {
  const dispatch = useReduxDispatch()
  const roadmaps = useSelector(selectRoadmaps)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  //grabbing roadmaps
  useEffect(() => {
    setLoading(true)
    dispatch(fetchRoadmaps()).finally(() => setLoading(false))
  }, [dispatch])

  //refresh roadmaps
  const refreshRoadmaps = () => {
    setRefreshing(true)
    dispatch(fetchRoadmaps())
      .then(_ => message.success('Roadmaps successfully refreshed'))
      .catch(_ => message.error('Could not refresh Roadmaps...'))
      .finally(() => setRefreshing(false))
  }

  const tableProps: TableProps<Roadmap> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'roadmapTable',
    loading: loading,
    expandRowByClick: true,
  }

  const renderMeetingsCount = (text: number, record: Roadmap) => {
    let count: number
    count = record?.counselor_meeting_templates.length
    return count
  }

  const renderTitle = (text: string, record: Roadmap) => {
    let name: string
    name = record?.title
    return <span>{renderHighlighter(name, search)}</span>
  }

  const renderDescription = (text: string, record: Roadmap) => {
    let description: string
    description = record?.description
    return <span>{renderHighlighter(description, search)}</span>
  }
  const renderActions = (text: string, record: Roadmap) => (
    <Row>
      <Button
        className="editButton"
        size="small"
        onClick={() => {
          dispatch(showModal({ modal: MODALS.CREATE_ROADMAP, props: { roadmapID: record?.pk } }))
        }}
      >
        <EditOutlined />
      </Button>
    </Row>
  )

  const columns = [
    {
      title: 'Title',
      dataIndex: 'name',
      render: renderTitle,
      sorter: (a: Roadmap, b: Roadmap) => sortString(a.title, b.title),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      render: renderDescription,
      sorter: (a: Roadmap, b: Roadmap) => sortString(a.description, b.description),
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: '# of Counselor Meetings',
      dataIndex: 'count',
      render: renderMeetingsCount,
      sorter: (a: Roadmap, b: Roadmap) => a.counselor_meeting_templates.length - b.counselor_meeting_templates.length,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Active',
      dataIndex: 'active',
      render: (value: boolean) => <div className="boolean-phrase">{value ? 'Yes' : 'No'}</div>,
      sorter: (a, b) => a.active - b.active,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Repeatable',
      dataIndex: 'repeatable',
      render: (value: boolean) => <div className="boolean-phrase">{value ? 'Yes' : 'No'}</div>,
      sorter: (a, b) => a.active - b.active,
      sortDirections: ['ascend', 'descend'],
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
    },
  ]

  //searches roadmap titles
  const handleFilter = (roadmaps: Roadmap[]) => {
    const trimmedText = search.trim().toLowerCase()
    return roadmaps.filter(
      roadmap =>
        roadmap.title.toLowerCase().includes(trimmedText) || roadmap.description.toLowerCase().includes(trimmedText),
    )
  }

  return (
    <div>
      <h2>Roadmaps</h2>
      <div className="wisernet-toolbar">
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <Button type="primary" className={styles.refresh} onClick={refreshRoadmaps} disabled={refreshing}>
          Refresh Roadmaps
        </Button>
        <Button
          className="buttonCreate"
          type="primary"
          onClick={() => dispatch(showModal({ props: {}, modal: MODALS.CREATE_ROADMAP }))}
        >
          <PlusCircleOutlined />
          Add Roadmap
        </Button>
      </div>
      <Table {...tableProps} dataSource={handleFilter(roadmaps)} columns={columns} />
    </div>
  )
}

export default RoadmapTable
