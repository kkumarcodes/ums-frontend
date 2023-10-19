// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Empty, Row, Skeleton } from 'antd'
import WisernetSection from 'components/common/UI/WisernetSection'
import SUDCard, { SUDCardDisplay } from 'components/schools/StudentUniversityDecisioncard'
import {history} from 'App'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { fetchCollegeResearchFormSubmissions } from 'store/task/tasksThunks'
import { fetchDeadlines } from 'store/university/universityThunks'
import { IsApplying, StudentUniversityDecision } from 'store/university/universityTypes'
import { selectIsStudentOrParent } from 'store/user/usersSelector'
import { Student } from 'store/user/usersTypes'

enum SUDView {
  Keeper = 'keeper',
  Recommended = 'recommended',
}

type Props = {
  student: Student
  SUDs: StudentUniversityDecision[]
  loading: boolean
}

/**
 * Renders a student's school list as a list of cards
 * Depends on parent component fetching StudentUniversityDecisions, Deadlines, and Student
 */
export const StudentUniversityDecisionListView = ({ student, SUDs, loading }: Props) => {
  const isStudentOrParent = useSelector(selectIsStudentOrParent)
  const dispatch = useReduxDispatch()
  const [activeSUDView, setSUDView] = useState(SUDView.Keeper)

  let filteredSUDs: StudentUniversityDecision[] = []

  if (student?.school_list_finalized || activeSUDView === SUDView.Keeper) {
    filteredSUDs = SUDs.filter(sud => sud.is_applying === IsApplying.Yes)
  } else if (activeSUDView === SUDView.Recommended) {
    filteredSUDs = SUDs.filter(sud => sud.is_applying === IsApplying.Maybe)
  }

  useEffect(() => {
    if (student.pk) {
      dispatch(fetchCollegeResearchFormSubmissions({ student: student.pk }))
    }
  }, [dispatch, student.pk])

  useEffect(() => {
    dispatch(fetchDeadlines({ student: student.pk }))
  }, [dispatch, student.pk])

  return (
    <WisernetSection
      noPadding
      title={
        <div className="wisernet-toolbar">
          <div className="wisernet-toolbar-title f-title">Colleges</div>
          <div className="wisernet-toolbar-group">
            <Button
              className="btn-link passive-link"
              type="link"
              onClick={() => History.push(`/school-list/student/${student.pk}`)}
            >
              Open Colleges
            </Button>
          </div>
        </div>
      }
    >
      {!student.school_list_finalized && (
        <Row justify="end" className="sud-view-row">
          <Button
            className={`sud-view-btn ${activeSUDView === SUDView.Recommended ? 'active' : ''}`}
            onClick={() => setSUDView(SUDView.Recommended)}
          >
            Recommended
          </Button>
          <Button
            className={`sud-view-btn ${activeSUDView === SUDView.Keeper ? 'active' : ''}`}
            onClick={() => setSUDView(SUDView.Keeper)}
          >
            Keeper
          </Button>
        </Row>
      )}
      {/* Loading Case */}
      {loading && (
        <Row justify="center">
          <Skeleton />
        </Row>
      )}
      {/* Success Case */}
      {!loading &&
        filteredSUDs.map(sud => (
          <Row justify="center" key={sud.pk}>
            <SUDCard
              displayCounselorControls={false}
              displayIsApplying={false}
              studentUniversityDecisionPK={sud.pk}
              key={sud.pk}
              initialDisplay={SUDCardDisplay.Condensed}
              displayRTLColor={!isStudentOrParent || !student.hide_target_reach_safety}
            />
          </Row>
        ))}
      {/* Empty Case */}
      {!loading && !filteredSUDs.length && (
        <>
          <br />
          <Row justify="center">
            <Empty />
          </Row>
        </>
      )}
    </WisernetSection>
  )
}
