// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import Loading from 'components/common/Loading'
import { sortBy } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCounselingHoursGrants, selectCounselorTimeEntries } from 'store/counseling/counselingSelectors'
import {
  fetchCounselingHoursGrants,
  fetchCounselorTimeEntries,
  FetchCounselorTimeEntryParams,
} from 'store/counseling/counselingThunks'
import { useReduxDispatch } from 'store/store'
import {
  selectIsAdmin,
  selectIsCounselor,
  selectIsCounselorOrAdmin,
  selectStudentsObject,
} from 'store/user/usersSelector'
import { CounselingStudentType, UserType } from 'store/user/usersTypes'
import CounselingTimeTable from './CounselingTimeTable'
import {
  CounselorTimeEntryContextProvider,
  CounselorTimeEntryPaymentStatus,
  useCreateCounselorTimeEntryContext,
} from './CounselorTimeEntryContext'
import CounselorTimeEntryToolbar from './CounselorTimeEntryToolbar'
import styles from './styles/TimeTracking.scss'

type Props = {
  userType: UserType
  studentID?: number // Filter for a specific student
  counselorID?: number // Filter for a specific counselor
}

const CounselingTimePage = ({ userType, studentID, counselorID }: Props) => {
  const [loading, setLoading] = useState(false)
  const context = useCreateCounselorTimeEntryContext()
  const dispatch = useReduxDispatch()

  const isAdmin = useSelector(selectIsAdmin)
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const isCounselor = useSelector(selectIsCounselor)
  const timeEntries = useSelector(selectCounselorTimeEntries)
  const hoursGrants = useSelector(selectCounselingHoursGrants)
  const studentsObject = useSelector(selectStudentsObject)

  // We don't show hours grants to full package (non-paygo) students or their parents
  const showHoursGrants = isCounselorOrAdmin || !!(studentID && studentsObject[studentID].is_paygo)

  useEffect(() => {
    context.setCounselor(counselorID)
    context.setStudent(studentID)
  }, [counselorID, studentID, userType]) // eslint-disable-line react-hooks/exhaustive-deps

  // We filter the time entries that are shown based on a combination of our props and context

  // Helper function to filter for a specific student based on context. Used by both of our filters
  const filterForStudent = (studentPK: number) => {
    if (userType === UserType.Administrator) {
      if (context.student && context.student !== studentPK) return false
    } else if (userType === UserType.Counselor) {
      return !context.student || context.student === studentPK
    }

    // Intentionally only called for admins
    if (context.paygo) {
      const student = studentPK ? studentsObject[studentPK] : undefined
      if (!student) return false
      if (
        !(
          student.counseling_student_types_list.includes(CounselingStudentType.PAYGO) ||
          student.counseling_student_types_list.includes(CounselingStudentType['International PAYGO'])
        )
      ) {
        return false
      }
    }
    return true
  }

  const filteredTimeEntries = sortBy(
    timeEntries.filter(t => {
      if (context.paymentStatus === CounselorTimeEntryPaymentStatus.Paid) return false
      if (isCounselorOrAdmin) {
        if (context.start && moment(t.date).isBefore(context.start)) return false
        if (context.end && moment(t.date).isAfter(context.end)) return false
      }

      if (userType === UserType.Administrator) {
        if (context.counselor && context.counselor !== t.counselor) return false
      }
      if (userType === UserType.Counselor) {
        return !context.student || context.student === t.student
      }
      return filterForStudent(t.student)
    }),
    'date',
  )

  const filteredHoursGrants = sortBy(
    hoursGrants.filter(t => {
      // This case shouldn't get triggered, but just an extra check to ensure we don't show full-package students
      // their hours
      if (!showHoursGrants) return false

      if (context.paymentStatus === CounselorTimeEntryPaymentStatus.Paid) return t.marked_paid
      if (context.paymentStatus === CounselorTimeEntryPaymentStatus.Unpaid) return !t.marked_paid
      if (context.start && moment(t.created).isBefore(context.start)) return false
      if (context.end && moment(t.created).isAfter(context.end)) return false
      if (userType === UserType.Administrator && context.counselor) return false
      return filterForStudent(t.student)
    }),
    'created',
  )

  // Load data based on our filter vals (in context)
  const loadData = useCallback(async () => {
    setLoading(true)
    const filter: FetchCounselorTimeEntryParams = {}
    // We only filter for date if there is no student set, otherwise we just fetch all data for the student
    if (studentID) {
      filter.student = studentID
    } else {
      if (context.start) filter.start = context.start.format('YYYY-MM-DD')
      if (context.end) filter.end = context.end.format('YYYY-MM-DD')
    }
    if (counselorID) filter.counselor = counselorID
    await dispatch(fetchCounselorTimeEntries(filter))
    // We only load hours grants if: Is admin/counselor OR student is paygo
    if (showHoursGrants) {
      await dispatch(fetchCounselingHoursGrants(studentID ? { student: studentID } : undefined))
    }

    setLoading(false)
  }, [counselorID, dispatch, studentID, context.start, context.end, showHoursGrants]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
  }, [counselorID, dispatch, loadData, studentID, userType])

  const displayCounselorFilter = isAdmin && !(counselorID || studentID)
  const displayStudentFilter = (isAdmin || isCounselor) && !studentID
  return (
    <div className={styles.CounselingTimePage}>
      <h2 className="f-title">Counseling Time Log</h2>
      <p className="help">
        This log includes time counselors have spent on or with the student as well as any payment received for said
        time
      </p>
      <CounselorTimeEntryContextProvider value={context}>
        {isCounselorOrAdmin && (
          <CounselorTimeEntryToolbar
            forceStudent={studentID}
            displayCounselorFilter={displayCounselorFilter}
            displayStudentFilter={displayStudentFilter}
          />
        )}
        {loading && (
          <div className="center">
            <Loading message="Loading time entries..." />
          </div>
        )}
        {!loading && (
          <CounselingTimeTable
            displaySummary={showHoursGrants}
            hoursGrants={filteredHoursGrants}
            timeEntries={filteredTimeEntries}
          />
        )}
      </CounselorTimeEntryContextProvider>
    </div>
  )
}
export default CounselingTimePage
