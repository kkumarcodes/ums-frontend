// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Table } from 'antd'
import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { RootState } from 'store/rootReducer'
import { Resource } from '../../store/resource/resourcesTypes'

const DisplayResourceList = () => {
  const { id: resourceGroupID } = useParams()

  type resourceRow = {
    key: number
    description: string
    url: string
    title: string
  }

  const data = useSelector((state: RootState) => {
    const fullList = state.resource.resources
    const data: Array<resourceRow> = []

    Object.values(fullList).forEach(row => {
      if (row.resource_group === Number(resourceGroupID)) {
        data.push({
          key: row.pk,
          description: row.description,
          url: row.url,
          title: row.title,
        })
      }
    })

    return data
  }, shallowEqual)

  const columns = [
    {
      title: 'Resource',
      key: 'resource',
      render: function getResource(text) {
        return (
          <a href={text.url} target="_blank" rel="noopener noreferrer">
            {text.title}
          </a>
        )
      },
      defaultSortOrder: 'ascend',
      sorter: (a: Resource, b: Resource): number => (a.title < b.title ? -1 : 1),
    },
    {
      title: 'Description',
      key: 'description',
      render: function getDesc(text) {
        return (
          <a href={text.url} target="_blank" rel="noopener noreferrer">
            {text.description}
          </a>
        )
      },
      defaultSortOrder: 'ascend',
      sorter: (a: Resource, b: Resource): number => (a.description < b.description ? -1 : 1),
    },
  ]

  return <Table columns={columns} dataSource={data} />
}

export default DisplayResourceList
