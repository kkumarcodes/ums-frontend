// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Input, Table, Tabs } from 'antd'
import { orderBy } from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectCounselorsObject, selectStudents } from 'store/user/usersSelector'
import { Student, UserType } from 'store/user/usersTypes'
import { getFullName, sortString } from '../utils'
import { AddUserForm } from '../users/AddUserForm'
import CAPExpandedStudentRow from './CAPExpandedStudentRow'
import { CASExpandedStudentRow } from './CASExpandedStudentRow'

const StudentTable = ({ counselorID }: { counselorID?: number }) => {
  let students = orderBy(useSelector(selectStudents), 'pk', 'desc')
  if (counselorID) students = students.filter(s => s.counselor === counselorID)
  const counselors = useSelector(selectCounselorsObject)
  const [search, setSearch] = useState('')

  const renderStudentName = (_, s: Student) => (
    <>
      <Link className="light-blue" to={`/students/${s.pk}/`}>
        {getFullName(s)}
      </Link>
      <br />
      <span className="help">{s.email}</span>
    </>
  )
  const renderCounselorName = (_, s: Student) => (s.counselor ? getFullName(counselors[s.counselor]) : '')
  const renderExpandedRow = (s: Student) => {
    return (
      <Tabs tabPosition="left">
        <Tabs.TabPane tab="Tutoring" key="tutoring">
          <CASExpandedStudentRow userID={s.user_id} studentID={s.pk} />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Counseling" key="counseling">
          <CAPExpandedStudentRow studentID={s.pk} />
        </Tabs.TabPane>
      </Tabs>
    )
  }

  const columns = [
    {
      title: 'Student',
      dataIndex: 'first_name',
      render: renderStudentName,
      sorter: (a: Student, b: Student) => sortString(a.last_name, b.last_name),
    },
    {
      title: 'Year',
      dataIndex: 'graduation_year',
      className: 'right',
      sorter: (a: Student, b: Student) => a.graduation_year - b.graduation_year,
    },
    {
      title: 'Total Purchased Hours',
      dataIndex: 'purchased_hours',
      sorter: (a: Student, b: Student) => a.purchased_hours || 0 - (b.purchased_hours || 0),
    },
    {
      title: 'Counselor',
      dataIndex: 'counselor',
      render: renderCounselorName,
      sorter: (a: Student, b: Student) =>
        sortString(
          a.counselor ? counselors[a.counselor].last_name : '',
          b.counselor ? counselors[b.counselor].last_name : '',
        ),
    },
    {
      title: 'Counseling Package',
      className: 'center',
      dataIndex: 'counseling_student_types_list',
    },
    {
      title: 'High School',
      dataIndex: 'high_school',
      className: 'center',
      sorter: (a: Student, b: Student) => sortString(a.high_school, b.high_school),
    },
  ]

  const filteredStudents =
    search.length > 2
      ? students.filter(s => {
          if (s.counselor && getFullName(counselors[s.counselor]).toLowerCase().includes(search.toLowerCase()))
            return true
          return getFullName(s).toLowerCase().includes(search.toLowerCase())
        })
      : students

  return (
    <div>
      <div className="wisernet-toolbar">
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
        <AddUserForm userType={UserType.Student} />
      </div>
      <Table
        size="small"
        rowKey="slug"
        expandedRowRender={renderExpandedRow}
        columns={columns}
        dataSource={filteredStudents}
      />
    </div>
  )
}
export default StudentTable
