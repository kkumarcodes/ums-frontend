// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { DeleteOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Table } from 'antd'
import { getFullName, sortString } from 'components/administrator/utils'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchResources } from 'store/resource/resourcesThunks'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { updateStudent } from 'store/user/usersThunks'

type Props = {
  entity: 'resources' | 'resourceGroups'
  studentID: number
  allowRemove: boolean
}

const StudentResourcesTable = ({ studentID, entity, allowRemove = false }: Props) => {
  const [loading, setLoading] = useState(false)
  // Array of PKs of objects we're currently removing from student
  // (used for loading state)
  const [deleting, setDeleting] = useState<number[]>([])
  const dispatch = useReduxDispatch()

  const { student, resources } = useSelector((state: RootState) => {
    const student = state.user.students[studentID]
    const resources =
      entity === 'resources'
        ? student.visible_resources.map(r => state.resource.resources[r])
        : student.visible_resource_groups.map(r => state.resource.resourceGroups[r])
    return {
      student,
      resources: _.sortBy(
        resources.filter(r => r),
        'title',
      ),
    }
  }, shallowEqual)

  useEffect(() => {
    if (student.visible_resources.length !== resources.length) {
      setLoading(true)
      dispatch(fetchResources({ student: studentID })).finally(() => setLoading(false))
    }
  }, [dispatch, studentID]) // eslint-disable-line react-hooks/exhaustive-deps

  // We are removing resource or resource group from student. Show loading state and update student
  const confirmDelete = pk => {
    setDeleting([...deleting, pk])
    const newData = {
      [entity === 'resources' ? 'visible_resources' : 'visible_resource_groups']: resources
        .map(r => r.pk)
        .filter(r => r !== pk),
    }
    dispatch(updateStudent(studentID, newData)).finally(() => {
      setDeleting(deleting.filter(i => i !== pk))
    })
  }

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

  const renderRemoveAction = (_, r: Resource | ResourceGroup) => {
    const { pk } = r
    return (
      <div>
        <Popconfirm
          title={`Remove this ${entity === 'resources' ? 'resource' : 'resource group'} from ${getFullName(student)}?`}
          onConfirm={() => confirmDelete(pk)}
        >
          <Button size="small" shape="circle" loading={deleting.includes(pk)}>
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      </div>
    )
  }

  const renderLink = (_, r: Resource | ResourceGroup) => {
    if (r.link.includes('vimeo')) {
      return (
        <Button
          onClick={() => {
            launchVimeoResourceModal(r.pk)
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
      <Button target="_blank" href={r.url} type="link" size="small">
        Open Resource <LinkOutlined />
      </Button>
    )
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: (a: Resource, b: Resource) => sortString(a.title, b.title),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      sorter: (a: Resource, b: Resource) => sortString(a.description, b.description),
    },
    {
      title: 'Link',
      dataIndex: 'pk',
      render: renderLink,
    },
  ]
  if (allowRemove) {
    columns.push({
      title: 'Remove',
      dataIndex: 'pk',
      render: renderRemoveAction,
    })
  }
  return (
    <div>
      <Table columns={columns} dataSource={resources} />
    </div>
  )
}
export default StudentResourcesTable
