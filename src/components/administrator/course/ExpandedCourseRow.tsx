// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined } from '@ant-design/icons'
import { Button, Form, message, Popconfirm, Select, Table, Row } from 'antd'
import { TableProps } from 'antd/lib/table'
import { getFullName } from 'components/administrator'
import styles from 'components/administrator/styles/ExpandedCourseRow.scss'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { enrollStudentInCourse, unenrollStudentInCourse } from 'store/tutoring/tutoringThunks'
import { getParents, selectStudents } from 'store/user/usersSelector'
import { Student } from 'store/user/usersTypes'
import { Store } from 'antd/lib/form/interface'
import { Course, GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import moment from 'moment'
import { selectCourse } from 'store/tutoring/tutoringSelectors'

type Props = {
  courseID: number
}

/**
 * Component renders a each course with a list of students enrolled. Admins have the ability to enroll/unenroll students to each class.
 */
const ExpandedCourseRow = ({ courseID }: Props) => {
  const dispatch = useReduxDispatch()
  const [form] = Form.useForm()
  const [addLoading, setAddLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const allStudents = useSelector(selectStudents)
  const parents = useSelector(getParents)
  const course = useSelector(selectCourse(courseID)) as Course
  const tutoringSessions = course.group_tutoring_sessions

  const onFinish = (values: Store) => {
    setAddLoading(true)
    Object.values(values.student).forEach((studentID: number) => {
      const res = dispatch(enrollStudentInCourse(studentID, courseID, false)).then(r => {
        setAddLoading(false)
        message.success('Student enrolled')
        form.resetFields()
      })
    })
  }

  const onFinishFailed = (errorInfo: any) => {
    message.error('Uh-oh. Something went wrong.')
    setAddLoading(false)
  }

  const unenrolledStudents = allStudents.filter(s => !course.students.includes(s.pk))

  const tableProps: TableProps<Student> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'studentEnrollmentTable',
    expandRowByClick: true,
    size: 'middle',
    bordered: true,
    pagination: false,
  }

  const confirmUnenroll = (studentID: number) => {
    dispatch(unenrollStudentInCourse(studentID, courseID)).then(res => {
      setRemoveLoading(false)
      message.success('Student unenrolled')
    })
  }

  const unEnroll = (_: string, student: Student) => {
    return (
      <Popconfirm
        title="Are you sure you want to unenroll this student?"
        onConfirm={e => {
          setRemoveLoading(true)
          confirmUnenroll(student.pk)
        }}
        onCancel={() => {}}
        okText="Unenroll"
        cancelText="No"
        disabled={removeLoading}
      >
        <Row justify="center">
          <Button size="small">
            <DeleteOutlined />
          </Button>
        </Row>
      </Popconfirm>
    )
  }

  const handleFilter = () => allStudents.filter(s => course.students.includes(s.pk))

  const parentName = (_: string, record: Student) => {
    const parentMatch = Object.values(parents).find(parent => parent.pk === record.parent)
    if (parentMatch) return getFullName(parentMatch)
    return ''
  }

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
    },
    {
      title: 'Parent',
      dataIndex: 'parent',
      render: parentName,
    },
    {
      title: 'Unenroll',
      dataIndex: 'unenroll',
      render: unEnroll,
    },
  ]

  const tutoringSessionTableProps: TableProps<GroupTutoringSession> = {
    rowKey: 'slug',
    showHeader: true,
    size: 'middle',
    bordered: true,
    pagination: false,
  }

  const sessionsColumns = [
    { title: 'Title', dataIndex: 'title' },
    {
      title: 'Date',
      dataIndex: 'start',
      render: (start: string) => moment(start).tz(moment.tz.guess()).format('MMMM Do YYYY, h:mma z'),
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) =>
        moment(a.start).valueOf() - moment(b.start).valueOf(),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
  ]

  const filterTutoringSessions = () => {
    return tutoringSessions.filter(s => !s.cancelled)
  }

  return (
    <div className={styles.expandedCourseRow}>
      <div className={styles.studentList}>
        <h3>Enrollment:</h3>
        <Form
          onFinish={onFinish}
          className={styles.addNewStudentForm}
          layout="inline"
          form={form}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item name="student">
            <Select
              className={styles.selectInput}
              mode="multiple"
              showSearch={true}
              optionFilterProp="children"
              placeholder="Add student"
            >
              {unenrolledStudents?.map((student: Student) => {
                return (
                  <Select.Option key={student.pk} value={student.pk}>
                    {getFullName(student)}
                  </Select.Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={addLoading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
        <div className={styles.tableWrapper}>
          <Table {...tableProps} dataSource={handleFilter()} columns={columns} />
        </div>
      </div>
      <div className={styles.sessionList}>
        <h3>Tutoring Sessions:</h3>
        <Table {...tutoringSessionTableProps} dataSource={filterTutoringSessions()} columns={sessionsColumns} />
      </div>
    </div>
  )
}

export default ExpandedCourseRow
