// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react'
import { sortBy, values } from 'lodash'
import { useSelector, shallowEqual } from 'react-redux'
import { useReduxDispatch } from 'store/store'
import { RootState } from 'store/rootReducer'

import axios from 'store/api'
import { CheckCircleFilled, ArrowRightOutlined } from '@ant-design/icons'
import { Button, message, Skeleton } from 'antd'
import moment from 'moment-timezone'
import { enrollStudentInCourse } from 'store/tutoring/tutoringThunks'
import { closeModal } from 'store/display/displaySlice'
import { updateStudent } from 'store/user/usersThunks'
import CourseSelector, { CompleteCourse } from './CourseSelector'
import styles from './styles/PurchaseTutoringPackageModal.scss'

type Props = {
  studentID: number
  onPurchase?: () => void
}

const COURSES_ENDPOINT = '/tutoring/courses/?landing=true'

const PurchaseCourse = ({ studentID, onPurchase }: Props) => {
  const [loading, setLoading] = useState(false)
  const dispatch = useReduxDispatch()
  const [purchasing, setPurchasing] = useState(false)
  const [courses, setCourses] = useState<CompleteCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<number>()

  const hasTransactionID = useSelector((state: RootState) => state.user.students[studentID]?.last_paygo_purchase_id)

  // Always get fresh list of courses
  useEffect(() => {
    setLoading(true)
    axios.get(COURSES_ENDPOINT).then(response => {
      const { data }: { data: CompleteCourse[] } = response
      setCourses(data)
      setLoading(false)
    })
  }, [dispatch])

  /** Attempt a purchase of our selected course */
  const doPurchase = () => {
    const course = courses.find(c => c.pk === selectedCourse)
    if (course) {
      setPurchasing(true)
      dispatch(enrollStudentInCourse(studentID, course.pk, true))
        .then(() => {
          if (onPurchase) onPurchase()
          dispatch(closeModal())
        })
        .catch(e => message.warning(e))
        .finally(() => setPurchasing(false))
    }
  }

  // We need to set pending enrollment course on student
  const doStartCompleteOrder = () => {
    const course = courses.find(c => c.pk === selectedCourse)
    if (course) {
      dispatch(updateStudent(studentID, { pending_enrollment_course: selectedCourse }))
      window.open(course.magento_purchase_link, '_blank')
    }
  }

  // A course has been selected. Show confirmation
  const renderConfirm = () => {
    const course = courses.find(c => c.pk === selectedCourse)
    if (!course) return ''
    const start = moment(sortBy(course.group_tutoring_sessions, 'start')[0].start).tz(moment.tz.guess())
    let timeDescription = ''
    if (course.group_tutoring_sessions.length) {
      timeDescription = `${course.group_tutoring_sessions.length} session${
        course.group_tutoring_sessions.length !== 1 ? 's' : ''
      } starting on `
    }
    return (
      <div className="confirmation center">
        <p className="instructions">
          You are registering for the {course.name} course which begins on{' '}
          {`${start.format('dddd MMM Do')} at ${start.format('h:mma z')}`}
        </p>
        {hasTransactionID && (
          <div>
            <p className="instructions">You will be charged ${course.price}</p>
            <p>
              <Button loading={purchasing} type="primary" size="large" onClick={doPurchase}>
                Confirm <CheckCircleFilled />
              </Button>
            </p>
          </div>
        )}
        {!hasTransactionID && (
          <>
            <p>
              <Button size="large" onClick={doStartCompleteOrder} target="_blank">
                Complete Order <ArrowRightOutlined />
              </Button>
            </p>
            <p className="instructions">After clicking the button above and completing your order, refresh this page</p>
          </>
        )}
        <p className="back">
          <Button type="link" onClick={_ => setSelectedCourse(undefined)}>
            Return to course selection
          </Button>
        </p>
      </div>
    )
  }

  return (
    <div className={styles.purchaseGroupPackage}>
      <p className="instructions center">Select the class you would like to enroll in</p>
      {loading && <Skeleton />}
      {!selectedCourse && !loading && (
        <CourseSelector showAllSessions={true} courses={courses} onSelectCourse={setSelectedCourse} />
      )}
      {selectedCourse && renderConfirm()}
    </div>
  )
}
export default PurchaseCourse
