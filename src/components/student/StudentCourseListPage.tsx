// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined } from '@ant-design/icons'
import { Button, message, Popconfirm, Select, Table } from 'antd'
import Form from 'antd/lib/form'
import { Store } from 'antd/lib/form/interface'
import { TableProps } from 'antd/lib/table'
import styles from 'components/administrator/styles/ExpandedRow.scss'
import { createColumns } from 'components/administrator/utils'
import { useShallowSelector } from 'libs'
import { values, sortBy } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { enrollStudentInCourse, fetchCourses, unenrollStudentInCourse } from 'store/tutoring/tutoringThunks'
import { Course } from 'store/tutoring/tutoringTypes'
import moment from 'moment'

type props = {
  studentID: number
}

const StudentCourseListPage = ({ studentID }: props) => {
  const [form] = Form.useForm()
  const [addLoading, setAddLoading] = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const student = useShallowSelector((state: RootState) => state.user.students[studentID])
  const { unEnrolledCourseList, enrolledCourseList } = useSelector((state: RootState) => {
    const enrolled: Array<Course> = []
    const unenrolled: Array<Course> = []

    sortBy(values(state.tutoring.courses), c => moment(c.first_session).valueOf()).forEach(course => {
      if (student.courses.includes(course.pk)) {
        enrolled.push(course)
      } else {
        unenrolled.push(course)
      }
    })

    return { unEnrolledCourseList: unenrolled, enrolledCourseList: enrolled }
  })

  useEffect(() => {
    if (unEnrolledCourseList.length === 0) {
      dispatch(fetchCourses())
    }
  }, [dispatch, unEnrolledCourseList.length])

  /* Add one or more courses to a specific student */
  const onFinish = (values: Store) => {
    setAddLoading(true)

    Object.values(values.courseList).forEach(id => {
      const courseID = id
      const res = dispatch(enrollStudentInCourse(studentID, courseID, false)).then(() => {
        const name = student.first_name || 'Student'
        message.success(`${name} enrolled`)
        form.resetFields()
        setAddLoading(false)
      })
    })
  }

  const onFinishFailed = (errorInfo: any) => {
    setAddLoading(true)
    message.error('Uh-oh. Something went wrong.')
    setAddLoading(false)
  }

  /*remove single course from student and remove student from sinple course */
  const confirmUnenroll = (courseID: number) => {
    dispatch(unenrollStudentInCourse(studentID, courseID)).then(res => {
      setRemoveLoading(false)
      const name = student.first_name || 'Student'
      message.success(`${name} unenrolled`)
    })
  }

  const unEnroll = (course: Partial<Course>) => {
    return (
      <Popconfirm
        title={`Are you sure you want to unenroll ${student.first_name} from this course?`}
        onConfirm={e => {
          setRemoveLoading(true)
          confirmUnenroll(course.pk)
        }}
        onCancel={() => {}}
        okText="Unenroll"
        cancelText="No"
        disabled={removeLoading}
      >
        <DeleteOutlined />
      </Popconfirm>
    )
  }

  const tableProps: TableProps<Course> = {
    rowKey: 'slug',
    showHeader: true,
  }

  const startDate = (first_session: string) => {
    return moment(first_session).format('ddd. MMMM D, YYYY')
  }

  const tableValues = () => {
    return [
      { title: 'Course name', dataIndex: 'name' },
      { title: 'Start Date', dataIndex: 'first_session', render: startDate },
      { title: 'Description', dataIndex: 'description' },
      { title: 'Unenroll', render: unEnroll },
    ]
  }

  const columns = createColumns(tableValues())

  return (
    <>
      <Form onFinish={onFinish} layout="inline" form={form} onFinishFailed={onFinishFailed}>
        <Form.Item label="Enroll student in course" name="courseList">
          <Select
            mode="multiple"
            className={styles.wideSelect}
            showSearch={true}
            optionFilterProp="children"
            placeholder="Enroll student in additional courses"
          >
            {unEnrolledCourseList.map((course: Course) => {
              return (
                <Select.Option key={course.pk} value={course.pk}>
                  {course.name} starting{' '}
                  {course.first_session ? moment(course.first_session).format('MMMM Do h:mma z') : ''}
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
      <div className={styles.expandedRowWrapper}>
        <Table {...tableProps} dataSource={enrolledCourseList} columns={columns} />
      </div>
    </>
  )
}

export default StudentCourseListPage
