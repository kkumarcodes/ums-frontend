// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CheckCircleFilled,
  CreditCardOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  RedoOutlined,
  ScheduleOutlined,
  SolutionOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons'
import { Button, Checkbox, message, Modal, Popconfirm, Row, Table, Tag, Tooltip } from 'antd'
import { createColumns, getFullName, sortString, TagColors } from 'components/administrator'
import styles from 'components/tutoring/styles/TutoringSessionsTable.scss'
import {
  NoteStatus,
  SessionStatus,
  SessionType,
  TimeRangeFilter,
  useTutoringSessionsCtx,
} from 'components/tutoring/TutoringSessions'
import {history} from 'App'
import _, { isEmpty, values } from 'lodash'
import moment from 'moment'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { getGroupTutoringSessions, getLocations, selectStudentTutoringSessions } from 'store/tutoring/tutoringSelectors'
import { convertTentativeSessionToConfirmed, updateStudentTutoringSession } from 'store/tutoring/tutoringThunks'
import { GroupTutoringSession, StudentTutoringSession } from 'store/tutoring/tutoringTypes'
import { getStudents, getTutors, selectCWUserID, selectIsAdmin, selectIsTutor } from 'store/user/usersSelector'
import { fetchTutors } from 'store/user/usersThunks'

const TODAY = moment()

type TableRecord = GroupTutoringSession | StudentTutoringSession

// TutorSessionNotes Modal
type ModalProps = {
  individualTutoringSessionID?: number
  groupTutoringSessionID?: number
  sessionNoteID: number
  tutorID: number
}

/**
 * Component renders a table of StudentTutoringSessions (individual and group)
 */
