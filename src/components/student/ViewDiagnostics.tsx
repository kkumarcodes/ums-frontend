// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Table, Tag, Tooltip, Popconfirm } from 'antd'
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons'
import { handleError } from 'components/administrator'
import moment from 'moment'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import {
  fetchAssignedDiagnostics,
  fetchDiagnosticResults,
  transitionDiagnosticResultState,
} from 'store/diagnostic/diagnosticThunks'
import { DiagnosticStates } from 'store/diagnostic/diagnosticTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { TableProps, ColumnProps } from 'antd/es/table'
import { UserType } from 'store/user/usersTypes'

type ViewDiagnosticsProps = { studentID: number }

const ViewDiagnostics = ({ studentID }: ViewDiagnosticsProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [loadingDiagnosticResults, setLoadingDiagnosticResults] = useState<number[]>([])

  /**
   * Retrieve student and their diagnostic results
   * isCounselorOrAdmin is boolean indicating whether or not currently logged in user is student's counselor
   */
  const { student, diagnosticResults, isCounselorOrAdmin } = useSelector((state: RootState) => {
    const student = state.user.students[studentID]

    const diagnosticResults = Object.values(state.diagnostic.diagnosticResults).filter(diagResult => {
      return student.pk === diagResult.student
    })

    const isCounselorOrAdmin = [UserType.Counselor, UserType.Administrator].includes(state.user.activeUser?.userType)

    return { student, diagnosticResults, isCounselorOrAdmin }
  }, shallowEqual)

  const hasStudent = Boolean(student)
  const hasResults = Boolean(Object.keys(diagnosticResults).length)

  useEffect(() => {
    if (!hasResults || !hasStudent) setLoading(true)

    if (hasStudent) {
      const promises: Array<Promise<any>> = []
      promises.push(dispatch(fetchAssignedDiagnostics(student.pk)))
      promises.push(dispatch(fetchDiagnosticResults(student.pk)))

      Promise.all(promises)
        .catch(err => {
          handleError('Failed to load data')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [hasResults, hasStudent, dispatch, student.pk, student.user_id])

  type DiagnosticRow = {
    key: number
    title: string
    completed?: string | Date | null
    recommendation?: string
    studentID: number
    diagnosticID: number
    state?: string
  }

  const tableProps: TableProps<DiagnosticRow> = {}

  // if we have a diagnosticResult without an associate task, add it to our list of diagnostics
  const diagnosticRow: DiagnosticRow[] = diagnosticResults.map(result => ({
    key: result.pk,
    title: result.diagnostic_title,
    completed: result.created,
    recommendation: result.recommendation,
    studentID: result.student,
    state: result.state,
    diagnosticID: result.diagnostic,
  }))

  const handleRowClick = (row: DiagnosticRow) => {
    dispatch(
      showModal({
        modal: MODALS.SUBMIT_DIAGNOSTIC_RESULT,
        props: {
          diagnosticID: row.diagnosticID,
          studentID: row.studentID,
        },
      }),
    )
  }

  /**
   * Return a diagnostic result recommendation to a student
   * @param diagnosticResultPK
   */
  const returnRecommendation = (diagnosticResultPK: number) => {
    setLoadingDiagnosticResults([...loadingDiagnosticResults, diagnosticResultPK])
    dispatch(transitionDiagnosticResultState(diagnosticResultPK, DiagnosticStates.VISIBLE_TO_STUDENT, {})).finally(
      () => {
        setLoadingDiagnosticResults(loadingDiagnosticResults.filter(pk => pk !== diagnosticResultPK))
      },
    )
  }

  const showStatus = (completed: string | undefined) => {
    return completed ? (
      moment(completed).format('MM/DD/YYYY')
    ) : (
      <Tag color="red" key={completed}>
        Incomplete
      </Tag>
    )
  }

  const displayRec = (recommendation: string, row: DiagnosticRow) => {
    if (loadingDiagnosticResults.includes(row.key)) {
      return <LoadingOutlined spin />
    }
    // Counselor has option to approve/return to student
    if (isCounselorOrAdmin && row.state === DiagnosticStates.PENDING_RETURN) {
      return (
        <Tooltip title="This recommendation requires your approval">
          <a href={`/cw/upload/${recommendation}`} target="_blank" rel="noopener noreferrer">
            Click to View Report
          </a>
          &nbsp;&nbsp;
          <Popconfirm
            title={`Are you sure you want to return this diagnostic report to ${student.first_name}?`}
            onConfirm={() => returnRecommendation(row.key)}
          >
            <Button size="small" type="default">
              <CheckOutlined />
              Return to {student.first_name}
            </Button>
          </Popconfirm>
        </Tooltip>
      )
    }

    if (recommendation)
      return (
        <a href={`/cw/upload/${recommendation}`} target="_blank" rel="noopener noreferrer">
          Click to View Report
        </a>
      )
    if (row.completed === null) {
      return <Button onClick={e => handleRowClick(row)}>Click here to submit diagnostic</Button>
    }

    return <div>Waiting on recommendation</div>
  }

  const columns: ColumnProps<DiagnosticRow>[] = [
    {
      title: 'Diagnostic Title',
      dataIndex: 'title',
      sorter: (a: DiagnosticRow, b: DiagnosticRow): number => (a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Submitted',
      dataIndex: 'completed',
      defaultSortOrder: 'ascend',
      render: showStatus,
    },
    {
      title: 'Score Reports & Recommendations',
      dataIndex: 'recommendation',
      render: displayRec,
    },
  ]

  return (
    <div>
      <Table {...tableProps} columns={columns} dataSource={diagnosticRow} />
    </div>
  )
}

export default ViewDiagnostics
