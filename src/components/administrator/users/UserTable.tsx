// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckCircleFilled, InfoCircleOutlined, LinkOutlined, LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { Button, message, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/es/table'
import {
  createColumns,
  ExpandedCounselorRow,
  ExpandedParentRow,
  CASExpandedStudentRow,
  ExpandedTutorRow,
  getFullName,
  renderHighlighter,
  sortString,
  TagColors,
  useSearchCtx,
} from 'components/administrator'
import { renderAddressDetails } from 'components/administrator/helpers'
import styles from 'components/administrator/styles/Table.scss'
import { sortBy } from 'lodash'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { getLocations } from 'store/tutoring/tutoringSelectors'
import { Location } from 'store/tutoring/tutoringTypes'
import { selectUsers } from 'store/user/usersSelector'
import { fetchStudents, sendTutorZoomInvite } from 'store/user/usersThunks'
import { Counselor, Student, Tutor, User, UserType } from 'store/user/usersTypes'

const renderStatus = (text: string, record: User) => (
  <Tag color={record.account_is_created ? TagColors.blue : TagColors.volcano}>
    {record.account_is_created ? 'Active' : 'Pending'}
  </Tag>
)

const renderLocation = (text: string, record: Counselor | Tutor) => {
  if (record?.location?.address) {
    return (
      <Tooltip title={() => renderAddressDetails(record.location as Location)}>
        <Tag color={TagColors.default}>{record.location.name}</Tag>
      </Tooltip>
    )
  }
  if (record?.location?.name) {
    return <Tag color={TagColors.default}>{record.location.name}</Tag>
  }
  return null
}

const renderRemote = (text: string, record: User) => {
  if ('can_tutor_remote' in record) {
    return (
      <Tag color={record.can_tutor_remote ? TagColors.geekblue : TagColors.red}>
        {record.can_tutor_remote ? 'Yes' : 'No'}
      </Tag>
    )
  }
  return null
}

/** Special little component that just renders a button to send a tutor a zoom invite */
const SendZoomInviteButton = ({ tutorPK }: { tutorPK: number }) => {
  const [sending, setSending] = useState(false)
  const dispatch = useReduxDispatch()
  const sendInvite = () => {
    setSending(true)
    dispatch(sendTutorZoomInvite(tutorPK))
      .catch(e => {
        message.error('Failed to send invite')
      })
      .finally(() => setSending(false))
  }
  return (
    <Button
      type="default"
      size="small"
      loading={sending}
      onClick={e => {
        e.preventDefault()
        sendInvite()
      }}
    >
      Send Zoom Invite
    </Button>
  )
}

// Render zoom link or button to send zoom link
const renderRemoteLink = (text: string, record: User) => {
  if (text) {
    return (
      <a href={text} target="_blank" rel="noopener noreferrer">
        <LinkOutlined />
        &nbsp;
        {text}
      </a>
    )
  }
  return <SendZoomInviteButton tutorPK={record.pk} />
}

type Props = {
  userType: UserType
  counselorID?: number
  tutorID?: number
  isExpanded?: boolean
}

/**
 * Renders an AntD Table of given userType
 * @param userType userType to pull from store (will be used as Table dataSource)
 * @param counselorID Used to determine ExpandedRow content if user is a Counselor
 * @param tutorID Used to determine ExpandedRow content if user is a Tutor
 * @param isExpanded Used to determine if this UserTable is within an ExpandedRow component (if so block filters and highlighter)
 */
