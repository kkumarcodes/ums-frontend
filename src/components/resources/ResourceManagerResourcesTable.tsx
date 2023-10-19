// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { DeleteOutlined, FilterOutlined, LinkOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Select } from 'antd'
import Table from 'antd/lib/table'
import { getFullName } from 'components/administrator'
import { map, orderBy } from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { selectResources } from 'store/resource/resourcesSelectors'
import { Resource } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'
import { selectIsStudentOrParent, selectStudent } from 'store/user/usersSelector'
import { updateStudent } from 'store/user/usersThunks'
import styles from './styles/ResourceManager.scss'

type Props = {
  studentID?: number
  counselorID?: number
  resourceGroupID?: number | null // If null, we'll display uncategorized resources
  resources: Resource[]
}

const ResourceManagerResourcesTable = ({ studentID, counselorID, resourceGroupID, resources }: Props) => {
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedResourceToAdd, setSelectedResourceToAdd] = useState<number>()
  const dispatch = useReduxDispatch()
  const isStudentOrParent = useSelector(selectIsStudentOrParent)
  const student = useSelector(selectStudent(studentID))

  // Resources and groups available to the user we're managing resources for
  const resourcePKs = new Set(map(resources, 'pk'))
  // All resources and groups available to the logged in user. Superset of userResources/Groups
  const allResources = useSelector(selectResources)

  const searchLower = search.toLowerCase()
  const filteredResources = orderBy(
    resources.filter(r => search.length < 3 || r.title.toLowerCase().includes(searchLower)),
    'title',
  )
  const resourcesToAdd = isStudentOrParent ? [] : allResources.filter(r => !resourcePKs.has(r.pk))

  // Remove resource from student
  const removeResource = async (pk: number) => {
    setRemoving(true)
    if (student)
      dispatch(updateStudent(student.pk, { visible_resources: student.visible_resources.filter(r => r !== pk) }))
    setRemoving(false)
  }

  /** Opening Modal for Vimeo */
  const launchVimeoResourceModal = (pk: number) => {
    dispatch(
      showModal({
        modal: MODALS.VIMEO_RESOURCE_MODAL,
        props: {
          pk,
        },
      }),
    )
  }

  const renderURL = (_: any, resource: Resource) => {
    if (resource.link.includes('vimeo')) {
      return (
        <Button
          onClick={() => {
            launchVimeoResourceModal(resource.pk)
          }}
          target="_blank"
          type="link"
          size="small"
        >
          Open Video <LinkOutlined />
        </Button>
      )
    }
    return (
      <Button target="_blank" href={resource.url} type="link" size="small">
        Open Resource <LinkOutlined />
      </Button>
    )
  }

  const renderActions = (_: any, resource: Resource) => {
    const confirmPrompt = `Are you sure you want to remove ${resource.title} from ${getFullName(
      student,
    )}'s available resources?`
    return (
      <div className="actions right">
        {studentID && resource.created_by && !resource.is_stock && (
          <Popconfirm onConfirm={() => removeResource(resource.pk)} title={confirmPrompt}>
            <Button loading={removing} type="default" size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        )}
      </div>
    )
  }

  const columns = [
    { key: 'title', dataIndex: 'title' },
    { key: 'link', dataIndex: 'pk', render: renderURL, width: 200 },
  ]

  if (!isStudentOrParent) {
    columns.push({ key: 'actions', dataIndex: 'pk', render: renderActions, width: 120 })
  }

  // We select a new resource to add to our student
  const addResource = async () => {
    setLoading(true)
    if (student && selectedResourceToAdd)
      await dispatch(
        updateStudent(student.pk, { visible_resources: [...student.visible_resources, selectedResourceToAdd] }),
      )
    setLoading(false)
  }

  // Show modal to create a new resource pre-filled with our student and the resource group
  const showCreateResource = () => {
    dispatch(
      showModal({
        modal: MODALS.RESOURCE_MODAL,
        props: { studentID, resourceGroupID: resourceGroupID || undefined },
      }),
    )
  }

  return (
    <div className={styles.resourceManagerResourcesTable}>
      <div className="header-toolbar">
        {!isStudentOrParent && studentID && (
          <>
            <div className="add-resource-form">
              <Select
                showSearch
                optionFilterProp="label"
                options={resourcesToAdd.map(r => ({ value: r.pk, label: r.title }))}
                placeholder="Search for a resource to add..."
                value={selectedResourceToAdd}
                onChange={setSelectedResourceToAdd}
                size="small"
              />
              <Button
                size="small"
                type="default"
                loading={loading}
                onClick={addResource}
                disabled={!selectedResourceToAdd}
              >
                Add
              </Button>
            </div>
          </>
        )}
        {!isStudentOrParent && (
          <Button type="primary" onClick={showCreateResource} size="small">
            <PlusCircleOutlined /> Create Resource
          </Button>
        )}
        <div className="search-container">
          <Input.Search
            prefix={<FilterOutlined />}
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="table-container">
        <Table
          rowKey="pk"
          columns={columns}
          size="small"
          dataSource={filteredResources}
          pagination={{ defaultPageSize: 20 }}
        />
      </div>
    </div>
  )
}
export default ResourceManagerResourcesTable
