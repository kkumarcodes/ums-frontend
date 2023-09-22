// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSelector } from '@reduxjs/toolkit'
import { flatten, orderBy, sortBy, uniq, values } from 'lodash'
import { RootState } from 'store/rootReducer'
import { UserType } from 'store/user/usersTypes'

export const getUserState = (state: RootState) => state.user
export const getActiveUser = (state: RootState) => state.user.activeUser
export const getActiveCounselor = (state: RootState) =>
  state.user.activeUser ? state.user.counselors[state.user.activeUser.cwUserID] : null
export const getRecentStudent = (state: RootState) => state.user.recentStudents[0]
export const getCounselors = (state: RootState) => state.user.counselors
export const getParents = (state: RootState) => state.user.parents
export const getStudents = (state: RootState) => state.user.students
export const getTutors = (state: RootState) => state.user.tutors
export const getAdministrators = (state: RootState) => state.user.administrators
export const getCourses = (state: RootState) => state.user.courses
export const getZoomURLs = (state: RootState) => state.user.proZoomURLs

export const selectCWUserID = createSelector(getActiveUser, activeUser => activeUser?.cwUserID)
export const selectUserID = createSelector(getActiveUser, activeUser => activeUser?.userID)
export const selectUserType = createSelector(getActiveUser, activeUser => activeUser?.userType)
export const selectActiveUser = createSelector(getActiveUser, u => u)

/** A selector to pull any user from the store given the user's PK and user type */
export const selectCWUser = (cwUserID: number, userType: UserType) =>
  createSelector(getUserState, userState => {
    switch (userType) {
      case UserType.Student:
        return userState.students[cwUserID]
      case UserType.Parent:
        return userState.parents[cwUserID]
      case UserType.Counselor:
        return userState.counselors[cwUserID]
      case UserType.Tutor:
        return userState.tutors[cwUserID]
      case UserType.Administrator:
        return userState.administrators[cwUserID]
      default:
        return null
    }
  })

export const selectCounselors = createSelector(getCounselors, counselors => values(counselors))
export const selectCounselorsObject = createSelector(getCounselors, s => s)
export const selectParents = createSelector(getParents, parents => values(parents))
export const selectParentsObject = createSelector(getParents, s => s)
export const selectStudents = createSelector(getStudents, students => values(students))
export const selectStudentsObject = createSelector(getStudents, s => s)
export const selectCounselingStudents = createSelector(getStudents, students =>
  orderBy(
    values(students).filter(s => s.counseling_student_types_list.length > 0 || s.counselor),
    s => s.last_name.toLowerCase(),
  ),
)
export const selectTutors = createSelector(getTutors, tutors => values(tutors))
export const selectAdministrators = createSelector(getAdministrators, admins => values(admins))
export const selectHSCourse = (pk?: number) => createSelector(getCourses, courses => (pk ? courses[pk] : undefined))
export const selectCourses = createSelector(getCourses, courses => values(courses))
export const selectCoursesForStudent = (pk?: number) =>
  createSelector(getCourses, c => (pk ? values(c).filter(course => course.student === pk) : []))
export const selectStudent = (pk?: number) => createSelector(getStudents, s => (pk ? s[pk] : undefined))
export const selectTutorsForStudent = (studentPK?: number) =>
  createSelector(selectStudent(studentPK), getTutors, (student, tutors) =>
    student ? student.tutors.map(t => tutors[t]) : [],
  )
export const selectParent = (pk?: number) => createSelector(getParents, p => (pk ? p[pk] : undefined))
export const selectStudentsForParent = (pk?: number) =>
  createSelector(getStudents, p => (pk ? values(p).filter(p => p.parent === pk) : []))

export const selectCounselor = (pk?: number) =>
  createSelector(getCounselors, counselors => (pk ? values(counselors).find(c => c.pk === pk) : undefined))
export const selectTutor = (pk?: number) =>
  createSelector(getTutors, tutors => (pk ? values(tutors).find(c => c.pk === pk) : undefined))
export const selectAdministrator = (pk?: number) =>
  createSelector(getAdministrators, admins => (pk ? values(admins).find(c => c.pk === pk) : undefined))

export const selectUsers = (userType: UserType) => {
  switch (userType) {
    case UserType.Counselor:
      return selectCounselors
    case UserType.Parent:
      return selectParents
    case UserType.Student:
      return selectStudents
    case UserType.Tutor:
      return selectTutors
    default:
      throw new Error('unknown userType')
  }
}
// Select a given user of a given type
export const selectUser = (userType?: UserType.Student | UserType.Counselor | UserType.Tutor, pk?: number) =>
  createSelector([getStudents, getTutors, getCounselors], (students, tutors, counselors) => {
    if (!pk) return undefined
    if (userType === UserType.Counselor) return counselors[pk]
    if (userType === UserType.Student) return students[pk]
    if (userType === UserType.Tutor) return tutors[pk]

    return undefined
  })

export const selectIsStudent = createSelector(getActiveUser, activeUser => activeUser?.userType === UserType.Student)
export const selectIsTutor = createSelector(getActiveUser, activeUser => activeUser?.userType === UserType.Tutor)
export const selectIsParent = createSelector(getActiveUser, activeUser => activeUser?.userType === UserType.Parent)
export const selectIsAdmin = createSelector(
  getActiveUser,
  activeUser => activeUser?.userType === UserType.Administrator,
)
export const selectIsCounselor = createSelector(
  getActiveUser,
  activeUser => activeUser?.userType === UserType.Counselor,
)
export const selectIsCounselorOrAdmin = createSelector(
  getActiveUser,
  activeUser => activeUser?.userType === UserType.Administrator || activeUser?.userType === UserType.Counselor,
)
export const selectIsStudentOrParent = createSelector(
  getActiveUser,
  activeUser => activeUser?.userType === UserType.Parent || activeUser?.userType === UserType.Student,
)
export const selectAllUniqueStudentTags = createSelector(selectStudents, students => {
  return sortBy(uniq(flatten(students.map(student => student.tags))), x => x.toLowerCase())
})
export const selectAllStudentGradYears = createSelector(selectStudents, students => {
  return sortBy(uniq(students.map(student => student.graduation_year)))
})
export const selectAllStudentPackages = createSelector(selectStudents, students => {
  return sortBy(uniq(flatten(students.map(student => student.counseling_student_types_list))), x => x.toLowerCase())
})