export const UserTable = ({ userType, counselorID, tutorID, isExpanded = false }: Props) => {
  const dispatch = useReduxDispatch()
  const users = sortBy(useSelector(selectUsers(userType)), 'pk').reverse()
  const parents = useSelector((state: RootState) => state.user.parents)
  const students = useSelector((state: RootState) => state.user.students)
  const locations = useSelector(getLocations)
  const { searchText } = useSearchCtx()
  const [isFetching, setIsFetching] = useState(false)

  const expandedRowRender = (record: User) => {
    switch (userType) {
      case UserType.Counselor:
        return <ExpandedCounselorRow counselorID={record.pk} />
      case UserType.Parent:
        return <ExpandedParentRow parentID={record.pk} />
      case UserType.Student:
        return <CASExpandedStudentRow userID={record.user_id} studentID={record.pk} />
      case UserType.Tutor:
        return <ExpandedTutorRow tutorID={record.pk} />
      default:
        throw new Error('unknown user type')
    }
  }

  const tableProps: TableProps<User> = {
    rowKey: 'slug',
    showHeader: true,
    className: 'userTable',
    expandedRowRender,
    expandRowByClick: true,
    size: 'middle',
    pagination: { position: ['bottomRight'], hideOnSinglePage: true },
  }
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const paramStudent = params.get('student')
    ? Object.values(students).find(s => s.slug === params.get('student'))
    : null

  if (paramStudent && userType === UserType.Student) {
    tableProps.expandable = {
      defaultExpandedRowKeys: [paramStudent.slug],
    }
    // Need student to appear on first page
    users.sort((a, b) => (a.pk === paramStudent.pk ? -1 : 1))
  }

  const renderNameLink = (text: string, record: User) => (
    <Link className={styles.nameLink} to={`/user/platform/administrator/${userType}s/${record.pk}`}>
      {isExpanded ? getFullName(record) : renderHighlighter(getFullName(record), searchText)}
      {userType === UserType.Student && (record as Student).admin_note && (
        <Tooltip title={(record as Student).admin_note}>
          <span>
            &nbsp;&nbsp;
            <InfoCircleOutlined />
          </span>
        </Tooltip>
      )}
    </Link>
  )

  // Render name of parent in a link to edit the parent
  const renderParentNameLink = (parentPK: string) => {
    if (!parentPK || !parents[Number(parentPK)]) {
      return ''
    }
    return (
      <Link className={styles.nameLink} to={`/user/platform/administrator/parents/${parentPK}`}>
        {getFullName(parents[Number(parentPK)])}
      </Link>
    )
  }

  // Render name of each student in a link to edit the student
  const renderStudentNameLinks = (studentPKs: number[]) => {
    return studentPKs.map(s => (
      <Link key={s} className={styles.nameLink} to={`/user/platform/administrator/students/${s}`}>
        {getFullName(students[Number(s)])}
        <br />
      </Link>
    ))
  }

  const renderEmail = (text: string, record: User) => (
    <a className={styles.emailLink} href={`mailto:${record.email}`}>
      {isExpanded ? record.email : renderHighlighter(record.email, searchText)}
    </a>
  )

  const renderPaygo = (isPaygo: boolean) => {
    return isPaygo ? <CheckCircleFilled /> : ''
  }

  const renderStudentLocation = (text: string, record: Student) => {
    const locationID = record.location
    if (typeof locationID === 'number') {
      const location = locations[locationID]
      return (
        <Tooltip title={() => renderAddressDetails(location)}>
          <Tag color={TagColors.default}>{location.name}</Tag>
        </Tooltip>
      )
    }
    return null
  }
  const selectSeedArray = (userType: UserType) => {
    const commonColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        render: renderNameLink,
        sorter: (a: User, b: User) => sortString(a.last_name, b.last_name),
      },
      {
        title: 'Email',
        dataIndex: 'email',
        render: renderEmail,
        sorter: (a: User, b: User) => sortString(a.email, b.email),
      },
      {
        title: 'Status',
        dataIndex: 'account_is_created',
        align: 'center',
        render: renderStatus,
        sorter: (a: User, b: User) => (a.account_is_created ? -1 : 1),
      },
    ]

    switch (userType) {
      case UserType.Parent:
        return [
          ...commonColumns,
          {
            title: 'Students',
            dataIndex: 'students',
            render: renderStudentNameLinks,
          },
        ]
      case UserType.Student:
        return [
          ...commonColumns,
          {
            title: 'Parent',
            dataIndex: 'parent',
            render: renderParentNameLink,
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
          {
            title: 'High School',
            dataIndex: 'high_school',
            sorter: (a: Student, b: Student) => sortString(a.high_school, b.high_school),
          },
          {
            title: 'Location',
            dataIndex: 'location',
            render: renderStudentLocation,
            sorter: (a: Student, b: Student) =>
              // if either location is falsy place at end of line
              a.location && b.location
                ? sortString(locations[a.location as number].name, locations[b.location as number].name)
                : -1,
          },
        ]
      case UserType.Counselor:
        return [
          ...commonColumns,
          {
            title: 'Location',
            dataIndex: 'location',
            render: renderLocation,
            sorter: (a: Counselor, b: Counselor) =>
              // if either location is falsy place at end of line
              a.location && b.location ? sortString(a.location.name, b.location.name) : -1,
          },
        ]
      case UserType.Tutor:
        return [
          ...commonColumns,
          {
            title: 'University',
            dataIndex: 'university',
            // TODO: This sorter will break when cwuniversity viewSet is fleshed out
            sorter: (a: Tutor, b: Tutor) => (a.university && b.university ? a.university - b.university : -1),
          },
          { title: 'Degree', dataIndex: 'degree', sorter: (a: Tutor, b: Tutor) => sortString(a.degree, b.degree) },
          {
            title: 'Remote?',
            dataIndex: 'can_tutor_remote',
            render: renderRemote,
            sorter: (a: Tutor, b: Tutor) => (a.can_tutor_remote ? -1 : 1),
          },
          {
            title: 'Remote Link',
            dataIndex: 'zoom_url',
            align: 'center',
            render: renderRemoteLink,
            sorter: (a: Tutor, b: Tutor) => (a.remote_tutoring_link ? -1 : 1),
          },
          {
            title: 'Location',
            dataIndex: 'location',
            render: renderLocation,
            sorter: (a: Tutor, b: Tutor) =>
              // if either location is falsy place at end of line
              a.location && b.location ? sortString(a.location.name, b.location.name) : -1,
          },
          {
            title: 'Student Count',
            dataIndex: 'students',
            render: (text: string, record: Tutor) => record.students.length,
            sorter: (a: Tutor, b: Tutor) => a.students.length - b.students.length,
          },
        ]
      default:
        throw new Error('unknown user type')
    }
  }

  const handleFilter = (users: User[]) => {
    return users.filter(u => {
      if (userType === UserType.Student) {
        if (counselorID && (u as Student).counselor !== counselorID) return false
        if (tutorID && !(u as Student).tutors.includes(tutorID)) return false
        // This component only displays tutoring students. That is students with tutors OR no counselor
        // if (!(u as Student).tutors.length && (u as Student).counselor) return false
      }
      if (!isExpanded && searchText.length > 2) {
        const trimmedText = searchText.trim().toLowerCase()
        return getFullName(u).toLowerCase().includes(trimmedText) || u.email.toLowerCase().includes(trimmedText)
      }
      return true
    })
  }

  const refreshPage = () => {
    setIsFetching(true)
    dispatch(fetchStudents({ condensed: true }))
      .then(() => setIsFetching(false))
      .catch(err => {})
  }

  const columns = createColumns(selectSeedArray(userType))

  return (
    <>
      {userType === UserType.Student && (
        <div className="wisernet-toolbar">
          <Button type="primary" onClick={refreshPage} disabled={isFetching}>
            {isFetching ? <LoadingOutlined /> : <RedoOutlined />}
            Refresh Students
          </Button>
        </div>
      )}
      <Table {...tableProps} dataSource={handleFilter(users)} columns={columns} />
    </>
  )
}
