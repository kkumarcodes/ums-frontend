// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Row, Table, Tag } from 'antd'
import { TableProps } from 'antd/lib/table'
import { createColumns, createResourceDataSource, handleError, handleSuccess } from 'components/administrator'
import styles from 'components/administrator/styles/Table.scss'
import React from 'react'
import { useSelector } from 'react-redux'
import { useRouteMatch } from 'react-router-dom'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { getResources } from 'store/resource/resourcesSelectors'
import { deleteResource, deleteResourceGroup } from 'store/resource/resourcesThunks'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { useReduxDispatch } from 'store/store'

type EntityType = Resource | ResourceGroup

// Default props to control table render
const defaultTableProps: TableProps<EntityType> = {
  className: styles.table,
  showHeader: true,
  rowKey: 'slug',
  size: 'small',
  bordered: true,
  pagination: { position: 'bottom', hideOnSinglePage: true },
}

type Props = {
  entityType: 'resources' | 'resourceGroups'
  payload: EntityType[]
}

// Determines if deleting Resource or ResourceGroup based on entityType
const deleteMap = {
  resources: (pk: number) => deleteResource(pk),
  resourceGroups: (pk: number) => deleteResourceGroup(pk),
}

export const ResourceTable = ({ entityType, payload }: Props) => {
  const { path } = useRouteMatch()
  const resources = getResources()
  const isResourceView = path.includes('resource')
  const isResource = entityType === 'resources'

  const dispatch = useReduxDispatch()

  const dataSource = createResourceDataSource(payload, entityType)

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

  const renderUrlLink = (record: EntityType) => {
    const resource = resources(record.key)
    if (resource?.link.includes('vimeo')) {
      return (
        <Button
          onClick={() => {
            launchVimeoResourceModal(resource.pk)
          }}
          type="link"
          size="small"
        >
          <LinkOutlined />
        </Button>
      )
    } else {
      return (
        <a href={resource?.url} target="_blank" rel="noopener noreferrer">
          <LinkOutlined />
        </a>
      )
    }
  }

  // Render Stock column as a Tag
  const renderStockTag = (text: string, record: EntityType & { is_stock: boolean }) => (
    <Tag color={record.is_stock ? 'green' : 'red'}>{record.is_stock ? 'Yes' : 'No'}</Tag>
  )

  const handleDelete = (record: EntityType & { key: number }) =>
    dispatch(deleteMap[entityType](record.key))
      .then(() => handleSuccess('Record deleted!'))
      .catch(err => handleError('Operation failed!'))

  const showEditResourceModal = (id: number) =>
    dispatch(showModal({ props: { type: entityType, id }, modal: MODALS.EDIT_RESOURCE }))

  // Render Action buttons
  const renderActions = (text: string, record: EntityType & { key: number }) => (
    <Row>
      <Button className="editButton" size="small" onClick={() => showEditResourceModal(record.key)}>
        <EditOutlined />
      </Button>
      <Popconfirm
        title={`Are you sure you want to delete this ${isResource ? 'resource?' : 'resource group?'}`}
        onConfirm={() => handleDelete(record)}
      >
        <Button size="small">
          <DeleteOutlined />
        </Button>
      </Popconfirm>
    </Row>
  )

  const commonColumns = ['title', 'description']
  const resourceColumns = [
    ...commonColumns,
    'resource group',
    { title: 'Resource Link', align: 'center', render: renderUrlLink },
    ['Is Stock?', 'is_stock', renderStockTag],
    'view count',
  ]
  const actionColumn = ['Actions', 'key', renderActions]

  // Only include actionColumn if /resources or /resource-groups view
  const seedArrayMap: any = {
    resourceGroups: isResourceView ? [...commonColumns, actionColumn] : commonColumns,
    resources: isResourceView ? [...resourceColumns, actionColumn] : resourceColumns,
  }

  const columns = createColumns(seedArrayMap[entityType])

  return <Table {...defaultTableProps} loading={false} dataSource={dataSource} columns={columns} />
}
