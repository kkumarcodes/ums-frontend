// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { RootState } from 'store/rootReducer'
import { getActiveUser } from 'store/user/usersSelector'
import { addRecentStudent } from 'store/user/usersSlice'
import { UserType } from 'store/user/usersTypes'

function useActiveStudent() {
  const dispatch = useDispatch()
  const { studentID } = useParams()
  // When active student changes, we update them in our recent students list (for counselors)
  useEffect(() => {
    if (studentID) {
      dispatch(addRecentStudent(studentID))
    }
  }, [studentID, dispatch])

  const activeUser = useSelector(getActiveUser)

  return useSelector((state: RootState) => {
    if (studentID) {
      return state.user.students[studentID]
    }
    if (activeUser?.userType === UserType.Student) {
      return state.user.students[activeUser.cwUserID]
    }
    if (activeUser?.userType === UserType.Parent) {
      return state.user.selectedStudent || undefined
    }

    return undefined
  })
}

export default useActiveStudent
