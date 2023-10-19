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

const ENDPOINT = '/tutoring/report/tutor/'

interface Record {
  first_name: string
  last_name: string
  email: string

  individual_student_count: number
  individual_curriculum_sessions: number
  individual_test_prep_sessions: number
  group_test_prep_sessions: number
  individual_curriculum_hours: number
  individual_test_prep_hours: number
  group_test_prep_hours: number
  tutoring_services: string
}

export const ReportTutor = () => {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Moment>(moment().subtract(1, 'month'))
  const [endDate, setEndDate] = useState<Moment>(moment())
  const [data, setData] = useState<Record[]>([])
  const [search, setSearch] = useState('')
  const dispatch = useReduxDispatch()

  const url = `${ENDPOINT}?start=${startDate.format('YYYY-MM-DD')}&end=${endDate.format('YYYY-MM-DD')}`

  const filteredData = data.filter(d => {
    if (
      search &&
      !(
        d.first_name.toLowerCase().includes(search.toLowerCase()) ||
        d.last_name.toLowerCase().includes(search.toLowerCase())
      )
    ) {
      return false
    }
    return true
  })
  const handleRangePicker = (dates: [Moment, Moment]) => {
    if (dates === null) {
      return
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
      .get(url)
      .then((response: AxiosResponse) => {
        setData(response.data)
      })
      .catch(() => {
        message.error('Failed to fetch data')
      })
      .finally(() => setLoading(false))
  }, [dispatch, url])

  const columns: ColumnProps<Record>[] = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      sorter: (a: Record, b: Record) => sortString(a.first_name, b.first_name),
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      sorter: (a: Record, b: Record) => sortString(a.last_name, b.last_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Students (individual sessions)',
      dataIndex: 'individual_student_count',
      sorter: (a: Record, b: Record) => a.individual_student_count - b.individual_student_count,
    },
    {
      title: 'Ind. Curr Sessions',
      dataIndex: 'individual_curriculum_sessions',
      sorter: (a: Record, b: Record) => a.individual_curriculum_sessions - b.individual_curriculum_sessions,
    },
    {
      title: 'Ind. Curr Hours',
      dataIndex: 'individual_curriculum_hours',
      sorter: (a: Record, b: Record) => a.individual_curriculum_hours - b.individual_curriculum_hours,
    },
    {
      title: 'Ind. Test Prep Sessions',
      dataIndex: 'individual_test_prep_sessions',
      sorter: (a: Record, b: Record) => a.individual_test_prep_sessions - b.individual_test_prep_sessions,
    },
    {
      title: 'Ind. Test Prep Hours',
      dataIndex: 'individual_test_prep_hours',
      sorter: (a: Record, b: Record) => a.individual_test_prep_hours - b.individual_test_prep_hours,
    },
    {
      title: 'Group Sessions',
      dataIndex: 'group_test_prep_sessions',
      sorter: (a: Record, b: Record) => a.group_test_prep_sessions - b.group_test_prep_sessions,
    },
    {
      title: 'Group Hours',
      dataIndex: 'group_test_prep_hours',
      sorter: (a: Record, b: Record) => a.group_test_prep_hours - b.group_test_prep_hours,
    },
    {
      title: 'Tutoring Services',
      dataIndex: 'tutoring_services',
    },
  ]

  return (
    <div className={styles.report}>
      <div className="toolbar">
        <div>
          <label>Filter Date:</label>
          <DatePicker.RangePicker
            className="range-picker"
            allowEmpty={[false, false]}
            value={[startDate, endDate]}
            onCalendarChange={handleRangePicker}
          />
        </div>
        <Button href={`${url}&format=csv`}>
          <DownCircleOutlined />
          Downloard Raw Data
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

export default ReportTutor
