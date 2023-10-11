// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Switch, Input, message, Skeleton } from 'antd'
import { ReloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { getFullName } from 'components/administrator'
import styles from 'components/administrator/styles/DiagnosticResultsKanban.scss'
import _, { orderBy } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { fetchDiagnosticResults } from 'store/diagnostic/diagnosticThunks'
import { DiagnosticResult, DiagnosticStates } from 'store/diagnostic/diagnosticTypes'
import { showModal } from 'store/display/displaySlice'
import { DiagnosticResultModalProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchAdministrators, fetchCounselors } from 'store/user/usersThunks'
import {
  selectAdministrators,
  selectIsAdmin,
  selectTutors,
  selectIsTutor,
  selectUserID,
} from 'store/user/usersSelector'
import { Administrator, Tutor } from 'store/user/usersTypes'
import { selectDiagnosticResults } from 'store/diagnostic/diagnosticSelectors'
import DiagnosticResultsKanbanCard from './diagnosticResultKanbanCard'

const STATE_TO_COL_NAMES = {
  [DiagnosticStates.PENDING_SCORE]: 'Pending Score',
  [DiagnosticStates.PENDING_RECOMMENDATION]: 'Scored - Pending Rec',
  [DiagnosticStates.PENDING_RETURN]: 'Pending Return to Student',
  [DiagnosticStates.VISIBLE_TO_STUDENT]: 'Visible to Student',
}

export const DiagnosticResultsKanban = () => {
  const dispatch = useReduxDispatch()
  const [showReturned, setShowReturned] = useState(false)
  const isAdmin = useSelector(selectIsAdmin)
  const isTutor = useSelector(selectIsTutor)
  const userID = useSelector(selectUserID)
  const admins = useSelector(selectAdministrators)
  const tutors = useSelector(selectTutors)
  const [loading, setLoading] = useState(false)

  const potentialAssignees: Array<Tutor | Administrator> = [].concat(
    admins,
    tutors.filter(t => t.is_diagnostic_evaluator),
  )

  const diagnosticResults = orderBy(useSelector(selectDiagnosticResults), 'created', 'desc')

  const adminsExist = useSelector((state: RootState) => Object.keys(state.user.administrators).length > 0)

  const [search, setSearch] = useState('')
  /** Load (or reload) all of our DiagnosticResults  on load*/
  const fetch = useCallback(() => {
    setLoading(true)
    dispatch(fetchDiagnosticResults()).then(() => setLoading(false))
  }, [dispatch])

  // Fetch counselors if user is Tutor.
  useEffect(() => {
    if (isTutor) dispatch(fetchCounselors()).catch(() => message.error('Failed to load all data'))
  }, [dispatch, isTutor])

  useEffect(() => {
    fetch()
    if (!adminsExist) {
      dispatch(fetchAdministrators())
    }
  }, [adminsExist, dispatch, fetch])

  // Show modal that can be used to create DiagnosticResult for a student
  const showDiagnosticResultModal = () => {
    const payload: DiagnosticResultModalProps = { showSelectStudentDiagnostic: true }
    dispatch(showModal({ modal: MODALS.SUBMIT_DIAGNOSTIC_RESULT, props: payload }))
  }

  /**
   * Render a single swimline, filtering shown DiagnosticResults for those of specified state
   * @param state {DiagnosticStates}
   */
  const renderColumn = (state: DiagnosticStates) => {
    let filteredDiagResults = _.filter(diagnosticResults, { state })
    // If not admin, we filter for only the items assigned to current user (who presumably is a tutor)
    if (!isAdmin) {
      filteredDiagResults = filteredDiagResults.filter(dr => dr.assigned_to === userID)
    }
    // Finally we filter based on search term (against student_name and diagnostic_title)
    filteredDiagResults = filteredDiagResults.filter(dr => {
      const assignee = potentialAssignees.find(pa => pa.user_id === dr.assigned_to)
      return (
        (dr.student_name && dr.student_name.toLowerCase().includes(search.toLowerCase())) ||
        (assignee && getFullName(assignee).toLowerCase().includes(search.toLowerCase()))
      )
    })
    return (
      <div className="swimlane" key={state}>
        <div className="swimlaneHeader f-subtitle-1">{STATE_TO_COL_NAMES[state]}</div>
        <div className="swimlaneContainer">
          {filteredDiagResults.map(dr => (
            <DiagnosticResultsKanbanCard key={dr.pk} diagnosticResult={dr} />
          ))}
        </div>
      </div>
    )
  }

  const orderedStates = [
    DiagnosticStates.PENDING_SCORE,
    DiagnosticStates.PENDING_RECOMMENDATION,
    DiagnosticStates.PENDING_RETURN,
  ]
  return (
    <div className={styles.diagnosticResultsKanban}>
      <div className="toolbar">
        <div className="titleContainer">
          <h2>Diagnostics and Recommendations</h2>
          {!isAdmin && <p>Shown are all diagnostics pending score or evaluation that you have been assigned</p>}
        </div>
        <div className="actions-container">
          {isAdmin && (
            <div className="search-container">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search student or assignee name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
              />
            </div>
          )}
          {isAdmin && (
            <Button type="primary" onClick={showDiagnosticResultModal} className="reload">
              <UploadOutlined />
              Upload Diagnostic
            </Button>
          )}
          <Button type="default" onClick={() => fetch()} className="reload">
            <ReloadOutlined />
            Refresh
          </Button>
          {isAdmin && (
            <>
              <Switch checked={showReturned} onChange={e => setShowReturned(e)} />
              &nbsp;&nbsp;
              <label>Show Recently Returned</label>
            </>
          )}
        </div>
      </div>
      {loading && <Skeleton loading />}
      {!loading && (
        <div className="kanbanContainer">
          {orderedStates.map(renderColumn)}
          {showReturned && isAdmin && renderColumn(DiagnosticStates.VISIBLE_TO_STUDENT)}
        </div>
      )}
    </div>
  )
}

export default DiagnosticResultsKanban
