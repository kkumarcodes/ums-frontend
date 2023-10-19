// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect } from 'react'
import { Tabs, Button } from 'antd'
import {
  TutoringSessionsFilter,
  TutoringSessionsTable,
  TutoringSessionsCalendar,
} from 'components/tutoring/TutoringSessions'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { UserType } from 'store/user/usersTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { GoogleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import styles from 'components/tutoring/styles/TutoringSessions.scss'

const { TabPane } = Tabs

export const TutorAppTutoringSessions = () => {
  const dispatch = useDispatch()

  const { calendarLink, hasStudents } = useSelector((state: RootState) => {
    const calendarLink =
      state.user.activeUser?.userType === UserType.Tutor
        ? state.user.tutors[state.user.activeUser.cwUserID].calendar_url
        : ''
    const hasStudents = Object.keys(state.user.students).length > 0
    return { calendarLink, hasStudents }
  })

  const showCalModal = () => {
    if (calendarLink) {
      dispatch(
        showModal({
          modal: MODALS.GOOGLE_CAL_INSTRUCTIONS,
          props: { link: calendarLink },
        }),
      )
    }
  }

  return (
    <section className={styles.tutoringSessionsContainer}>
      <h2 className="header">Tutoring Sessions</h2>
      <div className="actions right">
        <Button
          type="primary"
          disabled={!hasStudents}
          onClick={() => dispatch(showModal({ modal: MODALS.CREATE_TUTORING_SESSION, props: {} }))}
        >
          <PlusCircleOutlined />
          Create Tutoring Session
        </Button>
        {!hasStudents && <p className="help tiny">Cannot create tutoring session (no students)</p>}
      </div>
      <Tabs defaultActiveKey="1" className="tabs" animated={false}>
        <TabPane tab="List View" key="list" className="tabPane">
          <TutoringSessionsFilter tab="list" showTimeRangeFilter />
          <TutoringSessionsTable />
        </TabPane>
        <TabPane tab="Calendar View" key="calendar" className="tabPane">
          <TutoringSessionsFilter tab="calendar" />
          <TutoringSessionsCalendar />
          <br />
          <br />
          <section className="right">
            <Button className="addToGoogle" type="default" onClick={showCalModal}>
              <GoogleOutlined />
              <PlusCircleOutlined />
              Add to Google Calendar
            </Button>
          </section>
        </TabPane>
      </Tabs>
    </section>
  )
}
