// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CheckCircleTwoTone, CheckOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, LoadingOutlined, RedoOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Row, Table, Tag, Tooltip } from 'antd'
import { ColumnProps, TableProps } from 'antd/es/table'
import { getFullName, handleSuccess, renderHighlighter, TagColors } from 'components/administrator'
import styles from 'components/tutoring/styles/TimeCard.scss'
import { useTimeCardCtx } from 'components/tutoring/TimeCard/context'
import { useShallowSelector } from 'libs'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectTimeCards } from 'store/tutoring/tutoringSelectors'
import { deleteTimeCard, fetchTimeCards } from 'store/tutoring/tutoringThunks'
import { TutorTimeCard } from 'store/tutoring/tutoringTypes'
import { getTutors, selectIsAdmin, selectIsTutor } from 'store/user/usersSelector'

const dateShortFormat = 'MMM Do'
const dateFormat = 'YYYY-MM-DD'

const defaultTableProps: TableProps<TutorTimeCard> = {
  rowKey: 'slug',
  showHeader: true,
  bordered: true,
  pagination: { hideOnSinglePage: true },
}

/**
 * Pulls from context:
 * @param search search text
 * @param selectedStart start filter
 * @param selectedEnd end filter
 * @param tutorID tutor filter [used in tutor app]
 * Component renders a table of time cards.
 */