export const TutoringSessionsTable = () => {
  const {
    isAdminSTSPage,
    isAdminStudentSessionsPage,
    tutorID,
    studentID,
    loading,
    searchText,
    selectedTimeRange,
    sessionType,
    sessionStatus,
    noteStatus,
    startRange,
    endRange,
  } = useTutoringSessionsCtx()

  const dispatch = useReduxDispatch()

  const isAdmin = useSelector(selectIsAdmin)
  const isTutor = useSelector(selectIsTutor)
  const currentUserTutorID = useSelector(selectCWUserID)
  const studentsByPK = useSelector(getStudents)
  const tutorsByPK = useSelector(getTutors)
  const locationsByPK = useSelector(getLocations)
  const groupTutoringSessionsByPK = useSelector(getGroupTutoringSessions)
  // List of sessions we are cancelling (so we can show loading indicator)
  const [loadingSessions, setLoadingSessions] = useState<number[]>([])
  const [isLoading, setLoading] = useState<boolean>()

  /**
   * Filter callback function that finds all tutoring sessions associated with tutor with @param tutorID
   */
  const findSessionsAssociatedWithTutor = (session: TableRecord, tutorIDToFilter: number) => {
    if (!tutorIDToFilter) {
      return false
    }
    if ('individual_session_tutor' in session && session.individual_session_tutor) {
      return session.individual_session_tutor === tutorIDToFilter
    }
    if ('support_tutors' in session && session.primary_tutor) {
      return [session.primary_tutor].concat(session.support_tutors).includes(tutorIDToFilter)
    }
    return false
  }

  const tutoringSessions = useSelector((state: RootState) => {
    // Return all StudentTutoringSessions (both Individual and Booked Group)
    if (isAdminSTSPage) {
      return selectStudentTutoringSessions(state)
    }

    // If not, then we must filter Tutoring Sessions to only show sessions
    // associated with currently viewed Tutor (ExpandedTutorRow) or Student (ExpandedStudentRow) (on Admin platform)
    // Is current user a tutor? Then we show their tutoring sessions
    let associatedTutoringSessions: Array<Partial<GroupTutoringSession | StudentTutoringSession>> = []
    if (isTutor) {
      associatedTutoringSessions = [
        ...values(state.tutoring.studentTutoringSessions).filter(s =>
          findSessionsAssociatedWithTutor(s, currentUserTutorID),
        ),
        ...values(state.tutoring.groupTutoringSessions).filter(s =>
          findSessionsAssociatedWithTutor(s, currentUserTutorID),
        ),
      ]
    }
    // Returns a mix of StudentTutoringSessions and GroupTutoringSessions (ExpandedTutorRow)
    else if (tutorID) {
      associatedTutoringSessions = [
        ...values(state.tutoring.studentTutoringSessions).filter(s => findSessionsAssociatedWithTutor(s, tutorID)),
        ...values(state.tutoring.groupTutoringSessions).filter(s => findSessionsAssociatedWithTutor(s, tutorID)),
      ]
      // Returns only StudentTutoringSessions (ExpandedStudentRow)
    } else if (studentID) {
      associatedTutoringSessions = values(state.tutoring.studentTutoringSessions).filter(s => s.student === studentID)
    }
    return associatedTutoringSessions
  })

  /** Need to load tutors for SupportTutors tooltip */
  useEffect(() => {
    dispatch(fetchTutors())
  }, [dispatch])

  // TODO: Refactor EDIT/CREATE to be implicitly determined via sessionNoteID => MODALS.TUTORING_SESSION_NOTE
  const handleEditModal = (record: TableRecord) => {
    const modal = MODALS.EDIT_TUTORING_SESSION_NOTE
    const props: Partial<ModalProps> = { sessionNoteID: record.tutoring_session_notes as number }
    if ('individual_session_tutor' in record) {
      props.individualTutoringSessionID = record.pk
      props.tutorID = record.individual_session_tutor as number
    }
    if ('primary_tutor' in record) {
      props.groupTutoringSessionID = record.pk
      props.tutorID = record.primary_tutor as number
    }
    dispatch(showModal({ modal, props }))
  }

  // TODO: Refactor EDIT/CREATE to be implicitly determined via sessionNoteID => MODALS.TUTORING_SESSION_NOTE
  const handleCreateModal = (record: TableRecord) => {
    const modal = MODALS.CREATE_TUTORING_SESSION_NOTE
    const props: Partial<ModalProps> = {}
    if ('individual_session_tutor' in record) {
      props.individualTutoringSessionID = record.pk
      props.tutorID = record.individual_session_tutor as number
    }
    if ('primary_tutor' in record) {
      props.groupTutoringSessionID = record.pk
      props.tutorID = record.primary_tutor as number
    }
    dispatch(showModal({ modal, props }))
  }

  /** Update a given StudentTutoringSession */
  const updateSession = (pk: number, update: Partial<StudentTutoringSession>) => {
    if (update?.missed) {
      setLoadingSessions([...loadingSessions, pk])
    }
    // Make sure that if we're marking late cancel, we also mark cancel
    if (update?.late_cancel) {
      update.set_cancelled = true
    }

    dispatch(updateStudentTutoringSession(pk, update)).finally(() => {
      if (update?.missed) {
        setLoadingSessions(loadingSessions.filter(a => a !== pk))
      }
    })
  }

  // Here we shall launch TutoringSessionNote modal onClick
  // But first we check if activeUser is Admin, if so, we launch a read-only note modal
  const renderNoteStatus = (text: string, record: TableRecord & { notes_url: string }) => {
    if (isAdminSTSPage) {
      return record?.tutoring_session_notes ? (
        <Row justify="center">
          <FileTextOutlined onClick={() => handleEditModal(record)} />
        </Row>
      ) : null
    }

    let buttonText = ''

    if (record.tutoring_session_notes) {
      buttonText = NoteStatus.completed
    } else if (record.cancelled || (record as StudentTutoringSession).missed) {
      buttonText = ''
    } else if (moment(record.start).isBefore()) {
      buttonText = NoteStatus.pending
    }

    return buttonText ? (
      <button
        type="button"
        className="buttonNoteStatus"
        onClick={() => (buttonText === NoteStatus.completed ? handleEditModal(record) : handleCreateModal(record))}
      >
        {buttonText}
      </button>
    ) : null
  }

  /** Helper method to render checkbox (when appropriate) for whether or not session was missed */
  const renderMissed = (text: string, record: TableRecord) => {
    if (loadingSessions.includes(record.pk)) {
      return <LoadingOutlined spin={true} />
    }
    if ((record as GroupTutoringSession).primary_tutor) {
      return ''
    }
    return (
      <Checkbox
        disabled={record.cancelled}
        checked={(record as StudentTutoringSession).missed}
        onChange={e => updateSession(record.pk as number, { missed: e.target.checked })}
      />
    )
  }

  /** Helper method to render checkbox (when appropriate) for whether or not session was cancelled late */
  const handleLateCancelUpdate = (val: boolean, pk: number) => {
    if (val) {
      dispatch(
        showModal({
          modal: MODALS.LATE_CANCEL_CONFIRMATION,
          props: { studentTutoringSessionPK: pk },
        }),
      )
    } else {
      // update session to not be late cancelled
      updateSession(pk, { late_cancel: false })
    }
  }
  const renderLateCancel = (text: string, record: TableRecord) => {
    if (loadingSessions.includes(record.pk)) {
      return <LoadingOutlined spin={true} />
    }
    let disableTooltip = ''

    if ((record as StudentTutoringSession)?.group_tutoring_session) {
      disableTooltip = "Group sessions can't be marked as cancelled late!"
    } else if ((record as StudentTutoringSession).paygo_transaction_id) {
      disableTooltip = 'Cannot mark Paygo session that has been charged as late cancel'
    }

    if (disableTooltip) {
      return (
        <Tooltip title={disableTooltip}>
          <Checkbox disabled={true} checked={(record as StudentTutoringSession).missed} />
        </Tooltip>
      )
    }

    return (
      <>
        <Checkbox
          checked={(record as StudentTutoringSession).late_cancel}
          onChange={e => handleLateCancelUpdate(e.target.checked, record.pk)}
        />
        {(record as StudentTutoringSession).late_cancel_charge_transaction_id && (
          <Tooltip title={(record as StudentTutoringSession).late_cancel_charge_transaction_id}>
            <Tag color="blue">Charged</Tag>
          </Tooltip>
        )}
      </>
    )
  }

  /** Dispatch thunk to cancel a tutoring session */
  const handleCancel = (sessionPK: number, cancelled: boolean) => {
    setLoadingSessions([...loadingSessions, sessionPK])

    dispatch(updateStudentTutoringSession(sessionPK, { set_cancelled: cancelled }))
      .catch(() => message.error('Failed to cancel session'))
      .finally(() => {
        setLoadingSessions(loadingSessions.filter(s => s !== sessionPK))
        if (cancelled && !sessionStatus.includes(SessionStatus.cancelled)) {
          message.info(
            'Cancelled sessions are currently hidden. Use the Session Status dropdown to choose to view cancelled sessions',
            5,
          )
        }
      })
  }
  /**
   * Render checkbox for cancel (Disabled if sessions is already cancelled and for group tutoring sessions )
   */
  const renderCancel = (text: string, record: TableRecord) => {
    if (loadingSessions.includes(record.pk)) {
      return <LoadingOutlined spin={true} />
    }
    return (
      <Popconfirm
        title="Cancel tutoring session?"
        onConfirm={e => handleCancel(record.pk as number, true)}
        okText="Yes"
        cancelText="No"
      >
        <Checkbox
          checked={(record as StudentTutoringSession).cancelled}
          disabled={
            (record as StudentTutoringSession).cancelled ||
            (record as StudentTutoringSession).group_tutoring_session ||
            (record as GroupTutoringSession).support_tutors
          }
        />
      </Popconfirm>
    )
  }

  const renderDate = (text: string, record: TableRecord) => {
    return <span>{moment(record.start).format('M/DD/YY')}</span>
  }

  const renderTime = (text: string) => {
    return <span>{moment(text).format('h:mma')}</span>
  }

  // Removed Primary Tutor, since it has its own column now
  // Support: Jordan Haines, John Parsons
  /** If STS => record.group_tutoring_session. If GTS => record.pk */
  const generateGroupTooltip = (record: TableRecord) => (
    <div>
      {`Support: ${
        groupTutoringSessionsByPK[
          (record as StudentTutoringSession)?.group_tutoring_session || record?.pk
        ]?.support_tutors
          ?.map(tutorPK => getFullName(tutorsByPK[tutorPK]))
          .join(', ') || 'None'
      }`}
    </div>
  )
  const renderSessionType = (text: string, record: TableRecord) => {
    // StudentTutoringSession (Individual)
    if ((record as StudentTutoringSession).individual_session_tutor) {
      return <Tag color={TagColors.cyan}>Individual</Tag>
    }
    // StudentTutoringSession (Booked Group)
    if ((record as StudentTutoringSession).group_tutoring_session)
      return (
        <Tooltip title={() => generateGroupTooltip(record)}>
          <Tag color={TagColors.geekblue}>Group</Tag>
        </Tooltip>
      )
    // GroupTutoringSession (not booked)
    if ((record as GroupTutoringSession).support_tutors)
      return (
        <Tooltip title={() => generateGroupTooltip(record)}>
          <Tag color={TagColors.geekblue}>Group</Tag>
        </Tooltip>
      )
    return null
  }

  const renderDuration = (text: string, record: TableRecord) => {
    return text
  }

  const renderNameOrTitle = (text: string, record: TableRecord) => {
    const link = isAdmin
      ? `/students/?student=${studentsByPK[record.student]?.slug}`
      : `/?student=${studentsByPK[record.student]?.pk}`
    // Render student's full name if this is a StudentTutoringSession (individual or booked group session)
    if (record?.individual_session_tutor) {
      const studentPK = record.student
      return (
        !isEmpty(studentsByPK) &&
        studentsByPK[studentPK] && (
          <>
            <Tooltip
              title={`Accommodations: ${
                studentsByPK[studentPK].accommodations ? studentsByPK[studentPK].accommodations : 'None'
              }`}
            >
              <>
                <Tag onClick={() => History.push(link)} color={TagColors.blue} className="student-name-tag">
                  {getFullName(studentsByPK[studentPK])}
                </Tag>
                {(record as StudentTutoringSession).is_tentative && <Tag color="red">Tentative</Tag>}
              </>
            </Tooltip>
            {record.note && (
              <Tooltip title={record.note}>
                <InfoCircleOutlined />
              </Tooltip>
            )}
          </>
        )
      )
    }
    // Render group session title if this is a GroupedTutoringSession (not booked group session)
    if (record?.title) {
      return (
        <Tooltip title={`Description: ${record.description}`}>
          <Tag color={TagColors.default}>{record.title}</Tag>
        </Tooltip>
      )
    }
    return null
  }

  // Render name of tutor for the session
  const renderTutorName = (text: string, record: TableRecord) => {
    if ((record as StudentTutoringSession).individual_session_tutor) {
      return (
        <span>{getFullName(tutorsByPK[(record as StudentTutoringSession).individual_session_tutor as number])}</span>
      )
    }
    if (record.primary_tutor) {
      return <span>{getFullName(tutorsByPK[record.primary_tutor])}</span>
    }
    return null
  }

  const convertingSession = (recordPK: number) => {
    setLoading(true)
    dispatch(convertTentativeSessionToConfirmed(recordPK)).then(() => setLoading(false))
  }

  /** Render button to cancel session, if session can be cancelled */
  const renderActions = (slug: string, record: TableRecord) => {
    if (
      (record as StudentTutoringSession).individual_session_tutor &&
      (!record.cancelled || (record as StudentTutoringSession).missed) &&
      !(record as StudentTutoringSession).is_tentative
    ) {
      const loading = loadingSessions.includes(record.pk)
      return (
        <Row className="wrapper-actions" justify="end">
          <Tooltip title="Reschedule">
            <Button
              size="small"
              loading={loading}
              onClick={() =>
                dispatch(
                  showModal({
                    props: {
                      studentID: (record as StudentTutoringSession).student,
                      tutorID: (record as StudentTutoringSession).individual_session_tutor,
                      sessionID: record.pk,
                      sessionDetails: record,
                    },
                    modal: MODALS.EDIT_TUTORING_SESSION,
                  }),
                )
              }
            >
              <RedoOutlined />
            </Button>
          </Tooltip>
        </Row>
      )
    }
    if (
      (record as StudentTutoringSession).individual_session_tutor &&
      (!record.cancelled || (record as StudentTutoringSession).missed) &&
      (record as StudentTutoringSession).is_tentative
    ) {
      const loading = loadingSessions.includes(record.pk)
      return (
        <Row className="wrapper-actions" justify="end">
          <Tooltip title="Confirm">
            <Button
              size="small"
              loading={loading}
              onClick={() => {
                convertingSession(record.pk)
              }}
            >
              {isLoading ? <LoadingOutlined /> : <ScheduleOutlined />}
            </Button>
          </Tooltip>
        </Row>
      )
    }
    if (
      (record as StudentTutoringSession).group_session_tutor &&
      (!record.cancelled || (record as StudentTutoringSession).missed)
    ) {
      return <Row className="wrapper-actions" justify="end" />
    }
    return null
  }

  // format list of students enrolled in group session
  const renderStudentList = (enrolledStudents: string[]) => {
    if (enrolledStudents && enrolledStudents.length === 0) {
      return <h2>No students enrolled</h2>
    }

    const uniqueList = _.uniq(Object.values(enrolledStudents))
    const list = _.sortBy(uniqueList).map(s => {
      return <li key={s}>{s}</li>
    })

    return <ul>{list}</ul>
  }

  const shouldDisplayRoster = (record: TableRecord) => {
    if (record?.individual_session_tutor || isAdminSTSPage) {
      return false
    }
    return (
      isAdmin || record.primary_tutor === tutorID || (record.support_tutors && record.support_tutors.includes(tutorID))
    )
  }

  /** Render button to display roster for session */
  const renderDisplayStudent = (enrolledStudents: string[], record: TableRecord) => {
    if (shouldDisplayRoster(record)) {
      return (
        <Row justify="center">
          <Tooltip title="Roster">
            <Button
              size="small"
              className="btn-roster"
              loading={loading}
              onClick={() =>
                Modal.info({
                  centered: true,
                  title: `Class Roster For ${record.title}`,
                  icon: <SolutionOutlined />,
                  content: renderStudentList(enrolledStudents),
                  maskClosable: true,
                })
              }
            >
              <UsergroupAddOutlined />
            </Button>
          </Tooltip>
        </Row>
      )
    }
    return null
  }

  const initiatePaygoPurchase = (sessionID: number) => {
    dispatch(showModal({ modal: MODALS.PAYGO_PURCHASE, props: { individualTutoringSessionID: sessionID } }))
  }

  /** Render paygo status, including button to execute payment */
  const renderPaygoStatus = (transaction_id: string, record: TableRecord) => {
    const individualSession = record as StudentTutoringSession
    if (!individualSession.paygo_tutoring_package || !individualSession.individual_session_tutor) {
      return null
    }
    if (individualSession.paygo_transaction_id) {
      return (
        <Tag color="blue">
          <CheckCircleFilled />
          Paid
        </Tag>
      )
    }
    return (
      <Button onClick={() => initiatePaygoPurchase(record.pk)}>
        <CreditCardOutlined />
        Pay
      </Button>
    )
  }

  const renderZoomURL = (z: string) => (
    <a href={z} target="_blank" rel="noopener noreferrer">
      {z}
    </a>
  )

  // NOTE: Update splice logic (below) if columnsSeed is changed!!!
  const columnsSeed = [
    {
      title: 'Name',
      dataIndex: 'name',
      className: 'firstColumn',
      render: renderNameOrTitle,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      render: renderDate,
      sorter: (a: TableRecord, b: TableRecord) => moment(a.start).valueOf() - moment(b.start).valueOf(),
      defaultSortOrder: 'ascend',
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Start',
      dataIndex: 'start',
      render: renderTime,
      sorter: (a: TableRecord, b: TableRecord) => moment(a.start).valueOf() - moment(b.start).valueOf(),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'End',
      dataIndex: 'end',
      render: renderTime,
      sorter: (a: TableRecord, b: TableRecord) => moment(a.end).valueOf() - moment(b.end).valueOf(),
      sortDirections: ['ascend', 'descend', 'ascend'],
    },
    {
      title: 'Type',
      dataIndex: 'individual_session_tutor',
      render: renderSessionType,
      sorter: (a: TableRecord, b: TableRecord) => {
        let aType: string
        let bType: string
        // individual_tutoring_session existing is proxy for an Individual Session, otherwise Group Session
        if (a.individual_tutoring_session) {
          aType = SessionType.individual
        } else {
          aType = SessionType.group
        }
        if (b.individual_tutoring_session) {
          bType = SessionType.individual
        } else {
          bType = SessionType.group
        }
        return sortString(aType, bType)
      },
    },
    {
      title: 'Subject',
      dataIndex: 'tutoring_service_name',
      sorter: (a: TableRecord, b: TableRecord) => sortString(a.tutoring_service_name, b.tutoring_service_name),
    },
    ['Missed (No Show)', 'missed', renderMissed],
    ['Session Notes', 'tutoring_session_notes', renderNoteStatus],
    {
      title: 'Zoom',
      dataIndex: 'zoom_url',
      render: renderZoomURL,
    },
    ['Actions', 'slug', renderActions],
  ]

  // NOTE: Be extra careful with splicing logic below. Order of splice invocation matters

  // TUTOR - TutoringSessionTable column customizations
  // Enable Tutor to cancel a session (column appears after subject)
  if (isTutor) {
    columnsSeed.splice(6, 0, ['Cancelled', 'set_cancelled', renderCancel])
  }

  // ADMIN - TutoringSessionTable column customizations
  // Insert Tutor after Name column
  // Paygo before Actions column
  if (isAdmin) {
    columnsSeed.splice(4, 0, ['Duration Minutes', 'duration_minutes', renderDuration])
    columnsSeed.splice(7, 0, ['Cancelled', 'set_cancelled', renderCancel])
    columnsSeed.splice(9, 0, ['Late Cancel', 'late_cancel', renderLateCancel])
    columnsSeed.splice(1, 0, ['Tutor', 'tutor', renderTutorName])
    columnsSeed.push(['Paygo Payment', 'paygo_transaction_id', renderPaygoStatus])
  }

  if (!isAdminSTSPage && !isAdminStudentSessionsPage) {
    columnsSeed.push(['Students', 'enrolled_students', renderDisplayStudent])
  }

  const columns = createColumns(columnsSeed)

  /** Don't ask how the sausage is made... */
  const handleFilter = (tutoringSessions: TableRecord[]) => {
    let filtered = tutoringSessions
    // searchText filter (Admin StudentTutoringSession Page only)
    if (isAdminSTSPage) {
      const search = searchText.trim().toLowerCase()
      filtered = filtered.filter(session => {
        // StudentTutoringSession (Individual)
        const student = studentsByPK[(session as StudentTutoringSession).student]
        if (!student) {
          return false
        }
        if ((session as StudentTutoringSession).individual_session_tutor) {
          return (
            getFullName(student).toLowerCase().includes(search) ||
            getFullName(tutorsByPK[(session as StudentTutoringSession).individual_session_tutor as number])
              .toLowerCase()
              .includes(search) ||
            (student.location && locationsByPK[student.location as number].name.toLowerCase().includes(search))
          )
        }
        // StudentTutoringSession (Group)
        if ((session as StudentTutoringSession)?.group_tutoring_session) {
          return (
            getFullName(student).toLowerCase().includes(search) ||
            locationsByPK[(session as StudentTutoringSession).location].name.toLowerCase().includes(search) ||
            getFullName(
              tutorsByPK[
                groupTutoringSessionsByPK[(session as StudentTutoringSession)?.group_tutoring_session as number]
                  ?.primary_tutor
              ],
            )
              .toLowerCase()
              .includes(search) ||
            groupTutoringSessionsByPK[
              (session as StudentTutoringSession)?.group_tutoring_session as number
            ]?.support_tutors
              ?.map(tutorPK => getFullName(tutorsByPK[tutorPK]))
              ?.join(' ')
              ?.toLowerCase()
              ?.includes(search) ||
            (session.location &&
              locationsByPK[(session as StudentTutoringSession).location].name.toLowerCase().includes(search))
          )
        }
        // should never reach this code, but lint rule forces to return something
        return false
      })
    }

    // Session Type filter
    // In Admin StudentTutoringSessionPage and ExpandedStudentRow, all sessions are of type StudentTutoringSessions
    // In Tutor platform or ExpandedTutorRow, sessions are a mix of StudentTutoringSessions and GroupTutoringSessions
    if (!sessionType.includes(SessionType.individual)) {
      filtered = (filtered as StudentTutoringSession[]).filter(ele => !ele?.individual_session_tutor)
    }

    if (!sessionType.includes(SessionType.group)) {
      if (isAdminSTSPage || studentID) {
        filtered = (filtered as StudentTutoringSession[]).filter(ele => !ele?.group_tutoring_session)
      }
      if (isTutor || tutorID) {
        filtered = (filtered as GroupTutoringSession[]).filter(ele => !ele?.support_tutors)
      }
    }

    // Extra filter to make sure we only display individual sessions on isAdminSTSPage
    if (isAdminSTSPage) {
      filtered = (filtered as StudentTutoringSession[]).filter(ele => ele?.individual_session_tutor)
    }

    // Session Status filter
    if (!sessionStatus.includes(SessionStatus.cancelled)) {
      filtered = filtered.filter(ele => !ele.cancelled)
    }
    if (!sessionStatus.includes(SessionStatus.missed)) {
      filtered = filtered.filter(ele => !(ele as StudentTutoringSession).missed)
    }
    if (!sessionStatus.includes(SessionStatus.completed)) {
      filtered = filtered.filter(
        ele => !moment(ele.start).isBefore() || (ele as StudentTutoringSession).missed || ele.cancelled,
      )
    }
    if (!sessionStatus.includes(SessionStatus.upcoming)) {
      filtered = filtered.filter(ele => !moment(ele.start).isAfter() || ele.cancelled)
    }
    // Note Status filter
    if (!noteStatus.includes(NoteStatus.completed)) {
      filtered = filtered.filter(ele => !ele.tutoring_session_notes)
    }
    if (!noteStatus.includes(NoteStatus.pending)) {
      filtered = filtered.filter(
        ele => !moment(ele.start).isBefore() || ele.tutoring_session_notes || (ele as StudentTutoringSession).missed,
      )
    }

    // TimeRangeFilter (Tutor app only) -- default case is TimeRangeFilter.All
    if (selectedTimeRange === TimeRangeFilter.Today) {
      filtered = filtered.filter(ele => moment(ele.start).isSame(TODAY, 'day'))
    } else if (selectedTimeRange === TimeRangeFilter.Week) {
      filtered = filtered.filter(ele => moment(ele.start).isSame(TODAY, 'week'))
    } else if (selectedTimeRange === TimeRangeFilter.Month) {
      filtered = filtered.filter(ele => moment(ele.start).isSame(TODAY, 'month'))
    }

    // Range filter (Admin STS Page only)
    if (isAdminSTSPage) {
      if (startRange) {
        filtered = filtered.filter(ele =>
          moment(ele.start).isSameOrAfter(moment(startRange).hour(0).minute(0).seconds(0).millisecond(0)),
        )
      }
      if (endRange) {
        filtered = filtered.filter(ele =>
          moment(ele.start).isBefore(moment(endRange).hour(0).minute(0).seconds(0).millisecond(0).add(1, 'd')),
        )
      }
    }

    return filtered
  }

  return (
    <div className={styles.wrapperTutoringSessionsTable}>
      <Table
        rowKey="pk"
        size="small"
        loading={loading}
        dataSource={handleFilter(tutoringSessions as TableRecord[])}
        columns={columns}
        pagination={{ showSizeChanger: true }}
      />
    </div>
  )
}
