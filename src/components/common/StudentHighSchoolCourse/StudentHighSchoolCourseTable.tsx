// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Input, Popconfirm, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { handleSuccess } from 'components/administrator'
import { some } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import {
  selectCoursesForStudent,
  selectCWUserID,
  selectIsCounselorOrAdmin,
  selectIsParent,
  selectIsStudent,
  selectStudent,
} from 'store/user/usersSelector'
import { deleteHSCourse, fetchHSCourses } from 'store/user/usersThunks'
import { StudentHighSchoolCourse } from 'store/user/usersTypes'
import styles from './styles/StudentHighSchoolCourseTable.scss'

type Props = {
  studentID?: number
  year?: number
  coursePlanning?: boolean // Whether we are showing courses for course planning section
}

export const StudentHighSchoolCourseTable = ({ studentID, year, coursePlanning }: Props) => {
  const dispatch = useReduxDispatch()

  const isStudent = useSelector(selectIsStudent)
  const [search, setSearch] = useState('')
  const cwUserID = useSelector(selectCWUserID)
  const studentIDToUse = isStudent ? cwUserID : studentID
  const [loading, setLoading] = useState(false)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const isParent = useSelector(selectIsParent)

  // If year is 9th grade or 12th grade, we filter for all courses prior or after, respectively
  const student = useSelector(selectStudent(studentIDToUse))
  const filterYear = (courseYear: number) => {
    if (!student?.graduation_year || !year) return true
    if (year <= student.graduation_year - 4) return courseYear <= year
    if (year >= student.graduation_year - 1) return courseYear >= year
    return courseYear === year
  }
  let courses = useSelector(selectCoursesForStudent(studentIDToUse)).filter(
    c => filterYear(c.school_year) && c.planned_course === coursePlanning,
  )
  if (search.length > 2)
    courses = courses.filter(c => (c.name + c.course_level + c.subject).toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    if (studentIDToUse) {
      setLoading(true)
      dispatch(fetchHSCourses(studentIDToUse)).finally(() => setLoading(false))
    }
  }, [dispatch, studentIDToUse])

  const handleDelete = (pk: number) => {
    dispatch(deleteHSCourse(pk)).then(() => handleSuccess('Course deleted!'))
  }

  const renderActions = (text: string, record: StudentHighSchoolCourse) => {
    // Read only for parents
    if (isParent) return ''
    return (
      <div className="center">
        <Button
          className="buttonEdit"
          size="small"
          onClick={() =>
            dispatch(
              showModal({
                modal: MODALS.HIGH_SCHOOL_COURSE,
                props: { studentID: record.student, courseID: record.pk, year: record.school_year, coursePlanning },
              }),
            )
          }
        >
          <EditOutlined />
        </Button>
        <Popconfirm title="Are you sure you want to delete this course?" onConfirm={() => handleDelete(record.pk)}>
          <Button className="buttonDelete" size="small">
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      </div>
    )
  }

  const renderItems = (items: string[]) => (
    <div className="items">
      {items.map((grade, idx) => (
        <div className="item" key={idx}>
          <span className="help">{idx === items.length - 1 ? 'Final' : idx + 1}</span>
          <span>{grade}</span>
        </div>
      ))}
    </div>
  )

  const renderGradesAndCredits = (_, course: StudentHighSchoolCourse) => {
    return (
      <div className="grades-and-credits">
        {!coursePlanning && (
          <div className="grades">
            <label className="f-subtitle-2">Grades</label>
            {renderItems(course.grades)}
          </div>
        )}
        <div className="credits">
          <label className="f-subtitle-2">Credits</label>
          {renderItems(course.credits)}
        </div>
      </div>
    )
  }

  const renderCWEquivalent = (_, course: StudentHighSchoolCourse) => {
    return (
      <div className="cw-equivalent">
        {!some(course.cw_equivalent_grades) && <p className="help center">Edit to set CW Equivalent</p>}
        {some(course.cw_equivalent_grades) && (
          <>
            <div className="equiv-grades">
              <label className="f-subtitle-2">CW Equivalent</label>
              {renderItems(course.cw_equivalent_grades.map(String))}
            </div>
            <p className="center">
              {course.include_in_cw_gpa && (
                <>
                  <CheckOutlined />
                  &nbsp;Included in CW GPA
                </>
              )}
              {!course.include_in_cw_gpa && (
                <>
                  <CloseOutlined />
                  &nbsp;Not included in CW GPA
                </>
              )}
            </p>
          </>
        )}
      </div>
    )
  }

  const columns: ColumnProps<StudentHighSchoolCourse>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
    },
    {
      title: 'High School',
      dataIndex: 'high_school',
    },
    {
      title: 'Level',
      dataIndex: 'course_level',
    },
    {
      title: 'Grading Scale',
      dataIndex: 'grading_scale',
    },
    {
      title: 'Grades & Credits',
      dataIndex: 'grades',
      render: renderGradesAndCredits,
    },
    {
      title: 'Actions',
      dataIndex: 'pk',
      render: renderActions,
    },
  ]
  if (isCounselorOrAdmin && !coursePlanning) {
    columns.splice(-2, 0, {
      title: 'CW Equivalent',
      dataIndex: 'cw_equivalent',
      className: 'cw-equiv-col',
      render: renderCWEquivalent,
    })
  }

  return (
    <div className={styles.studentHighSchoolCourseTable}>
      <div className="wisernet-toolbar">
        {isCounselorOrAdmin && !coursePlanning && <label className="cw-gpa">CW GPA: {student?.cw_gpa ?? 'n/a'}</label>}
        <Input.Search value={search} onChange={e => setSearch(e.target.value)} />
        {!isParent && (
          <Button
            type="primary"
            onClick={() =>
              dispatch(showModal({ modal: MODALS.HIGH_SCHOOL_COURSE, props: { studentID, year, coursePlanning } }))
            }
          >
            <PlusCircleOutlined />
            Add Course
          </Button>
        )}
      </div>
      <Table
        rowKey="pk"
        size="middle"
        className={styles.tableStudentHighSchoolCourse}
        loading={loading}
        bordered={true}
        pagination={{ hideOnSinglePage: true }}
        dataSource={courses}
        columns={columns}
      />
    </div>
  )
}
