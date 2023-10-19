// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import { useReduxDispatch } from 'store/store'

import { DatePicker, message, Skeleton, Input, Button } from 'antd'
import Table, { ColumnProps } from 'antd/lib/table'
import { AxiosResponse } from 'axios'
import api from 'store/api'
import { SearchOutlined, DownCircleOutlined } from '@ant-design/icons'
import styles from './styles/Report.scss'
import { sortString } from '../utils'

const ENDPOINT = '/tutoring/report/tutoring-package-purchase/'

interface Record {
  student: number
  student_name: string
  package_name: string
  product_id: string
  magento_order_id: string
  individual_curriculum_hours: number
  individual_test_prep_hours: number
  group_test_prep_hours: number
  created: string
  paygo_transaction_id: string
  reversed: string
  package_type: string
  location: string
}

export const ReportTutoringPackagePurchase = () => {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Moment | null>(moment().subtract(1, 'month'))
  const [endDate, setEndDate] = useState<Moment | null>(moment())
  const [data, setData] = useState<Record[]>([])
  const [search, setSearch] = useState('')
  const dispatch = useReduxDispatch()

  const filteredData = data.filter(d => {
    if (
      search &&
      !(
        d.package_name.toLowerCase().includes(search.toLowerCase()) ||
        d.student_name.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false
    }

    if (startDate && moment(d.created).isBefore(startDate)) {
      return false
    }
    if (endDate && moment(d.created).isAfter(endDate)) {
      return false
    }
    return true
  })
  const handleRangePicker = (dates: [Moment, Moment]) => {
    if (dates === null) {
      setStartDate(null)
      setEndDate(null)
    }
    if (dates?.length >= 1) {
      setStartDate(dates[0])
    }
    if (dates?.length >= 2) {
      setEndDate(dates[1])
    }
  }

  useEffect(() => {
    setLoading(true)
    api
      .get(ENDPOINT)
      .then((response: AxiosResponse) => {
        setData(response.data)
      })
      .catch(() => {
        message.error('Failed to fetch data')
      })
      .finally(() => setLoading(false))
  }, [dispatch])

  const columns: ColumnProps<Record>[] = [
    {
      title: 'Date',
      dataIndex: 'created',
      sorter: (a: Record, b: Record) => moment(a.created).valueOf() - moment(b.created).valueOf(),
      defaultSortOrder: 'descend',
      render: (date: string) => moment(date).format('MMMM Do h:mma'),
    },
    {
      title: 'Student',
      dataIndex: 'student_name',
    },
    {
      title: 'Package',
      dataIndex: 'package_name',
      sorter: (a: Record, b: Record) => sortString(a.package_name, b.package_name),
    },
    {
      title: 'Package Type',
      dataIndex: 'package_type',
      sorter: (a: Record, b: Record) => sortString(a.package_type, b.package_type),
    },
    {
      title: 'Ind. Curr',
      dataIndex: 'individual_curriculum_hours',
      sorter: (a: Record, b: Record) => a.individual_curriculum_hours - b.individual_curriculum_hours,
    },
    {
      title: 'Ind. Test Prep',
      dataIndex: 'individual_test_prep_hours',
      sorter: (a: Record, b: Record) => a.individual_test_prep_hours - b.individual_test_prep_hours,
    },
    {
      title: 'Group Test Prep',
      dataIndex: 'group_test_prep_hours',
      sorter: (a: Record, b: Record) => a.group_test_prep_hours - b.group_test_prep_hours,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      sorter: (a: Record, b: Record) => sortString(a.location, b.location),
    },
    {
      title: 'Magento ID',
      dataIndex: 'magento_order_id',
      filters: [{ text: 'Orders From Magento Only', value: 'magento' }],
      onFilter: (val: string, r: Record) => Boolean(r.magento_order_id) === Boolean(val),
      sorter: (a: Record, b: Record) => sortString(a.magento_order_id, b.magento_order_id),
    },
    {
      title: 'Paygo Trans. ID',
      dataIndex: 'paygo_transaction_id',
      filters: [{ text: 'Paygo Orders Only', value: 'paygo' }],
      onFilter: (val: string, r: Record) => Boolean(r.paygo_transaction_id) === Boolean(val),
      sorter: (a: Record, b: Record) => sortString(a.paygo_transaction_id, b.paygo_transaction_id),
    },
    {
      title: 'Reversed',
      dataIndex: 'reversed',
      filters: [{ text: 'Exclude Reversed', value: 'exclude_reversed' }],
      onFilter: (val: string, r: Record) => Boolean(r.reversed) === !val,
      sorter: (a: Record, b: Record) => moment(a.reversed).valueOf() - moment(b.reversed).valueOf(),
    },
  ]

  return (
    <div className={styles.report}>
      <div className="toolbar">
        <div>
          <label>Filter Date:</label>
          <DatePicker.RangePicker
            className="range-picker"
            allowEmpty={[true, true]}
            value={[startDate, endDate]}
            onCalendarChange={handleRangePicker}
            allowClear
          />
        </div>
        <Button href="/tutoring/report/tutoring-package-purchase/?format=csv">
          <DownCircleOutlined />
          Download Raw Data
        </Button>
        <div className="search">
          <Input prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-container">
        {loading && <Skeleton />}
        {!loading && <Table dataSource={filteredData} columns={columns} />}
      </div>
    </div>
  )
}

export default ReportTutoringPackagePurchase
