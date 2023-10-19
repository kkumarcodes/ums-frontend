// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Empty } from 'antd'
import { getFullName, messageError } from 'components/administrator'
import { ApplicationTrackerTable } from 'components/applicationPlan/ApplicationTrackerTable'
import Loading from 'components/common/Loading'
import { useShallowSelector } from 'libs/useShallowSelector'
import { groupBy, isEmpty, keys, sortBy, values } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTasks } from 'store/task/tasksThunks'
import { fetchDeadlines, fetchStudentUniversityDecisions } from 'store/university/universityThunks'
import {
  CounselorTrackerApplicationStatus,
  IsApplying,
  StudentUniversityDecisionExtended,
} from 'store/university/universityTypes'
import { selectCWUserID, selectStudentsObject } from 'store/user/usersSelector'
import { ApplicationTrackerContextProvider, useCreateApplicationTrackerCtx } from './ApplicationTrackerContext'
import ApplicationTrackerToolbar from './ApplicationTrackerToolbar'
import styles from './styles/CounselorAppPlanPage.scss'

type Props = {
  counselorID?: number
}

const ApplicationTrackerPage = (props: Props) => {
  const [loading, setLoading] = useState(true)
  const dispatch = useReduxDispatch()

  const activeCounselorID = useSelector(selectCWUserID)
  const counselorID = props.counselorID || activeCounselorID
  const students = useSelector(selectStudentsObject)
  const contextValue = useCreateApplicationTrackerCtx()
  const deadlines = useShallowSelector((state: RootState) => state.university.deadlines)
  const SUDs: StudentUniversityDecisionExtended[] = useShallowSelector((state: RootState) =>
    values(state.university.studentUniversityDecisions)
      .filter(sud => sud.is_applying === IsApplying.Yes)
      .map(d => ({
        ...d,
        deadline_type: deadlines[d.deadline]?.type_of_name,
        deadline_enddate: deadlines[d.deadline]?.enddate,
      })),
  )

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dispatch(fetchStudentUniversityDecisions({ counselor: counselorID, is_applying: IsApplying.Yes })),
      dispatch(fetchDeadlines({ counselor: counselorID })),
    ])
      .catch(err => messageError('Load failed'))
      .finally(() => {
        dispatch(fetchTasks({ counselor: counselorID }))
        setLoading(false)
      })
  }, [counselorID, dispatch])

  /** Helper function for rendering our one or more tables. We render a single table when students are not
   * separate (contextValue.separateStudents)
   */
  const renderTables = () => {
    const search = contextValue.search.toLowerCase().trim()
    const filteredSUDs = SUDs.filter(s => {
      return (
        contextValue.selectedAppStatus.includes(s.application_status) &&
        contextValue.selectedGradYears.includes(students[s.student].graduation_year) &&
        (s.university_name.toLowerCase().includes(search) ||
          getFullName(students[s.student]).toLowerCase().includes(search))
      )
    })
    if (isEmpty(filteredSUDs)) {
      return <Empty description="No Records to Display" />
    }

    if (contextValue.separateStudents) {
      const groupedSUDs = groupBy(filteredSUDs, 'student')
      const sortedStudents = sortBy(keys(groupedSUDs), k => students[Number(k)].last_name.toLowerCase())
      return (
        <>
          {sortedStudents.map(k =>
            contextValue.selectedGradYears.includes(students[Number(k)].graduation_year) ? (
              <ApplicationTrackerTable key={k} studentID={Number(k)} sudBatch={groupedSUDs[k]} />
            ) : null,
          )}
        </>
      )
    }
    return <ApplicationTrackerTable sudBatch={filteredSUDs} />
  }

  return (
    <div className={styles.counselorAppPlanPage}>
      {loading && (
        <div className="center">
          <Loading message="Loading tracker data..." />
        </div>
      )}
      {!loading && !SUDs.length && <Empty description="No final colleges on students' lists" />}
      {!loading && (
        <ApplicationTrackerContextProvider value={contextValue}>
          <ApplicationTrackerToolbar />
          {renderTables()}
        </ApplicationTrackerContextProvider>
      )}
    </div>
  )
}

export default ApplicationTrackerPage
