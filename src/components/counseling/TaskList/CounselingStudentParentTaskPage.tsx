// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { message, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import useActiveStudent from 'libs/useActiveStudent'
import { values } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchCounselorMeetings } from 'store/counseling/counselingThunks'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchTasks, fetchTaskTemplates } from 'store/task/tasksThunks'
import { selectIsCounselor, selectIsParent } from 'store/user/usersSelector'
import CounselingAddTask from './CounselingAddTask'
import CounselingStudentParentTaskList from './CounselingStudentParentTaskList'

const CounselingStudentTaskPage = () => {
  const student = useActiveStudent()
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()

  const loadTaskTemplates = useSelector((state: RootState) => values(state.task.taskTemplates).length > 0)
  const isCounselor = useSelector(selectIsCounselor)
  const isParent = useSelector(selectIsParent)

  const studentPK = student?.pk
  const studentUserPK = student?.user_id
  useEffect(() => {
    if (studentPK && studentUserPK) {
      setLoading(true)
      const promises: Promise<any>[] = [
        dispatch(fetchTasks({ user: studentUserPK })),
        dispatch(fetchCounselorMeetings({ student: studentPK })),
      ]
      if (loadTaskTemplates) {
        promises.push(dispatch(fetchTaskTemplates()))
      }
      Promise.all(promises)
        .then(() => setLoading(false))
        .catch(() => message.warn('Could not load student task data'))
    }
  }, [dispatch, loadTaskTemplates, studentPK, studentUserPK])

  return (
    <div>
      {(!student || loading) && <Skeleton />}
      {student && !loading && (
        <div className="content">
          <div className="header flex">
            <h2>{isCounselor ? <span>{getFullName(student)}&apos;s</span> : 'Your'} tasks</h2>
            {isCounselor && <CounselingAddTask studentID={student.pk} />}
          </div>
          <CounselingStudentParentTaskList
            showParentTasks={isCounselor || isParent}
            showStudentTasks={!isParent}
            studentID={student.pk}
          />
        </div>
      )}
    </div>
  )
}
export default CounselingStudentTaskPage
