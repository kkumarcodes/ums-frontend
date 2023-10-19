// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Empty, Input, message, Skeleton } from 'antd'
import moment from 'moment'
import { getFullName } from 'components/administrator'
import { extractDeadlineSortDate } from 'libs/ScheduleSelector/date-utils'
import useActiveStudent from 'libs/useActiveStudent'
import { sortBy, values } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { fetchDeadlines, fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import { IsApplying, SortedTargetReachSafety, StudentUniversityDecision } from 'store/university/universityTypes'
import { selectIsCounselor, selectStudent } from 'store/user/usersSelector'
import ApplicationPlanSchool from './ApplicationPlanSchool'
import styles from './styles/ApplicationPlan.scss'

type Props = {
  studentID?: number
}

enum Views {
  Collapse,
  Expand,
  Undefined,
}

enum SortParams {
  Chances = 'chances',
  University = 'university_name',
  Deadline = 'deadline_date',
  Goal = 'goal_date',
}

const StudentAppPlanPage = ({ studentID }: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const propStudent = useSelector(selectStudent(studentID))
  const activeStudent = useActiveStudent()
  const student = propStudent || activeStudent
  const [search, setSearch] = useState('')
  const [sortByProp, setSortBy] = useState('')
  const [view, setView] = useState(Views.Undefined)

  const isCounselor = useSelector(selectIsCounselor)
  let studentUniversityDecisions = useSelector((state: RootState) =>
    sortBy(
      values(state.university.studentUniversityDecisions).filter(
        sud => sud.student === student?.pk && sud.is_applying === IsApplying.Yes,
      ),
      ['submitted'],
    ),
  )

  //Sorting schools according to these params
  if (sortByProp === SortParams.University) {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, `${sortByProp}`)
  }

  if (sortByProp === SortParams.Chances) {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, s =>
      SortedTargetReachSafety.indexOf(s.target_reach_safety),
    ).reverse()
  }

  if (sortByProp === SortParams.Deadline || SortParams.Goal) {
    studentUniversityDecisions = sortBy(studentUniversityDecisions, sud => {
      const sortDate = sud[(sortByProp as unknown) as keyof StudentUniversityDecision]
      if (!sortDate) return undefined
      return extractDeadlineSortDate(sortDate as string).valueOf()
    })
  }

  const studentPK = student?.pk
  const studentUserID = student?.user_id
  useEffect(() => {
    if (studentPK && studentUserID) {
      setLoading(true)
      Promise.all([
        dispatch(fetchTasks({ user: studentUserID })),
        dispatch(fetchStudentUniversityDecisions({ student: studentPK })),
      ])
        .then(() => setLoading(false))
        .catch(() => message.warn('Unable to load application plan data'))
    }
  }, [dispatch, studentPK, studentUserID])

  useEffect(() => {
    if (studentPK) {
      dispatch(fetchDeadlines({ student: studentPK }))
    }
  }, [dispatch, studentPK])

  const handleFilter = (studentUniversityDecisions: StudentUniversityDecision[]) => {
    if (search) {
      const trimmedText = search.trim().toLowerCase()
      return studentUniversityDecisions.filter(
        sud =>
          sud.university_name.toLowerCase().includes(trimmedText) ||
          moment(sud.deadline_date).format('MMM Do').toLowerCase().includes(trimmedText) ||
          moment(sud.goal_date).format('MMM Do').toLowerCase().includes(trimmedText) ||
          sud.target_reach_safety.toLowerCase().includes(trimmedText),
      )
    }
    return studentUniversityDecisions
  }

  return (
    <div className={styles.applicationPlanPage}>
      <div className="header">
        <h2>{isCounselor && student && <span>{getFullName(student)}&apos;&nbsp;</span>}Application Plan</h2>
        <div className="search-sort-collapse">
          <Input.Search
            className="app-plan-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by University..."
          />
          <div className="sort-collapse-row">
            <div className="sort-buttons">
              Sort By: <Button onClick={e => setSortBy(SortParams.Deadline)}>Deadline Date</Button>
              <Button onClick={() => setSortBy(SortParams.Goal)}>Goal Date</Button>
              <Button onClick={() => setSortBy(SortParams.University)}>A - Z</Button>
              <Button onClick={() => setSortBy(SortParams.Chances)}>Chances</Button>
            </div>
            <div className="expand-switch">
              View: <Button onClick={() => setView(Views.Expand)}>Expand</Button>
              <Button onClick={() => setView(Views.Collapse)}>Collapse</Button>
            </div>
          </div>
        </div>
      </div>
      {(!student || loading) && <Skeleton loading={true} />}
      {!studentUniversityDecisions.length && (
        <Empty>
          Your App Plan will be available once your school list is finalized. In the meantime, check out your&nbsp;
          <Button type="primary" href="#/tasks">
            Tasks
            <ArrowRightOutlined />
          </Button>
          .
        </Empty>
      )}
      <div className="schools-container">
        {/**
        Passing parent View enum value to child for the overall expand/collapse feature.
         */}
        {handleFilter(studentUniversityDecisions).map(sud => (
          <ApplicationPlanSchool
            key={sud.slug}
            studentUniversityDecision={sud}
            masterView={view}
            setMasterView={setView}
          />
        ))}
      </div>
    </div>
  )
}
export default StudentAppPlanPage
