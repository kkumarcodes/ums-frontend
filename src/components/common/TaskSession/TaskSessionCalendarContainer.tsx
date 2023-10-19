// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import styles from 'components/common/styles/TaskSession.scss'
import { EventTypes, TaskSessionCalendar, TaskSessionProvider } from 'components/common/TaskSession'
import { TaskSessionFilter } from 'components/common/TaskSession/TaskSessionFilter'
import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { GoogleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { selectCWUserID, selectIsStudent, selectUserID, selectIsParent } from 'store/user/usersSelector'
import { Button } from 'antd'
import { RootState } from 'store/rootReducer'
import { MODALS } from 'store/display/displayTypes'

type Props = {
  studentID?: number
  userID?: number
}

/**
 * Context container component for passing around filter state/updaters for Tasks/Sessions
 */
export const TaskSessionCalendarContainer = (props: Props) => {
  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const cwUserID = useSelector(selectCWUserID)
  const activeUserID = useSelector(selectUserID)

  const userID = isStudent ? activeUserID : props.userID
  const studentID = isStudent ? cwUserID : props.studentID

  const dispatch = useDispatch()

  // Link for student to add calendar to Google Calendar
  // Only shows if active user is student we're showing events for
  const studentCalendarLink = useSelector((state: RootState) => {
    if (studentID && studentID === cwUserID) {
      return state.user.students[studentID].calendar_url
    }
    return ''
  })

  const [eventType, setEventType] = useState(EventTypes.all)

  const showCalModal = () => {
    if (studentCalendarLink) {
      dispatch(
        showModal({
          modal: MODALS.GOOGLE_CAL_INSTRUCTIONS,
          props: { link: studentCalendarLink },
        }),
      )
    }
  }
  // Context value
  const value = { eventType, setEventType }
  return (
    <TaskSessionProvider value={value}>
      <section className={styles.containerTaskSession}>
        <TaskSessionFilter />
        <TaskSessionCalendar studentID={studentID} userID={userID} />
      </section>
      {studentCalendarLink && (isParent || isStudent) && (
        <section className="right">
          <Button className="addToGoogle" type="default" onClick={showCalModal}>
            <GoogleOutlined />
            <PlusCircleOutlined />
            Add to Google/Outlook Calendar
          </Button>
        </section>
      )}
    </TaskSessionProvider>
  )
}
