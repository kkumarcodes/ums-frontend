// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Skeleton } from 'antd'
import { handleError } from 'components/administrator'
import _, { orderBy } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { fetchStudentTutoringSessions, fetchTutoringSessionNotes } from 'store/tutoring/tutoringThunks'
import styles from './styles/SessionNotes.scss'

type SessionNotesProps = { studentID: number; tutorID?: number }

const SessionNotes = ({ studentID, tutorID }: SessionNotesProps) => {
  const dispatch = useReduxDispatch()
  const [loading, setLoading] = useState(false)
  const studentSessions = orderBy(
    useSelector((state: RootState) =>
      _.values(state.tutoring.studentTutoringSessions).filter(s => s.student === studentID),
    ),
    'start',
  )
  const studentNotes = useSelector((state: RootState) =>
    _.values(state.tutoring.tutoringSessionNotes).filter(n => !n.group_tutoring_session),
  )

  useEffect(() => {
    const promises: Array<Promise<any>> = []
    promises.push(dispatch(fetchStudentTutoringSessions({ student: studentID })))
    const sessionNotesFilter = tutorID ? { tutor: tutorID } : { student: studentID }
    promises.push(dispatch(fetchTutoringSessionNotes(sessionNotesFilter)))
    setLoading(true)

    Promise.all(promises)
      .then(res => {
        setLoading(false)
      })
      .catch(err => {
        handleError('Failed to load data')
      })
  }, [dispatch, studentID, tutorID])

  type SessionRow = {
    key: number
    title: string
    date: string
    individualTutoringSessionID: number
    sessionNote: string
    sessionNoteID?: number
    tutorID: number | null | undefined // to appease typescript error on sessionRow declaration
  }

  const sessionRow: Partial<SessionRow[]> = []
  studentSessions.forEach(session => {
    if (!session.group_tutoring_session && !session.cancelled) {
      const note = studentNotes.find(n => n.pk === session.tutoring_session_notes)

      sessionRow.push({
        key: session.pk,
        title: session.title,
        date: moment(session.start).format('MM/DD/YYYY'),
        individualTutoringSessionID: session.pk,
        sessionNote: note ? note.notes : '',
        sessionNoteID: note?.pk,
        tutorID: session.individual_session_tutor,
      })
    }
  })

  const editNote = (row: SessionRow) => {
    const props: Partial<SessionRow> = {}
    props.individualTutoringSessionID = row.individualTutoringSessionID
    props.tutorID = tutorID
    props.sessionNote = row.sessionNote
    props.sessionNoteID = row.sessionNoteID

    dispatch(
      showModal({
        modal: MODALS.EDIT_TUTORING_SESSION_NOTE,
        props,
      }),
    )
  }

  const addNote = (row: SessionRow) => {
    const props: Partial<SessionRow> = {}
    props.individualTutoringSessionID = row.individualTutoringSessionID
    props.tutorID = tutorID

    dispatch(
      showModal({
        modal: MODALS.CREATE_TUTORING_SESSION_NOTE,
        props,
      }),
    )
  }

  const renderCard = (row: SessionRow) => {
    const button =
      row.sessionNote === '' ? (
        <span>
          <Button type="link" htmlType="button" onClick={() => addNote(row)}>
            Add note &nbsp;
            <EditOutlined />
          </Button>
        </span>
      ) : (
        <span>
          <Button type="link" htmlType="button" onClick={() => editNote(row)}>
            Edit Note &nbsp;
            <EditOutlined />
          </Button>
        </span>
      )

    const noteMarkup = (note: string) => {
      return { __html: note }
    }

    return (
      <Col span={8} key={row.key}>
        <Card bordered={true} className={styles.card}>
          <h3>{row.date}</h3>
          <h3 className={styles.marginBottom}>{row.title}</h3>
          <hr />
          <div dangerouslySetInnerHTML={noteMarkup(row.sessionNote)} />
          {tutorID && <span className={styles.editButton}>{button}</span>}
        </Card>
      </Col>
    )
  }
  if (loading) return <Skeleton />
  return (
    <div className={styles.sessionNotes}>
      <h3 className="f-subtitle-1">Session Notes</h3>
      <div className="site-card-wrapper">
        <Row gutter={16}>{sessionRow.map(r => renderCard(r))}</Row>
      </div>
    </div>
  )
}

export default SessionNotes
