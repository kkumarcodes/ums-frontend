// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect } from 'react'
import _ from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { Table, Button } from 'antd'

import { DiagnosticRegistration } from 'store/diagnostic/diagnosticTypes'
import moment, { Moment } from 'moment'
import { ColumnProps, TableProps } from 'antd/es/table'
import { useReduxDispatch } from 'store/store'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { fetchGroupTutoringSessions } from 'store/tutoring/tutoringThunks'
import { useDiagnosticRegistrationContext } from './context'
import { getFullName } from '../utils'

interface TableRow extends DiagnosticRegistration {
  gts_title: string[]
  gts_date: Moment[]
  counselor_name: string
  program_advisor: string
}

const defaultTableProps: TableProps<TableRow> = {
  rowKey: 'slug',
  showHeader: true,
  bordered: true,
  pagination: { hideOnSinglePage: true },
}

const SearchProps = ['student_name', 'student_email', 'parent_name', 'parent_email']

const DiagnosticRegistrationsTable = () => {
  const dispatch = useReduxDispatch()
  const {
    searchText,
    startRegistrationRange,
    endRegistrationRange,
    startGTSRange,
    endGTSRange,
  } = useDiagnosticRegistrationContext()

  const filteredRegistrations = useSelector((state: RootState) => {
    const augmentedRegistrations: TableRow[] = Object.values(state.diagnostic.diagnosticRegistrations).map(dr => {
      const student = state.user.students[dr.student]
      const counselorName = student.counselor ? getFullName(state.user.counselors[student.counselor]) : ''
      const newTableRow: TableRow = {
        gts_title: [],
        gts_date: [],
        counselor_name: counselorName,
        ...dr,
      }
      if (
        dr.group_tutoring_sessions.length > 0 &&
        state.tutoring.groupTutoringSessions[dr.group_tutoring_sessions[0]]
      ) {
        const gts = state.tutoring.groupTutoringSessions[dr.group_tutoring_sessions[0]]
        newTableRow.gts_title.push(gts.title)
        newTableRow.gts_date.push(moment(gts.start))
      }
      if (
        dr.group_tutoring_sessions.length > 1 &&
        state.tutoring.groupTutoringSessions[dr.group_tutoring_sessions[1]]
      ) {
        const gts = state.tutoring.groupTutoringSessions[dr.group_tutoring_sessions[1]]
        newTableRow.gts_title.push(gts.title)
        newTableRow.gts_date.push(moment(gts.start))
      }
      return newTableRow
    })
    return augmentedRegistrations.filter(r => {
      // Filter on registration date
      if (startRegistrationRange && !moment(r.created).isAfter(startRegistrationRange)) {
        return false
      }
      if (endRegistrationRange && !moment(r.created).isBefore(endRegistrationRange)) {
        return false
      }

      // Filter on test dates
      if (startGTSRange) {
        // We need at least one GTS!
        if (!(r.gts_date[0] && r.gts_date[0].isAfter(startGTSRange))) {
          return false
        }
        if (r.gts_date.length > 1 && r.gts_date[1].isBefore(startGTSRange)) {
          return false
        }
      }
      if (endGTSRange) {
        // We need at least one GTS!
        if (!(r.gts_date[0] && r.gts_date[0].isBefore(endGTSRange))) {
          return false
        }
        if (r.gts_date.length > 1 && r.gts_date[1].isAfter(endGTSRange)) {
          return false
        }
      }

      // Filter on search text
      if (searchText && !_.some(SearchProps.map(p => r[p] && r[p].toLowerCase().includes(searchText.toLowerCase())))) {
        return false
      }

      return true
    })
  }, shallowEqual)
  const sortedRegistrations = filteredRegistrations.sort(
    (a, b) => moment(b.created).valueOf() - moment(a.created).valueOf(),
  )

  const gtsExist = useSelector((state: RootState) => Object.values(state.tutoring.groupTutoringSessions).length > 0)

  useEffect(() => {
    dispatch(fetchGroupTutoringSessions({}))
  }, [dispatch, gtsExist])

  // Render button to open modal to display diagnostic registration details
  const renderDetails = (_, dr: DiagnosticRegistration) => {
    return (
      <Button
        type="link"
        onClick={() =>
          dispatch(
            showModal({ modal: MODALS.DIAGNOSTIC_REGISTRATION_DETAILS, props: { diagnosticRegistrationPK: dr.pk } }),
          )
        }
      >
        Details
      </Button>
    )
  }

  // Render title and date of diagnostic
  const renderDiagnostic = (idx: number, dr: TableRow) => {
    // Display loading if we just haven't gotten the relevant GTS in our store yet. Otherwise blank
    if (dr.gts_title.length <= idx) {
      return dr.group_tutoring_sessions.length > idx ? <span>Loading... ({dr.group_tutoring_sessions[idx]})</span> : ''
    }
    return (
      <div className="diagnostic-display">
        <p>{dr.gts_title[idx]}</p>
        <p className="help">{dr.gts_date[idx].format('MMM Do h:mma')}</p>
      </div>
    )
  }

  const columns: ColumnProps<TableRow>[] = [
    {
      title: 'Registration',
      dataIndex: 'created',
      render: c => moment(c).format('MMM Do h:mma'),
      sorter: (a, b) => moment(a.created).valueOf() - moment(b.created).valueOf(),
    },
    {
      title: 'Student',
      dataIndex: 'student_name',
      render: (_, r) => (
        <>
          <p>{r.student_name}</p>
          <p className="help">{r.student_email}</p>
        </>
      ),
    },
    {
      title: 'Parent',
      dataIndex: 'parent_name',
      render: (_, r) => (
        <>
          <p>{r.parent_name}</p>
          <p className="help">{r.parent_email}</p>
        </>
      ),
    },
    { title: 'Counselor', dataIndex: 'counselor_name' },
    { title: 'Program Advisor', dataIndex: 'program_advisor' },
    { title: 'Diagnostic 1', dataIndex: 'gts_one', render: (_, r) => renderDiagnostic(0, r) },
    { title: 'Diagnostic 2', dataIndex: 'gts_one', render: (_, r) => renderDiagnostic(1, r) },
    { title: 'Assigned', dataIndex: 'assigned_evaluators' },
    {
      title: 'Details',
      dataIndex: 'pk',
      render: renderDetails,
    },
  ]

  return (
    <div>
      <Table {...defaultTableProps} dataSource={sortedRegistrations} columns={columns} />
    </div>
  )
}

export default DiagnosticRegistrationsTable
