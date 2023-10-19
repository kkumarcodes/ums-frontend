// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import { useReduxDispatch } from 'store/store'

import { DatePicker, Skeleton, Input } from 'antd'
import Table, { ColumnProps } from 'antd/lib/table'
import { SearchOutlined, CheckCircleFilled } from '@ant-design/icons'
import { fetchStudentLastMeeting } from 'store/user/usersThunks'
import { Student } from 'store/user/usersTypes'
import { useSelector } from 'react-redux'
import { selectStudents } from 'store/user/usersSelector'
import styles from './styles/Report.scss'
import { sortString } from '../utils'

export const ReportLastSession = () => {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Moment>()
  const [endDate, setEndDate] = useState<Moment>()
  const [search, setSearch] = useState('')
  const dispatch = useReduxDispatch()

  let students = useSelector(selectStudents).filter(s => s.last_paid_meeting)
  if (search.length > 2) {
    students = students.filter(
      d =>
        d.first_name.toLowerCase().includes(search.toLowerCase()) ||
        d.last_name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()),
    )
  }
  if (startDate || endDate) {
    students = students.filter(s => {
      if (startDate && moment(s.last_paid_meeting).isBefore(startDate.set({ hour: 0, minute: 0, second: 0 }))) {
        return false
      }
      if (endDate && moment(s.last_paid_meeting).isAfter(endDate.add(1, 'd').set({ hour: 0, minute: 0, second: 0 }))) {
        return false
      }
      return true
    })
  }

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
    dispatch(fetchStudentLastMeeting()).then(() => setLoading(false))
  }, [dispatch])

  const renderPaygo = (isPaygo: boolean) => {
    return isPaygo ? <CheckCircleFilled /> : ''
  }

  const renderLastPaidMeeting = (mtg: string) => (mtg ? moment(mtg).format('MMM Do h:mma') : '')

  const columns: ColumnProps<Student>[] = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      sorter: (a: Student, b: Student) => sortString(a.first_name, b.first_name),
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      sorter: (a: Student, b: Student) => sortString(a.last_name, b.last_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
    },
    {
      title: 'Last Session',
      dataIndex: 'last_paid_meeting',
      render: renderLastPaidMeeting,
      sorter: (a: Student, b: Student) => moment(a.last_paid_meeting).valueOf() - moment(b.last_paid_meeting).valueOf(),
    },
    {
      title: 'Paygo',
      dataIndex: 'is_paygo',
      render: renderPaygo,
      sorter: (a: Student, b: Student) => Number(a.is_paygo) - Number(b.is_paygo),
    },
    {
      title: 'Ind. Test Prep',
      dataIndex: 'individual_test_prep_hours',
      sorter: (a: Student, b: Student) => a.individual_test_prep_hours - b.individual_test_prep_hours,
    },
    {
      title: 'Group Test Prep',
      dataIndex: 'group_test_prep_hours',
      sorter: (a: Student, b: Student) => a.group_test_prep_hours - b.group_test_prep_hours,
    },
    {
      title: 'Ind. Curr.',
      dataIndex: 'individual_curriculum_hours',
      sorter: (a: Student, b: Student) => a.individual_curriculum_hours - b.individual_curriculum_hours,
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
        <div className="search">
          <Input prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="table-container">
        {loading && <Skeleton />}
        {!loading && <Table dataSource={students} columns={columns} />}
      </div>
    </div>
  )
}

export default ReportLastSession
