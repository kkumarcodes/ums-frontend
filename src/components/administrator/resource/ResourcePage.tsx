// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { PlusCircleOutlined } from '@ant-design/icons'
import { Button, Input, message, Radio, Row } from 'antd'
import { ResourceTable } from 'components/administrator'
import styles from 'components/administrator/styles/ResourcePage.scss'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { useShallowSelector } from 'libs/useShallowSelector'
import { isBoolean, startCase } from 'lodash'
import React, { ChangeEvent, useState } from 'react'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { Resource, ResourceGroup } from 'store/resource/resourcesTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { CSVDataTypes } from 'components/common/enums'

type EntityType = Resource | ResourceGroup

type Props = {
  entityType: 'resources' | 'resourceGroups'
}

const { Search } = Input
const titleMap = {
  resources: 'Resource',
  resourceGroups: 'Resource Group',
}

export const ResourcePage = ({ entityType }: Props) => {
  message.config({ top: 100 }) // controls height of feeback message

  const isResource = entityType === 'resources'
  const headerTitle = `Add ${titleMap[entityType]}`

  const csvDataType = isResource ? CSVDataTypes.Resource : CSVDataTypes.ResourceGroup

  const dispatch = useReduxDispatch()
  const entities = useShallowSelector((state: RootState): EntityType[] => Object.values(state.resource[entityType]))

  const [searchFilter, setSearchFilter] = useState('')
  const [stockFilter, setStockFilter] = useState<boolean | null>(null)

  const showCreateResourceModal = () =>
    dispatch(showModal({ props: { type: entityType }, modal: MODALS.CREATE_RESOURCE }))

  const filterEntities = (searchTerm: string) => {
    const trimmedSearch = searchTerm.trim().toLowerCase()
    let filteredEntities = entities
    if (isBoolean(stockFilter)) {
      filteredEntities = (entities as Resource[]).filter(entity => entity.is_stock === stockFilter)
    }
    return (filteredEntities as Resource[]).filter(entity => {
      return (
        entity.title.toLowerCase().includes(trimmedSearch) ||
        entity.description.toLowerCase().includes(trimmedSearch) ||
        entity.resource_group_title?.toLowerCase().includes(trimmedSearch)
      )
    })
  }

  // When search input is empty, reset searchFilter
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.trim() === '') setSearchFilter('')
  }

  const renderFilterControls = () => {
    if (isResource) {
      return (
        <Row className="filterControls">
          <div className="searchWrapper">
            <label className="filterLabel" htmlFor="searchResource">
              Search:
            </label>
            <Search
              id="searchResource"
              placeholder="input search text"
              onSearch={value => setSearchFilter(value)}
              onChange={handleChange}
              enterButton
              allowClear
            />
          </div>
          <div className="filterWrapper">
            <label className="filterLabel">Filters:</label>
            <Radio.Group onChange={e => setStockFilter(e.target.value)} value={stockFilter}>
              <Radio value={true}>Stock</Radio>
              <Radio value={false}>Not Stock</Radio>
            </Radio.Group>
          </div>
          {isBoolean(stockFilter) && (
            <div className="wrapperResetButton">
              <Button className="resetFilterButton" type="danger" size="small" onClick={() => setStockFilter(null)}>
                Reset
              </Button>
            </div>
          )}
          <div className="flex buttonsContainer">
            <DownloadCSVButton dataType={csvDataType} />
            <Button className="createButton" type="primary" onClick={showCreateResourceModal}>
              <PlusCircleOutlined />
              {headerTitle}
            </Button>
          </div>
        </Row>
      )
    }
    return null
  }

  const renderTable = () => {
    if (isResource) {
      return <ResourceTable entityType={entityType} payload={filterEntities(searchFilter)} />
    }
    return <ResourceTable entityType={entityType} payload={entities} />
  }

  return (
    <section className={styles.pageContainer}>
      <h1>{startCase(entityType)}</h1>
      {renderFilterControls()}
      {renderTable()}
    </section>
  )
}

export default ResourcePage
