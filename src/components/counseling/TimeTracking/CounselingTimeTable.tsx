// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CheckOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Checkbox, Popconfirm, Statistic, Table } from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { getFullName } from 'components/administrator'
import { concat, startCase, sumBy } from 'lodash'
import moment from 'moment'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  deleteCounselingHoursGrant,
  deleteCounselorTimeEntry,
  updateCounselingHoursGrant,
  updateCounselorTimeEntry,
} from 'store/counseling/counselingThunks'
import { CounselingHoursGrant, CounselorTimeEntry } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import {
  selectCounselorsObject,
  selectIsAdmin,
  selectIsCounselorOrAdmin,
  selectStudentsObject,
} from 'store/user/usersSelector'
import styles from './styles/TimeTracking.scss'

type Props = {
  timeEntries: CounselorTimeEntry[]
  hoursGrants: CounselingHoursGrant[]
  displaySummary?: boolean
}

enum RecordType {
  TimeEntry,
  HoursGrant,
}

// Composite type to make TS a little easier to work with ;)
type TableRowType = (CounselorTimeEntry | CounselingHoursGrant) & {
  created?: string
  date?: string
  recordType: RecordType
}

const CounselingTimeTable = ({ timeEntries, hoursGrants, displaySummary = true }: Props) => {
  const students = useSelector(selectStudentsObject)
  const counselors = useSelector(selectCounselorsObject)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const isAdmin = useSelector(selectIsAdmin)
  const dispatch = useReduxDispatch()

  const doDelete = useCallback(
    (entry: TableRowType) => {
      if (entry.recordType === RecordType.TimeEntry) {
        dispatch(deleteCounselorTimeEntry(entry.pk))
      } else {
        dispatch(deleteCounselingHoursGrant(entry.pk))
      }
    },
    [dispatch],
  )

  // Helper method to update whether or not time entry is marked paid
  const toggleMarkedPaid = useCallback(
    (timeEntry: TableRowType) => {
      const data = { marked_paid: !timeEntry.marked_paid, pk: timeEntry.pk }
      if (timeEntry.recordType === RecordType.HoursGrant) {
        dispatch(updateCounselingHoursGrant(data))
      } else {
        dispatch(updateCounselorTimeEntry(data))
      }
    },
    [dispatch],
  )

  const renderSummary = () => {
    // We only include time entries and hours grants that are supposed to be included in hours bank.
    // Some hours from before students started using UMS are excluded
    const grantTotal = sumBy(hoursGrants, g => (g.include_in_hours_bank ? Number(g.number_of_hours) : 0))
    const spendTotal = sumBy(timeEntries, te => (te.include_in_hours_bank ? Number(te.hours) : 0))

    return (
      <div className="summary-container">
        <Statistic title="Hours Added" value={grantTotal} />
        <Statistic title="Hours Used" value={spendTotal} />
      </div>
    )
  }

  // Render actions to edit/delete along with a popconfirm on delete
  const renderActions = (_, entry: TableRowType) => {
    const propKey = entry.recordType === RecordType.TimeEntry ? 'counselorTimeEntryPK' : 'editCounselingHoursGrantID'
    const props = { [propKey]: entry.pk }

    const modal =
      entry.recordType === RecordType.TimeEntry
        ? MODALS.COUNSELOR_TIME_ENTRY_MODAL
        : MODALS.COUNSELING_HOURS_GRANT_MODAL
    return (
      <>
        <Button
          icon={<EditOutlined />}
          type="default"
          onClick={() =>
            dispatch(
              showModal({
                modal,
                props,
              }),
            )
          }
        />
        <Popconfirm title="Are you sure you want to delete this time entry?" onConfirm={() => doDelete(entry)}>
          <Button icon={<DeleteOutlined />} type="default" />
        </Popconfirm>
      </>
    )
  }

  // Render our hours, along with highlighting :)
  const renderHours = (hours: number, item: TableRowType) => (
    <span className={`hours ${item.recordType === RecordType.HoursGrant ? 'added' : ''}`}>{`${
      item.recordType === RecordType.HoursGrant ? '+' : ''
    }${Math.abs(hours)}`}</span>
  )

  // Render student with their packages down asunder their name
  const renderStudentName = (_, timeEntry: TableRowType) => {
    const student = students[timeEntry.student]
    if (!student) return ''
    return (
      <div>
        {getFullName(student)}
        <br />
        <span className="help">{student.counseling_student_types_list.join(', ')}</span>
      </div>
    )
  }

  // Render paid status, with options for admins to mark as paid if not paid
  const renderPaid = (_, timeEntry: TableRowType) => {
    if (isAdmin) {
      return (
        <Checkbox onChange={() => toggleMarkedPaid(timeEntry)} checked={timeEntry.marked_paid}>
          Mark Paid ({`$${timeEntry.amount_paid}`})
        </Checkbox>
      )
    }
    return (
      <span>
        {timeEntry.marked_paid && <CheckOutlined />}
        {`$${timeEntry.amount_paid}`}
      </span>
    )
  }

  const columns: ColumnProps<TableRowType>[] = [
    {
      title: 'Date',
      dataIndex: 'date',
      render: (d: string) => moment(d).format('MM/DD'),
      defaultSortOrder: 'descend',
      sorter: (a: TableRowType, b: TableRowType) =>
        moment(a.date ?? a.created).valueOf() - moment(b.date ?? b.created).valueOf(),
    },
    {
      title: 'Hours',
      dataIndex: 'hours',
      render: (_, a: TableRowType) => renderHours(a.hours ?? a.number_of_hours, a),
    },
    {
      title: 'Paid',
      dataIndex: 'amount_paid',
      render: renderPaid,
      sorter: (a: TableRowType, b: TableRowType) => a.amount_paid - b.amount_paid,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: startCase,
    },
    {
      title: 'Counselor',
      dataIndex: 'counselor',
      render: (c: number) => getFullName(counselors[c]),
    },
    {
      title: 'Student',
      dataIndex: 'student',
      render: renderStudentName,
    },
  ]
  if (isCounselorOrAdmin) {
    columns.push({
      title: 'Actions',
      dataIndex: 'pk',
      render: renderActions,
    })
  }

  const hoursTableRows: TableRowType[] = hoursGrants.map(h => ({ ...h, recordType: RecordType.HoursGrant }))
  const timeEntryTableRows: TableRowType[] = timeEntries.map(t => ({ ...t, recordType: RecordType.TimeEntry }))
  const data: TableRowType[] = concat(hoursTableRows, timeEntryTableRows)

  return (
    <div className={styles.counselorTimeEntryTable}>
      {displaySummary && renderSummary()}
      <Table dataSource={data} columns={columns} rowKey="slug" />
    </div>
  )
}
export default CounselingTimeTable
