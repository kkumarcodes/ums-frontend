// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Skeleton } from 'antd'
import _ from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchGroupTutoringSessions, FetchGroupTutoringSessionsFilter } from 'store/tutoring/tutoringThunks'
import { GroupTutoringSession } from 'store/tutoring/tutoringTypes'
import styles from './styles/GroupTutoringSessionSelector.scss'

type MyProps = {
  location?: number | Location
  onSelect: (selectedSession: number | null) => void
  groupMinsAvailable: number
}

const GroupTutoringSessionSelector = (props: MyProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  const { availableSessionTimes } = useSelector((state: RootState) => {
    const studentSessionList = Object.values(state.tutoring.studentTutoringSessions)
    const studentSessions = new Set(_.map(studentSessionList, 'group_tutoring_session'))
    const sessionFilter = (ses: GroupTutoringSession) => {
      const sessionLengthInMinutes = moment(ses.end).diff(moment(ses.start)) / 60 / 1000 // convert milliseconds to minutes
      return (
        (sessionLengthInMinutes < props.groupMinsAvailable || !ses.requires_hours) &&
        (ses.location === props.location || ses.is_remote) &&
        !studentSessions.has(ses.pk) &&
        !ses.is_course_session
      )
    }

    const availableSessionTimes = _.sortBy(
      Object.values(state.tutoring.groupTutoringSessions).filter(sessionFilter),
      s => moment(s.start).valueOf(),
    )

    return {
      availableSessionTimes,
    }
  })

  useEffect(() => {
    setLoading(true)
    const params: FetchGroupTutoringSessionsFilter = {
      exclude_classes: true,
      start_date: moment().format('YYYY-MM-DD'),
    }
    if (props.location && typeof props.location === 'number') {
      params.location = props.location
    }
    dispatch(fetchGroupTutoringSessions(params)).then(() => setLoading(false))
  }, [dispatch, props.location])

  if (loading) {
    return <Skeleton />
  }
  if (!availableSessionTimes.length) {
    return <p className={styles.emptyContent}>No upcoming sessions</p>
  }

  if (selectedSession) {
    return (
      <div className={styles.timeSelectedContainer}>
        You selected:&nbsp;
        <label>{selectedSession}</label>
        <Button
          onClick={() => {
            setSelectedSession(null)
            props.onSelect(null)
          }}
        >
          Change
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.sessionSelector}>
      {availableSessionTimes.map(session => {
        const date = `${moment(session.start).format('dddd MMM Do hh:mm a')} - ${moment(session.end).format('hh:mm a')}`
        const dateForConfirm = moment(session.start).format('MMM Do hh:mm a')
        const { title } = session
        return (
          <div className={styles.sessionContainer} key={session.pk}>
            <span className={styles.info}>
              <h3>{date}</h3>
              <p>{title}</p>
              {session.zoom_url && <p className="remote-label">Session takes place remotely via Zoom</p>}
            </span>
            <span className="toggle-buttons-container">
              <Button
                key={session.pk}
                className="toggle-button"
                onClick={e => {
                  e.preventDefault()
                  setSelectedSession(`${dateForConfirm}: ${title}`)
                  props.onSelect(session.pk)
                }}
              >
                Select
              </Button>
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default GroupTutoringSessionSelector
