// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { DeleteOutlined, EditOutlined, SolutionOutlined, UsergroupAddOutlined } from '@ant-design/icons'
import { Button, Modal, Popconfirm, Row, Table, Tag, Tooltip } from 'antd'
import { TableProps } from 'antd/lib/table'
import {
  createColumns,
  getFullName,
  handleError,
  handleSuccess,
  renderHighlighter,
  TagColors,
  useSearchCtx,
  sortString,
} from 'components/administrator'
import _, { compact, isEmpty } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { getLocations, selectGroupTutoringSessions, selectSessionTutors } from 'store/tutoring/tutoringSelectors'
import { fetchGroupTutoringSessions, updateGroupTutoringSession } from 'store/tutoring/tutoringThunks'
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import { fetchTutors } from 'store/user/usersThunks'
import styles from '../styles/GroupTutoringSessionTable.scss'

// Default props to control table render
const defaultTableProps: TableProps<GroupTutoringSession> = {
  rowKey: 'pk',
  showHeader: true,
  size: 'middle',
  pagination: { hideOnSinglePage: true },
}

type TableRecord = GroupTutoringSession
const dateFormat = 'YYYY-MM-DD'

/**
 * Renders a GroupTutoringSessionTable Container (Redux Connected Component)
 * Pulls from store:
 * @param searchText {string} searchText on submission
 * @param sessions {GroupTutoringSession[]} All (non-cancelled) GroupTutoringSessions
 * @param sessionTutors { {[pk]: Tutor} } All associated primary_tutor and support_tutors
 */
