// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined, InfoCircleFilled, DeleteOutlined } from '@ant-design/icons'
import { Button, Row, Table, Tooltip, Popconfirm, message } from 'antd'
import { TableProps } from 'antd/lib/table'
import { renderHighlighter, useSearchCtx, getFullName, sortString } from 'components/administrator'
import moment from 'moment-timezone'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { sortBy } from 'lodash'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { getCourses } from 'store/tutoring/tutoringSelectors'
import { Course, GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import { fetchCourses, deleteCourse } from 'store/tutoring/tutoringThunks'
import { getTutors } from 'store/user/usersSelector'
import ExpandedCourseRow from './ExpandedCourseRow'

const CourseTable = () => {
  const { searchText } = useSearchCtx()
  const dispatch = useReduxDispatch()
  const courses: Course[] = sortBy(
    Object.values(useSelector(getCourses)).filter(c => c.group_tutoring_sessions.length > 0),
    (c: Course) => moment(c.first_session),
  )
  const tutorsByPK = useSelector(getTutors)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    dispatch(fetchCourses())
  }, [dispatch])

  const expandedRowRender = (course: Course) => {
    return <ExpandedCourseRow courseID={course.pk} locationID={course.location.pk} isRemote={course.is_remote} />
  }

  const tableProps: TableProps<Course> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'courseTable',
    expandedRowRender,
    expandRowByClick: true,
    size: 'middle',
  }

  const renderName = (text: string, record: Course) => {
    const description = record.description ? (
      <Tooltip title={record.description}>
        <InfoCircleFilled />
      </Tooltip>
    ) : (
      ''
    )
    return (
      <span>
        {renderHighlighter(text, searchText)}
        &nbsp;
        {description}
      </span>
    )
  }

  const renderTutor = (text: string, record: Course) => {
    let name: string
    if (record?.group_tutoring_sessions[0]) {
      name = getFullName(tutorsByPK[record?.group_tutoring_sessions[0]?.primary_tutor])
    } else {
      name = ''
    }
    return renderHighlighter(name, searchText)
  }

  // User opts to delete a course. Let's do it!
  const deleteAction = (pk: number) => {
    setDeleteLoading(true)
    dispatch(deleteCourse(pk))
      .then(() => {
        message.success('Course deleted')
      })
      .catch(() => message.error('Failed to delete course'))
      .finally(() => setDeleteLoading(false))
  }

  // Render buttons to edit and delete course
  const renderActions = (text: string, record: Course) => (
    <Row>
      <Button
        className="editButton"
        size="small"
        onClick={e => {
          e.stopPropagation()
          dispatch(showModal({ modal: MODALS.COURSE, props: { course: record } }))
        }}
      >
        <EditOutlined />
      </Button>
      <Popconfirm
        title="Are you sure you want to delete this course? Enrolled students and tutors will be notified."
        onConfirm={e => {
          deleteAction(record.pk)
        }}
        onCancel={() => {}}
        okText="DELETE course"
        cancelText="Nevermind"
        disabled={deleteLoading}
      >
        <Button size="small" loading={deleteLoading}>
          <DeleteOutlined />
        </Button>
      </Popconfirm>
    </Row>
  )

  const columns = [
    {
      title: 'Course Name',
      dataIndex: 'name',
      render: renderName,
    },
    {
      title: 'Starts',
      dataIndex: 'first_session',
      render: (start: string) => moment(start).tz(moment.tz.guess()).format('MMMM Do YYYY, h:mma z'),
      sorter: (a: Course, b: Course) => moment(a?.first_session).valueOf() - moment(b?.first_session).valueOf(),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Number of Sessions',
      dataIndex: 'group_tutoring_sessions',
      render: (gts: GroupTutoringSession[]) => gts.length,
    },
    { title: 'Category', dataIndex: 'category' },
    {
      title: 'Tutor',
      dataIndex: 'primary_tutor',
      render: renderTutor,
      sorter: (a: Course, b: Course) =>
        sortString(
          getFullName(tutorsByPK[a.group_tutoring_sessions[0]?.primary_tutor]),
          getFullName(tutorsByPK[b.group_tutoring_sessions[0]?.primary_tutor]),
        ),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Enrollments',
      dataIndex: 'students',
      render: (students: number[]) => students?.length,
      sorter: (a: Course, b: Course) => a.students?.length - b.students?.length,
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
    },
  ]

  const handleFilter = (courses: Course[]) => {
    let filteredCourses = [...courses]
    if (searchText) {
      const trimmedText = searchText.trim().toLowerCase()
      filteredCourses = filteredCourses.filter(course => {
        let tutorName: string
        if (course?.group_tutoring_sessions[0]) {
          tutorName = getFullName(tutorsByPK[course.group_tutoring_sessions[0]?.primary_tutor]).toLowerCase()
        } else {
          tutorName = ''
        }
        return course.name.toLowerCase().includes(trimmedText) || tutorName.includes(trimmedText)
      })
    }
    return filteredCourses
  }
  return <Table {...tableProps} dataSource={handleFilter(Object.values(courses))} columns={columns} />
}

export default CourseTable