export const TimeCardTable = () => {
  const { tutorID, adminID, search, selectedStart, selectedEnd } = useTimeCardCtx()
  const dispatch = useReduxDispatch()

  const tutors = useShallowSelector(getTutors)
  const timeCards = useSelector(selectTimeCards)
  const isTutor = useSelector(selectIsTutor)
  const isAdmin = useSelector(selectIsAdmin)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    dispatch(
      fetchTimeCards({
        start: moment(selectedStart).subtract(2, 'd').format(dateFormat),
        end: moment(selectedEnd).add(2, 'd').format(dateFormat),
        tutor: tutorID,
      }),
    ).finally(() => setLoading(false))

    return () => {}
  }, [dispatch, selectedEnd, selectedStart, tutorID])

  const handleDelete = (pk: number) => {
    dispatch(deleteTimeCard(pk)).then(() => handleSuccess('Time card deleted'))
  }

  const renderTime = (text: string) => {
    return <span>{moment(text).format(dateShortFormat)}</span>
  }

  const renderTutor = (text: string, record: TutorTimeCard) => {
    const name = getFullName(tutors[record.tutor])

    return renderHighlighter(name, search)
  }

  const renderTutorApproval = (text: string, record: TutorTimeCard) =>
    text ? (
      <div>
        <Tag color={TagColors.geekblue}>{moment(text).format(dateFormat)}</Tag>
      </div>
    ) : (
      <Tag color={TagColors.processing}>Pending</Tag>
    )

  const renderNote = (text: string) =>
    text && (
      <Tooltip title={text}>
        <div className="wrapperTutorNote">
          <FileTextOutlined />
        </div>
      </Tooltip>
    )

  const renderAdminApproval = (text: string, record: TutorTimeCard) =>
    record.admin_approval_time ? (
      <Tag color={TagColors.geekblue}>{moment(record.admin_approval_time).format(dateFormat)}</Tag>
    ) : (
      <Tag color={TagColors.processing}>Pending</Tag>
    )

  const renderTutoringHours = (text: string, record: TutorTimeCard) => {
    const tutoringHours = record.line_items.reduce((acc, cur) => {
      if (cur.individual_tutoring_session || cur.group_tutoring_session || cur.category === 'Tutoring') {
        return acc + Number(cur.hours)
      }
      return acc
    }, 0)

    return <span className="spanHours">{tutoringHours.toFixed(2)}</span>
  }

  const renderNoteHours = (text: string, record: TutorTimeCard) => {
    const noteHours = record.line_items.reduce((acc, cur) => {
      if (cur?.title?.toLowerCase().includes('note')) {
        return acc + Number(cur.hours)
      }
      return acc
    }, 0)
    return <span className="spanHours">{noteHours.toFixed(2)}</span>
  }

  const renderOtherHours = (text: string, record: TutorTimeCard) => {
    const otherHours = record.line_items.reduce((acc, cur) => {
      if (
        !cur?.title.toLowerCase().includes('note') &&
        !cur?.group_tutoring_session &&
        !cur?.individual_tutoring_session &&
        !(cur?.category === 'Tutoring')
      ) {
        return acc + Number(cur.hours)
      }
      return acc
    }, 0)

    return <span className="spanHours">{otherHours.toFixed(2)}</span>
  }

  const renderTotalHours = (text: string, record: TutorTimeCard) => {
    const totalHours = record.line_items.reduce((acc, cur) => {
      return acc + Number(cur.hours)
    }, 0)
    return <span className="spanHours">{totalHours.toFixed(2)}</span>
  }

  const renderActions = (text: string, record: TutorTimeCard) => {
    const isApproved =
      Boolean((record.admin_approval_time && adminID) || (record.tutor_approval_time && tutorID)) ||
      record.admin_has_approved
    return (
      <Row justify="center">
        <Tooltip title={isApproved && tutorID ? 'Can not edit approved time card' : 'Edit'} mouseEnterDelay={0.4}>
          <Button
            className="button buttonEdit"
            size="small"
            onClick={() => dispatch(showModal({ props: { pk: record.pk }, modal: MODALS.TIME_CARD }))}
            disabled={Boolean(isApproved && tutorID)}
          >
            <EditOutlined />
          </Button>
        </Tooltip>
        {!isTutor && (
          <Popconfirm title="Delete record?" onConfirm={() => handleDelete(record.pk)} placement="bottom">
            <Tooltip title="Delete" mouseEnterDelay={0.4}>
              <Button className="button buttonDelete" size="small">
                <DeleteOutlined />
              </Button>
            </Tooltip>
          </Popconfirm>
        )}
        <Tooltip title={isApproved ? 'Approved' : 'Approve'} mouseEnterDelay={0.4}>
          {!isApproved ? (
            <Button
              className="button buttonApprove"
              size="small"
              onClick={() =>
                dispatch(showModal({ props: { pk: record.pk, tutorID, adminID }, modal: MODALS.TIME_CARD }))
              }
            >
              <CheckOutlined />
            </Button>
          ) : (
            <Button className="button buttonApproved" size="small">
              <CheckCircleTwoTone />
            </Button>
          )}
        </Tooltip>
      </Row>
    )
  }

  const commonColumns: ColumnProps<TutorTimeCard>[] = [
    { title: 'Name', dataIndex: 'tutor', render: renderTutor },
    {
      title: 'Start',
      dataIndex: 'start',
      render: renderTime,
      defaultSortOrder: 'ascend',
      sorter: (a: TutorTimeCard, b: TutorTimeCard) => moment(a.start).valueOf() - moment(b.start).valueOf(),
    },
    {
      title: 'End',
      dataIndex: 'end',
      render: renderTime,
      sorter: (a: TutorTimeCard, b: TutorTimeCard) => moment(a.end).valueOf() - moment(b.end).valueOf(),
    },
    {
      title: 'Tutor Approval',
      dataIndex: 'tutor_approval_time',
      render: renderTutorApproval,
      width: 110,
      sorter: (a: TutorTimeCard, b: TutorTimeCard) =>
        a.tutor_approval_time && b.tutor_approval_time
          ? moment(a.tutor_approval_time).valueOf() - moment(b.tutor_approval_time).valueOf()
          : -1,
    },
    {
      title: 'Total Pay',
      dataIndex: 'total',
      render: t => `$${t}`,
    },
    {
      title: 'Tutor Note',
      dataIndex: 'tutor_note',
      render: renderNote,
      width: 60,
      sorter: (a: TutorTimeCard, b: TutorTimeCard) => (a.tutor_note ? 1 : -1),
    },
  ]

  const adminColumns: ColumnProps<TutorTimeCard>[] = [
    {
      title: 'Admin Approval',
      dataIndex: 'admin_approval_time',
      render: renderAdminApproval,
      width: 110,
      sorter: (a: TutorTimeCard, b: TutorTimeCard) =>
        a.admin_approval_time && b.admin_approval_time
          ? moment(a.admin_approval_time).valueOf() - moment(b.admin_approval_time).valueOf()
          : -1,
    },
    {
      title: 'Admin Note',
      dataIndex: 'admin_note',
      render: renderNote,
      width: 60,
      sorter: (a: TutorTimeCard, b: TutorTimeCard) => (a.admin_note ? 1 : -1),
    },
  ]

  const endColumns: ColumnProps<TutorTimeCard>[] = [
    {
      title: 'Hours',
      children: [
        {
          title: 'Tutoring',
          dataIndex: 'tutoring_hours',
          render: renderTutoringHours,
          className: 'columnHours',
        },
        { title: 'Note', dataIndex: 'note_hours', render: renderNoteHours, className: 'columnHours' },
        { title: 'Other', dataIndex: 'other_hours', render: renderOtherHours, className: 'columnHours' },
        { title: 'Total', dataIndex: 'total_hours', render: renderTotalHours, className: 'columnHours' },
      ],
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: renderActions,
      className: 'columnActions',
    },
  ]

  // If tutorID is defined, must be tutor app => don't show admin columns
  const columns = tutorID ? commonColumns.concat(endColumns) : commonColumns.concat(adminColumns).concat(endColumns)

  const handleFilter = (timeCards: TutorTimeCard[]) => {
    return timeCards.filter(
      timeCard =>
        moment(timeCard.end).isSameOrAfter(selectedStart) &&
        moment(timeCard.end).subtract(1, 'd').isSameOrBefore(selectedEnd) &&
        getFullName(tutors[timeCard.tutor]).trim().toLowerCase().includes(search.toLowerCase()),
    )
  }

  const refreshTimeCards = () => {
    setLoading(true)
    dispatch(
      fetchTimeCards({
        start: moment(selectedStart).subtract(2, 'd').format(dateFormat),
        end: moment(selectedEnd).add(2, 'd').format(dateFormat),
        tutor: tutorID,
      }),).catch(err => {}).finally(() => setLoading(false))
  }

  // TODO: Add a Tooltip hover for admin_approver once Administrator UserType created
  return (
    <>
      { isAdmin && (
        <Button type="primary" className={styles.refresh} onClick={refreshTimeCards} disabled={loading}>
          {loading ? <LoadingOutlined /> : <RedoOutlined />}
          Refresh Timecards
        </Button>
      )}
      <div className={styles.containerTable}>
        <Table {...defaultTableProps} loading={loading} dataSource={handleFilter(timeCards)} columns={columns} />
      </div>
    </>
  )
}
