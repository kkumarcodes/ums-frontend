// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { RightOutlined } from '@ant-design/icons'
import { Button, Input, Select, Skeleton, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/lib/table'
import { CounselorPlatformPages } from 'apps/counseling/CounselorApp'
import { AddUserForm, getFullName, handleError, sortString } from 'components/administrator'
import useStickyState from 'hooks/useStickyState'
import { flatten, invert, keys, map, uniq } from 'lodash'
import moment from 'moment'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { selectCounselingStudents } from 'store/user/usersSelector'
import { updateStudent } from 'store/user/usersThunks'
import { CounselingStudentType, CounselingStudentTypeLabels, Student, UserType } from 'store/user/usersTypes'
import styles from './styles/CounselorStudentList.scss'

// State of filters used for table. Typed for our sticky state
type FilterState = {
  graduation_year: number[] | null
  counseling_student_types_list: CounselingStudentType[] | null
}

// Default date for sorting next meeting
const SORT_MEETING_DEFAULT_DATE = '2020-01-01'

const CounselorStudentList = () => {
  const dispatch = useReduxDispatch()
  const [search, setSearch] = useState('')
  const stickyFilteredState = useStickyState<FilterState>('counselor_student_list_filter', {
    graduation_year: null,
    counseling_student_types_list: null,
  })
  // Couldn't get TS to work nicely with this hook
  const filterState = stickyFilteredState[0] as FilterState
  const setFilterState = stickyFilteredState[1] as React.Dispatch<React.SetStateAction<FilterState>>

  const activeCounselor = useSelector((state: RootState) =>
    state.user.activeUser ? state.user.counselors[state.user.activeUser.cwUserID] : null,
  )
  const students: Student[] = useSelector(selectCounselingStudents)
  const filteredStudents = students.filter(s => {
    if (search.length < 2) {
      return true
    }
    return (
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
    )
  })
  const locationObject = useSelector(selectLocationsObject)
  const locationPool = flatten(
    Object.values(locationObject).map(location => {
      return { pk: location.pk, location: location.name }
    }),
  )

  /** Render school count with tooltip for student */
  const renderSchools = (count: number, student: Student) => {
    // If there are schools

    // If not, we display none
    const tooltipContent = count ? '' : 'No Schools on Final School List'

    return (
      <Tooltip title={tooltipContent}>
        <NavLink to={`/school-list/student/${student.pk}/`} className="table-link right">
          <Tag color="blue">{count}</Tag>
        </NavLink>
      </Tooltip>
    )
  }

  function handleChange(value: number, student: Student) {
    dispatch(updateStudent(student.pk, { location_id: value })).catch(err => handleError('Failed to update.'))
  }

  // Render both a dropdown to select student's location and their current high school
  const renderStudentLocation = (count: number, student: Student) => {
    return (
      <>
        <Select
          defaultValue={student?.location_id}
          style={{ width: 120 }}
          onChange={value => handleChange(value, student)}
          value={student?.location_id}
        >
          {locationPool.map(location => {
            return (
              <Select.Option value={location.pk} key={location.pk}>
                {location.location}
              </Select.Option>
            )
          })}
        </Select>
        {student.high_school && <p className="high-school">HS: {student.high_school}</p>}
      </>
    )
  }

  /** Render next deadline with list of universities below it */
  const renderNextCounselorMeeting = (nextDeadline: string) => {
    if (!nextDeadline) return ''
    return (
      <div className="next-meeting">
        <p>{moment(nextDeadline).format('MMM Do')}</p>
        <p className="help">{moment(nextDeadline).format('h:mma')}</p>
      </div>
    )
  }

  // Render method that displays some text as a Navlink to the student specific page (page type)
  // identified by pageSlug
  const renderLink = (text: string | number, pk: number, pageType: CounselorPlatformPages) => {
    if (pageType === CounselorPlatformPages.prompt) {
      return (
        <a href="/counseling/launch-essays/" target="_blank" rel="noreferrer">
          {text}
        </a>
      )
    }
    return <NavLink to={`/${pageType}/student/${pk}/`}>{text}</NavLink>
  }

  const renderCounselingStudentTypesList = (typesList: Array<CounselingStudentType>) => {
    return typesList
      .map(t => {
        if (t && invert(CounselingStudentType)[t]) return CounselingStudentTypeLabels[invert(CounselingStudentType)[t]]
        return t
      })
      .join(', ')
  }

  // OnChange for table to store sorting and filtering in sticky state
  const tableOnChange = (_, filters: FilterState) => {
    setFilterState(filters)
  }

  // We break out this filter because there is some complexity around filtering for paygo
  const filterStudentType = (studentType: CounselingStudentType, record: Student) => {
    if (studentType === CounselingStudentType.PAYGO) {
      return record.is_paygo || record.counseling_student_types_list.join(' ').toLowerCase().includes('paygo')
    }
    return record.counseling_student_types_list.includes(studentType)
  }

  const columns = [
    {
      title: 'Student',
      dataIndex: 'invitation_name',
      sorter: (a: Student, b: Student) => sortString(a.last_name, b.last_name),
      render: (_, student: Student) => renderLink(getFullName(student), student.pk, CounselorPlatformPages.profile),
    },
    {
      title: 'Colleges',
      dataIndex: 'school_count',
      render: renderSchools,
      sorter: (a: Student, b: Student) => (a.school_count ?? 0) - (b.school_count ?? 0),
    },
    {
      title: 'Package',
      dataIndex: 'counseling_student_types_list',
      render: (typesList: Array<CounselingStudentType>) => renderCounselingStudentTypesList(typesList),
      filters: keys(CounselingStudentType)
        .sort()
        .map(t => ({ text: t, value: t })),
      onFilter: filterStudentType,

      defaultFilteredValue: filterState.counseling_student_types_list || undefined,
    },
    {
      title: 'Location and HS',
      dataIndex: 'high_school',
      sorter: (a: Student, b: Student) => sortString(a.high_school, b.high_school),
      render: renderStudentLocation,
    },
    {
      title: 'Year',
      dataIndex: 'graduation_year',
      sorter: (a: Student, b: Student) => a.graduation_year - b.graduation_year,
      filters: uniq(map(students, 'graduation_year'))
        .sort()
        .map(y => ({ text: y, value: y })),
      onFilter: (year: number, record: Student) => record.graduation_year === year,
      defaultFilteredValue: filterState.graduation_year,
    },
    {
      title: 'Overdue Tasks',
      dataIndex: 'overdue_task_count',
      sorter: (a: Student, b: Student) => a.overdue_task_count - b.overdue_task_count,
      render: (count: number, student: Student) => renderLink(count, student.pk, CounselorPlatformPages.appPlan),
    },
    {
      title: 'Next Meeting',
      dataIndex: 'next_counselor_meeting',
      sorter: (a: Student, b: Student) =>
        moment(a.next_counselor_meeting ?? SORT_MEETING_DEFAULT_DATE).valueOf() -
        moment(b.next_counselor_meeting ?? SORT_MEETING_DEFAULT_DATE).valueOf(),
      render: renderNextCounselorMeeting,
    },
  ]
  const tableProps: TableProps<Student> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'students-table',
    size: 'middle',
    pagination: { position: ['bottomRight'], hideOnSinglePage: true, defaultPageSize: 20 },
  }

  if (!activeCounselor) {
    return <Skeleton />
  }
  return (
    <div className={`${styles.counselorStudentList} student-list`}>
      <div className="wisernet-toolbar">
        <h2 className="wisernet-toolbar-title">Students</h2>
        <div className="wisernet-toolbar-group">
          <div className="search-container">
            <Input.Search placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="wisernet-toolbar-group">
          <Button type="default" href="#/cas-students/">
            CAS Students <RightOutlined />
          </Button>
          <AddUserForm userType={UserType.Student} isCounselorApp={true} counselorID={activeCounselor.pk} />
        </div>
      </div>
      <Table onChange={tableOnChange} dataSource={filteredStudents} columns={columns} {...tableProps} />
    </div>
  )
}

export default CounselorStudentList