export const GroupTutoringSessionTable = ({ startDate, endDate }) => {
  const dispatch = useReduxDispatch()
  const locations = useSelector(getLocations)
  const sessions = useSelector(selectGroupTutoringSessions)
  const sessionTutors = useSelector(selectSessionTutors)

  const { searchText } = useSearchCtx()

  const [loading, setLoading] = useState(false)
  // Fetches GroupTutoringSessions, and Tutors
  useEffect(() => {
    const promises: Array<Promise<any>> = []
    if (startDate == null || endDate == null) {
      promises.push(
        dispatch(
          fetchGroupTutoringSessions({
            start_date: moment().format(dateFormat),
            end_date: moment().add(1, 'month').format(dateFormat),
          }),
        ),
      )
    } else {
      promises.push(
        dispatch(
          fetchGroupTutoringSessions({
            start_date: moment(startDate).format(dateFormat),
            end_date: moment(endDate).format(dateFormat),
          }),
        ),
      )
    }
    if (isEmpty(sessionTutors)) {
      promises.push(dispatch(fetchTutors()))
    }
    setLoading(true)
    Promise.all(promises)
      .catch(err => {
        handleError('Failed to fetch data')
      })
      .finally(() => setLoading(false))
  }, [dispatch, startDate, endDate])

  // Calls displaySlice modal
  const handleEdit = (record: GroupTutoringSession) => {
    dispatch(
      showModal({
        props: { sessionID: record.pk },
        modal: MODALS.GROUP_TUTORING_SESSION,
      }),
    )
  }

  const handleCancel = (record: GroupTutoringSession) => {
    dispatch(updateGroupTutoringSession(record.pk, { cancelled: true }))
      .then(() => handleSuccess('Session cancelled!'))
      .catch(err => handleError('Failed to cancel session.'))
  }

  const handleFilter = (data: GroupTutoringSession[]) => {
    const properSearch = searchText.trim().toLowerCase()

    return data.filter(datum => {
      // Filter out cancelled sessions, regardless of searchTerm
      if (datum.cancelled) {
        return false
      }

      // if date picker used, filter out courses outside of range.
      if (startDate != null && endDate != null) {
        if (!moment(datum.start).isBetween(startDate, endDate, 'day', [])) {
          return false
        }
      }
      // Filter based on searchTerm
      const title = datum.title.toLowerCase()
      const primary = datum.primary_tutor
      const support = datum.support_tutors
      const tutorIDs = compact([primary, ...support])
      const locationName = datum.location?.name?.toLowerCase()
      return (
        tutorIDs.some(tutorID => {
          const name = getFullName(sessionTutors[tutorID])?.toLowerCase()
          return name?.includes(properSearch)
        }) ||
        locationName?.includes(properSearch) ||
        title.includes(properSearch)
      )
    })
  }

  const renderTitle = (text: string) => renderHighlighter(text, searchText)
  const renderDate = (text: string, record: GroupTutoringSession) => {
    return <span>{moment(record.start).format('MM/DD/YY')}</span>
  }

  const renderTime = (text: string) => {
    return <span>{moment(text).format('h:mma')}</span>
  }

  const renderPrimary = (text: string, record: GroupTutoringSession) => {
    if (!record.primary_tutor) {
      return null
    }
    const tutor = sessionTutors[record.primary_tutor]
    const textToRender = getFullName(tutor)
    return renderHighlighter(textToRender, searchText)
  }

  const renderSupport = (text: string, record: GroupTutoringSession) => {
    return record.support_tutors?.map(tutor => {
      const tutorObj = sessionTutors[tutor]
      const textToRender = getFullName(tutorObj)
      return <div key={tutor}>{renderHighlighter(textToRender, searchText)}</div>
    })
  }

  const renderLocation = (text: string, record: GroupTutoringSession) => {
    if (!record.location) {
      return null
    }
    const textToRender = locations[record?.location]?.name
    return renderHighlighter(textToRender, searchText)
  }

  const renderResources = (text: string, record: GroupTutoringSession) => {
    return record.resources?.map(resource => (
      <a key={resource.pk} href={resource?.url} target="_blank" rel="noopener noreferrer">
        <Tag>{resource?.title}</Tag>
      </a>
    ))
  }

  // format list of students enrolled in group session
  const renderStudentList = (enrolledStudents: string[]) => {
    if (enrolledStudents && enrolledStudents.length === 0) {
      return <h2>No students enrolled</h2>
    }

    const uniqueList = _.uniq(Object.values(enrolledStudents))
    const list = _.sortBy(uniqueList).map(s => {
      return <li key={s}>{s}</li>
    })

    return <ul>{list}</ul>
  }

  const renderDisplayStudent = (enrolledStudents: string[], record: TableRecord) => {
    if (enrolledStudents.length > 0) {
      return (
        <>
          <span className={styles.leftMargin}>{enrolledStudents.length} enrolled</span>
          <Tooltip title="View Roster">
            <Button
              size="small"
              loading={loading}
              onClick={() =>
                Modal.info({
                  centered: true,
                  title: `Class Roster For ${record.title}`,
                  icon: <SolutionOutlined />,
                  content: renderStudentList(enrolledStudents),
                  maskClosable: true,
                })
              }
            >
              <UsergroupAddOutlined />
            </Button>
          </Tooltip>
        </>
      )
    } else return <span className={styles.leftMargin}>{enrolledStudents.length} enrolled</span>
  }

  const renderCancelled = (text: string, record: GroupTutoringSession) => {
    return (
      <Tag color={record.cancelled ? TagColors.volcano : TagColors.processing}>{record.cancelled ? 'Yes' : 'No'}</Tag>
    )
  }

  // If session has been cancelled, disable action buttons
  const renderActions = (text: string, record: GroupTutoringSession) => {
    return (
      <Row>
        <Button size="small" className="editButton" onClick={() => handleEdit(record)}>
          <EditOutlined />
        </Button>
        <Popconfirm title="Cancel session? This is an IRREVERSIBLE update!" onConfirm={() => handleCancel(record)}>
          <Button size="small">
            <DeleteOutlined />
          </Button>
        </Popconfirm>
      </Row>
    )
  }

  const sortTutorNames = (tutorA: number, tutorB: number) => {
    const nameA = sessionTutors[tutorA] ? sessionTutors[tutorA].first_name : ''
    const nameB = sessionTutors[tutorB] ? sessionTutors[tutorB].first_name : ''

    return sortString(nameA, nameB)
  }

  const groupSessionColumns = [
    ['Title', 'title', renderTitle],
    {
      title: 'Date',
      dataIndex: 'date',
      render: renderDate,
      defaultSortOrder: 'ascend',
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) =>
        moment(a.start).valueOf() - moment(b.start).valueOf(),
    },
    {
      title: 'Start',
      dataIndex: 'start',
      render: renderTime,
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) =>
        moment(a.start).valueOf() - moment(b.start).valueOf(),
    },
    {
      title: 'End',
      dataIndex: 'end',
      render: renderTime,
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) => moment(a.end).valueOf() - moment(b.end).valueOf(),
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
    },
    {
      title: 'Primary Tutor',
      dataIndex: 'primary_tutor',
      render: renderPrimary,
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) => sortTutorNames(a.primary_tutor, b.primary_tutor),
    },

    ['Support Tutors', 'support_tutors', renderSupport],
    ['Location', 'location', renderLocation],
    ['Resources', 'resources', renderResources],
    ['Cancelled', 'cancelled', renderCancelled],
    ['Actions', 'pk', renderActions],
    {
      title: 'Students',
      dataIndex: 'enrolled_students',
      render: renderDisplayStudent,
      sorter: (a: GroupTutoringSession, b: GroupTutoringSession) =>
        a.enrolled_students.length - b.enrolled_students.length,
    },
  ]

  const columns = createColumns(groupSessionColumns)

  return <Table {...defaultTableProps} dataSource={handleFilter(sessions)} columns={columns} loading={loading} />
}
