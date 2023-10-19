// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useState } from 'react'
import { useReduxDispatch } from 'store/store'

import { CounselorTimeCard } from 'store/counseling/counselingTypes'
import Table, { ColumnProps } from 'antd/lib/table'
import moment from 'moment'
import { CheckCircleFilled, CheckCircleOutlined, DeleteOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, message, Popconfirm, Tag } from 'antd'
import { approveTimeCard, deleteCounselorTimeCard, fetchCounselorTimeEntries } from 'store/counseling/counselingThunks'
import { selectCounselorTimeEntries } from 'store/counseling/counselingSelectors'
import { useSelector } from 'react-redux'
import { sortBy } from 'lodash'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { selectIsAdmin } from 'store/user/usersSelector'
import styles from './styles/CounselorTimeCard.scss'
import CounselingTimeTable from './CounselingTimeTable'

type Props = {
  timeCards: CounselorTimeCard[]
}

const CounselorTimeCardTable = ({ timeCards }: Props) => {
  const dispatch = useReduxDispatch()

  // The time cards we are actively loading time entries for (so we can display loading spin)
  const [loadingTimeEntries, setLoadingTimeEntries] = useState<number[]>([])
  const isAdmin = useSelector(selectIsAdmin)

  const renderDate = (d: string) => moment(d).utc().format('MM/DD/YY')
  const renderMoney = (d: number) => `$${d}`

  // Delete time card
  const doDelete = (pk: number) => {
    dispatch(deleteCounselorTimeCard(pk)).catch(err => message.warn('Unable to delete time card'))
  }

  // Approve time card
  const doApprove = (pk: number) =>
    dispatch(approveTimeCard(pk)).catch(err => message.warn('Unable to approve time card'))

  const timeEntries = useSelector(selectCounselorTimeEntries)

  // Render edit button for rows in our table of time cards
  const renderActions = (_: number, timeCard: CounselorTimeCard) => {
    return (
      <Popconfirm title="Are you sure you want to delete this time card?" onConfirm={() => doDelete(timeCard.pk)}>
        <Button icon={<DeleteOutlined />} type="default" />
      </Popconfirm>
    )
  }

  // Render approval options - both for admin and for counselor
  const renderApproval = (_: string, timeCard: CounselorTimeCard) => {
    const canApprove = !timeCard.counselor_approval_time || (isAdmin && !timeCard.admin_approval_time)
    return (
      <div className="approve-container">
        {timeCard.counselor_approval_time ? (
          <Tag color="blue">
            <CheckCircleFilled />
            &nbsp;
            {isAdmin ? 'Counselor' : 'You'} approved on {moment(timeCard.counselor_approval_time).format('MM/DD/YY')}
          </Tag>
        ) : (
          isAdmin && <p className="help">Pending counselor approval...</p>
        )}
        {timeCard.admin_approval_time && (
          <Tag color="blue">
            <CheckCircleFilled />
            &nbsp; Admin approved on {moment(timeCard.admin_approval_time).format('MM/DD/YY')}
          </Tag>
        )}
        {canApprove && (
          <Popconfirm title="Are you sure you want to approve this time card?" onConfirm={() => doApprove(timeCard.pk)}>
            <Button type="default" size="small">
              <CheckCircleOutlined />
              &nbsp;Approve
            </Button>
          </Popconfirm>
        )}
      </div>
    )
  }

  // Expanded row content is a table with the time entries for the time card that is the expanded row
  // Upon row expand we load time entries for the time card
  const expandedRowRender = (timeCard: CounselorTimeCard) => {
    const filteredEntries = sortBy(
      timeEntries.filter(te => te.counselor_time_card === timeCard.pk),
      'date',
    )
    return (
      <div className="expanded-row">
        <div className="wisernet-toolbar right">
          <Button
            type="primary"
            size="small"
            onClick={() =>
              dispatch(
                showModal({
                  modal: MODALS.COUNSELOR_TIME_ENTRY_MODAL,
                  props: { counselorPK: timeCard.counselor, timeCard: timeCard.pk },
                }),
              )
            }
          >
            <PlusCircleOutlined />
            Log Time
          </Button>
        </div>
        <CounselingTimeTable hoursGrants={[]} displaySummary={false} timeEntries={filteredEntries} />
      </div>
    )
  }

  // When a row gets expanded, we load time entries for that time card
  const onExpand = (expanded: boolean, timeCard: CounselorTimeCard) => {
    if (expanded) {
      setLoadingTimeEntries([...loadingTimeEntries, timeCard.pk])
      dispatch(fetchCounselorTimeEntries({ counselor_time_card: timeCard.pk })).then(() =>
        setLoadingTimeEntries(loadingTimeEntries.filter(t => t !== timeCard.pk)),
      )
    }
  }

  const columns: ColumnProps<CounselorTimeCard>[] = [
    {
      title: 'Counselor',
      dataIndex: 'counselor_name',
    },
    {
      title: 'Start',
      dataIndex: 'start',
      render: renderDate,
    },
    {
      title: 'End',
      dataIndex: 'end',
      render: renderDate,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      render: renderMoney,
    },
    {
      title: 'Total Hours',
      dataIndex: 'total_hours',
    },
    {
      title: 'Approval',
      dataIndex: 'counselor_approval_time',
      render: renderApproval,
    },
  ]
  // Only admins get delete option
  if (isAdmin) {
    columns.push({
      title: '',
      dataIndex: 'pk',
      render: renderActions,
    })
  }

  return (
    <div className={styles.counselorTimeCardTable}>
      <Table dataSource={timeCards} expandable={{ expandedRowRender, onExpand }} columns={columns} rowKey="slug" />
    </div>
  )
}
export default CounselorTimeCardTable
