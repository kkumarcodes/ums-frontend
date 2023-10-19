// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined, LinkOutlined } from '@ant-design/icons'
import { Button, Input, message, Skeleton, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/lib/table'
import DownloadCSVButton from 'components/common/DownloadCSVButton'
import { CSVDataTypes } from 'components/common/enums'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectTutoringPackages } from 'store/tutoring/tutoringSelectors'
import { fetchLocations, fetchTutoringPackages, updateTutoringPackage } from 'store/tutoring/tutoringThunks'
import { TutoringPackage } from 'store/tutoring/tutoringTypes'
import { sortString } from '../utils'
import styles from './styles/TutoringPackageList.scss'
import TutoringModalForm from './TutoringModalForm'

export const TutoringPackageList: React.FC = () => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const packages = useSelector(selectTutoringPackages)
  const locations = useSelector((state: RootState) => state.tutoring.locations)

  const packagesExist = Boolean(packages.length)
  const { Search } = Input
  const [searchText, setSearchText] = useState('')
  const [visible, setVisible] = useState(false)
  const [modalPackageData, setModalPackageData] = useState({})

  useEffect(() => {
    async function fetchData() {
      setLoading(!packagesExist)
      const promises: Promise<any>[] = [dispatch(fetchTutoringPackages({})), dispatch(fetchLocations())]

      Promise.all(promises)
        .catch(e => {
          message.error('Failed to fetch data :(')
        })
        .finally(() => {
          setLoading(false)
        })
    }
    fetchData()
  }, [dispatch, packagesExist])

  useEffect(() => {
    setSearchText('')
  }, [])

  /** Functions for rendering each of our special data fields */
  const renderLocations = (text: string, record: TutoringPackage) => {
    if (record.all_locations) {
      return <Tag color="green">All Locations</Tag>
    }

    const locationNames = record.locations.map(l => locations[l]?.name).join(', ')
    return (
      <Tooltip title={locationNames}>
        <span>
          {record.locations.length} location{record.locations.length !== 1 && <>s</>}
        </span>
      </Tooltip>
    )
  }

  const renderActive = (text: string, record: TutoringPackage) =>
    record.active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>

  const renderLink = (text: string, record: TutoringPackage) => {
    if (record.magento_purchase_link) {
      return (
        <a href={record.magento_purchase_link} target="_blank" rel="noreferrer">
          <LinkOutlined />
        </a>
      )
    }
    return ''
  }

  const showModal = (record: TutoringPackage) => {
    setModalPackageData({
      pk: record.pk,
      product_id: record.product_id,
      magento_purchase_link: record.magento_purchase_link,
      sku: record.sku,
      title: record.title,
    })

    setVisible(true)
  }

  const onCreate = updatedData => {
    dispatch(updateTutoringPackage(updatedData)).finally(res => setVisible(false))
  }

  const renderEdit = (text: string, record: TutoringPackage) => {
    return (
      <Button className="editButton" size="small" onClick={() => showModal(record)}>
        <EditOutlined />
      </Button>
    )
  }

  const filterPackages = () => {
    if (searchText === '') return packages
    return packages.filter(p => p.title.toLowerCase().includes(searchText.toLowerCase()))
  }

  const COLUMNS = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      sorter: (a: TutoringPackage, b: TutoringPackage) => sortString(a.sku, b.sku),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Product ID',
      dataIndex: 'product_id',
      sorter: (a: TutoringPackage, b: TutoringPackage) => sortString(a.product_id, b.product_id),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Title',
      dataIndex: 'title',
      sorter: (a: TutoringPackage, b: TutoringPackage) => sortString(a.title, b.title),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Individual Test Prep Hours',
      dataIndex: 'individual_test_prep_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => a.individual_test_prep_hours - b.individual_test_prep_hours,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Group Test Prep Hours',
      dataIndex: 'group_test_prep_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => a.group_test_prep_hours - b.group_test_prep_hours,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Individual Curriculum Hours',
      dataIndex: 'individual_curriculum_hours',
      sorter: (a: TutoringPackage, b: TutoringPackage) => a.individual_curriculum_hours - b.individual_curriculum_hours,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Locations',
      dataIndex: 'locations',
      render: renderLocations,
    },
    {
      title: 'Number of Students',
      dataIndex: 'number_of_students',
      sorter: (a: TutoringPackage, b: TutoringPackage) => a.number_of_students - b.number_of_students,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Active',
      dataIndex: 'active',
      render: renderActive,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (text: string) => `$${text}`,
      sorter: (a: TutoringPackage, b: TutoringPackage) => a.price - b.price,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Becomes Available',
      dataIndex: 'available',
      render: (text: string) => (text ? moment(text).format('MMM Do h:mma') : ''),
    },
    {
      title: 'Expires',
      dataIndex: 'expires',
      render: (text: string) => (text ? moment(text).format('MMM Do h:mma') : ''),
    },
    {
      title: 'Purchase Link',
      dataIndex: 'magento_purchase_link',
      render: renderLink,
    },
    {
      title: 'Edit',
      dataIndex: 'sku',
      render: renderEdit,
    },
  ]

  const tableProps: TableProps<TutoringPackage> = {
    showHeader: true,
    size: 'middle',
    pagination: { position: 'bottom' },
    rowKey: 'pk',
  }

  return (
    <section className="tutoringPackageList">
      <h1>Tutoring Packages</h1>
      <div className={styles.searchRow}>
        <span className={styles.search}>
          <Search
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search by package name"
            value={searchText}
            allowClear
          />
        </span>
        <span className={styles.button}>
          <DownloadCSVButton dataType={CSVDataTypes.TutoringPackage} />
        </span>
      </div>
      {loading && <Skeleton />}
      {!loading && (
        <>
          <Table<TutoringPackage>
            {...tableProps}
            className="packagesTable"
            dataSource={filterPackages()}
            columns={COLUMNS}
          />
          <TutoringModalForm
            title="Edit Package Details"
            packageData={modalPackageData}
            visible={visible}
            onCreate={onCreate}
            okText="Submit"
            onCancel={() => setVisible(false)}
          />
        </>
      )}
    </section>
  )
}

export default TutoringPackageList
