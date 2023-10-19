// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  CalendarOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  StopOutlined,
  ThunderboltFilled,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { Badge, Button, Checkbox, Empty, Input, Popconfirm, Row, Skeleton, Table, Tag, Tooltip } from 'antd'
import { ColumnsType, TableProps } from 'antd/lib/table'
import { createColumns, messageSuccess, renderHighlighter } from 'components/administrator'
import styles from 'components/counseling/styles/CounselorMeeting.scss'
import { orderBy, values } from 'lodash'
import moment from 'moment'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { selectCounselorMeetings, selectCounselorNotes } from 'store/counseling/counselingSelectors'
import {
  deleteCounselorMeeting,
  FetchCounselorMeetingFilter,
  fetchCounselorMeetings,
  updateCounselorMeeting,
} from 'store/counseling/counselingThunks'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { selectLocationsObject } from 'store/tutoring/tutoringSelectors'
import { fetchLocations } from 'store/tutoring/tutoringThunks'
import {
  getActiveUser,
  selectCounselor,
  selectIsCounselor,
  selectIsCounselorOrAdmin,
  selectIsStudent,
  selectStudent,
} from 'store/user/usersSelector'
import { fetchCounselor, fetchStudent } from 'store/user/usersThunks'
import ScheduleMeetingPopover from './ScheduleMeetingPopover'

enum MeetingCheckbox {
  Past = 'Show Past',
}

const checkboxOptions = values(MeetingCheckbox)

const tableProps: TableProps<CounselorMeeting> = {
  rowKey: 'slug',
  showHeader: true,
  size: 'middle',
  pagination: { position: ['bottomRight'], hideOnSinglePage: true },
}

type Props = {
  onlyUpcoming?: boolean
  studentID?: number
  showToolbar?: boolean
  showStudentName?: boolean // Default True
  showTasks?: boolean // Default True
  showActions?: boolean // Default True
}

const DEFAULT_MEETINGS_TO_SHOW = 3

export const CounselorMeetingTable = ({
  onlyUpcoming = false,
  studentID,
  showToolbar = true,
  showStudentName = true,
  showTasks = true,
  showActions = true,
}: Props) => {
  const timezone = moment.tz.guess()
  const dispatch = useReduxDispatch()
  const isCounselorOrAdmin = useSelector(selectIsCounselorOrAdmin)
  const isCounselor = useSelector(selectIsCounselor)
  const isStudent = useSelector(selectIsStudent)
  const student = useSelector(selectStudent(studentID))
  const counselorMeetings = orderBy(useSelector(selectCounselorMeetings), ['start', 'order'], ['asc', 'asc'])
  const counselorNotes = useSelector(selectCounselorNotes)
  const locationObject = useSelector(selectLocationsObject)

  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [selectedCheckboxes, setCheckboxes] = useState<MeetingCheckbox[]>([])
  const [deleting, setDeleting] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  /**setting the value of 'counselorID' for either student or counselor view. if a counselor is viewing the page, it wont have a student ID to reference. So, instead we're using getActiveUser to get their ID so we can access their bufferHours.  */

  const activeUser = useSelector(getActiveUser)
  const counselorID = isCounselor ? activeUser.cwUserID : student?.counselor
  const counselor = useSelector(selectCounselor(counselorID))

  // Fetch data using fetchCounselorMeetings thunk
  const studentPK = student?.pk
  const loadData = useCallback(
    async (filterData: FetchCounselorMeetingFilter) => {
      setLoading(true)
      await dispatch(fetchCounselorMeetings(filterData))
      await dispatch(fetchLocations())
      setLoading(false)
    },
    [dispatch],
  )

  const loadStudent = !student && studentID

  useEffect(() => {
    if (loadStudent && studentID) {
      dispatch(fetchStudent(studentID))
    }
  }, [dispatch, loadStudent, studentID])

  const loadCounselor = !counselor && counselorID

  useEffect(() => {
    if (loadCounselor && counselorID) {
      dispatch(fetchCounselor(counselorID))
    }
  }, [dispatch, counselorID, loadCounselor])

  // Always load data, in case it's changed recently
  useEffect(() => {
    // We load all meetings for a specific student (past and future)
    if (studentID) loadData({ student: studentID })
    else loadData({ start: moment().format('YYYY-MM-DD') })
  }, [dispatch, loadData, studentID])

  // When we show all, we need to load past meetings. Only applies when we aren't showing meetings
  // for a specific student (because when we are, we load all of those meetings at the jump)
  useEffect(() => {
    if (selectedCheckboxes.includes(MeetingCheckbox.Past) && !studentID) {
      loadData({ end: moment().format('YYYY-MM-DD') })
    }
  }, [loadData, selectedCheckboxes, studentID])

  const renderNote = (text: string, cm: CounselorMeeting) => {
    const noteCount = counselorNotes.filter(n => n.counselor_meeting === cm.pk).length
    if (!noteCount && !isCounselor) return <span>No notes</span>
    return (
      <Button
        className="note"
        type="link"
        onClick={() =>
          dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_NOTE, props: { counselorMeetingID: cm.pk } }))
        }
      >
        {cm.notes_finalized && isCounselor ? (
          <Tooltip title="Notes Finalized">
            <CheckCircleFilled />
          </Tooltip>
        ) : (
          ''
        )}
        {isCounselor ? 'Edit' : 'View Notes'} <Badge count={noteCount} />
      </Button>
    )
  }

  // For students we render notes for passed meetings and agenda for future meetings
  const renderAgendaNotes = (_: string, cm: CounselorMeeting) => {
    if (!isCounselor && cm.start && moment(cm.start).isBefore(moment().add(1, 'h'))) return renderNote('', cm)
    return (
      <Button
        type="link"
        onClick={() =>
          dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING_INFO, props: { counselorMeetingPK: cm.pk } }))
        }
      >
        View Agenda ({cm.agenda_items.length})
      </Button>
    )
  }

  const renderTasks = (_: string, record: CounselorMeeting) => {
    // If the counselor meeting is associated with a roadmap, include tasks based on roadmap_task_keys list
    if (record.assigned_task_count) {
      const url = isCounselorOrAdmin
        ? `#/tasks/student/${record.student}/?meeting=${record.pk}`
        : `#/tasks/?meeting=${record.pk}`
      return (
        <Button className="view-task" type="link" href={url}>
          View Tasks ({record.assigned_task_count})
        </Button>
      )
    }
    // No tasks associated with meeting
    return <span>No Tasks</span>
  }

  /**
   * If meeting has been scheduled, we cancel the meeting. Otherwise, we delete meeting.
   */
  const handleDelete = (meeting: CounselorMeeting) => {
    setDeleting(true)
    dispatch(deleteCounselorMeeting(meeting.pk))
      .then(_ => messageSuccess('Meeting Deleted'))
      .finally(() => setDeleting(false))
  }

  const handleCancel = (meeting: CounselorMeeting) => {
    setCancelling(true)
    const payload = { ...meeting, start: null, end: null }
    dispatch(updateCounselorMeeting(meeting.pk, { ...payload, send_notification: false }, true))
      .then(_ => messageSuccess('Meeting Cancelled'))
      .finally(() => setCancelling(false))
  }
  // Render Action buttons. Separate helper function to render actions for students/parents
  const renderStudentActions = (_: string, record: CounselorMeeting) => {
    if (record.start && moment(record.start).isBefore()) return ''
    const rescheduleLimit = counselor?.student_reschedule_hours_required
    const disableEdit = !!(
      record.start &&
      rescheduleLimit !== null &&
      moment(record.start) < moment().add(rescheduleLimit, 'hours')
    )
    const toolTipTitle = record.start ? 'Reschedule Meeting' : 'Schedule Meeting'

    return (
      <Row className="action-row">
        <Tooltip title={disableEdit ? 'Meeting can no longer be edited' : toolTipTitle}>
          <Button
            size="small"
            disabled={disableEdit}
            icon={<CalendarOutlined />}
            onClick={() =>
              dispatch(
                showModal({
                  modal: MODALS.SCHEDULE_COUNSELOR_MEETING,
                  props: { meetingID: record.pk },
                }),
              )
            }
          />
        </Tooltip>
      </Row>
    )
  }
  const renderActions = (_: string, record: CounselorMeeting) => {
    if (!isCounselorOrAdmin) return renderStudentActions('', record)
    return (
      <Row className="action-row">
        <ScheduleMeetingPopover meetingID={record.pk} />
        <Button
          className="edit-btn"
          size="small"
          icon={<EditOutlined />}
          onClick={() =>
            dispatch(
              showModal({
                modal: MODALS.COUNSELOR_MEETING,
                props: { counselorMeetingID: record.pk, studentID: record.student },
              }),
            )
          }
        />
        {record.start ? (
          <Popconfirm
            title="Are you sure you want to unschedule this meeting? The meeting will still appear on this roadmap, and you can re-schedule it later."
            onConfirm={() => handleCancel(record)}
          >
            <Button size="small" loading={cancelling} icon={<StopOutlined />} />
          </Popconfirm>
        ) : null}
        <Popconfirm title="Are you sure you want to delete this meeting?" onConfirm={() => handleDelete(record)}>
          <Button size="small" loading={deleting} icon={<DeleteOutlined />} />
        </Popconfirm>
      </Row>
    )
  }

  const renderMeeting = (_, meeting: CounselorMeeting) => {
    let locationLabel
    if (meeting.location) {
      const loc = locationObject[meeting.location]
      if (loc) {
        locationLabel = (
          <Tooltip title={`${loc.address}\n${loc.address_line_two}\n${loc.city}`}>
            <p>Location: {loc.name}</p>
          </Tooltip>
        )
      }
    } else {
      locationLabel = <p>Remote Meeting</p>
    }

    return (
      <div className="meeting-display">
        {isCounselorOrAdmin && showStudentName && (
          <p className="name">
            <Link className="name-link" to={`/profile/student/${meeting.student}/`}>
              {renderHighlighter(meeting.student_name, search)}
            </Link>
          </p>
        )}
        <p className="title">{meeting.title}</p>
        {meeting.start && locationLabel}
        {meeting.counselor_meeting_template_name && <p className="help">{meeting.counselor_meeting_template_name}</p>}
        {meeting.start && meeting.end ? (
          <p className="date">
            {moment(meeting.start).format('MMM Do h:mma')} - {moment(meeting.end).format('h:mma')}
          </p>
        ) : (
          <p className="date">Not Scheduled</p>
        )}
        {meeting.start && moment(meeting.start).isAfter(moment().subtract(1, 'h')) && meeting.zoom_url && (
          <a href={meeting.zoom_url} target="_blank" rel="noreferrer" className="zoom-tag">
            <Tooltip title="Click to launch Zoom for this meeting">
              <Tag color="blue">
                <VideoCameraOutlined />
                &nbsp;Launch Zoom
              </Tag>
            </Tooltip>
          </a>
        )}
      </div>
    )
  }

  const commonColumns: ColumnsType[] = [
    {
      title: 'Meeting',
      dataIndex: 'title',
      render: renderMeeting,
    },
    {
      title: isCounselor ? 'Agenda' : 'Agenda/Notes',
      dataIndex: 'agenda_items',
      render: renderAgendaNotes,
    },
  ]
  if (showTasks) {
    commonColumns.push({
      title: 'Tasks',
      dataIndex: 'related_task_types',
      render: renderTasks,
    })
  }

  const lastCounselorColumns = [
    {
      title: 'Notes',
      dataIndex: 'private_notes',
      render: renderNote,
    },
  ]

  let columnsSeed = []

  if (isCounselorOrAdmin) {
    columnsSeed = [...commonColumns, ...lastCounselorColumns]
  } else {
    columnsSeed = commonColumns
  }
  if (showActions) {
    columnsSeed.push({ title: 'Actions', dataIndex: 'actions', render: renderActions })
  }

  const columns = createColumns(columnsSeed) as ColumnsType<CounselorMeeting>

  // Filter for past sessions
  const shouldFilterPast = (start: string | null, selectedMeetingCheckboxes: MeetingCheckbox[]) => {
    if (!start || selectedMeetingCheckboxes.includes(MeetingCheckbox.Past)) {
      return true
    }
    return moment(start).isAfter(moment().subtract(2, 'h'))
  }
  // Filter meetings to return 10 Upcoming Meetings (filters out cancelled meetings)
  let filteredMeetings: CounselorMeeting[]
  if (onlyUpcoming || isStudent) {
    // We display next meeting, scheduled, and student schedulable meetings
    filteredMeetings = counselorMeetings.filter(
      cm =>
        !cm.cancelled &&
        shouldFilterPast(cm.start, selectedCheckboxes) &&
        cm.title.toLowerCase().includes(search.toLowerCase()) &&
        (cm.start || cm.student_schedulable),
    )
  } else {
    filteredMeetings = counselorMeetings.filter(
      cm =>
        cm.student === Number(studentID) &&
        !cm.cancelled &&
        shouldFilterPast(cm.start, selectedCheckboxes) &&
        (cm.title.toLowerCase().includes(search.toLowerCase()) || cm.student_name.toLowerCase().includes(search)),
    )
  }
  const meetingCount = filteredMeetings.length
  const sortedMeetings = filteredMeetings.slice(0, showAll ? filteredMeetings.length : DEFAULT_MEETINGS_TO_SHOW)
  const roadmapsApplied = student?.roadmaps && student.roadmaps.length > 0

  return (
    <div className={styles.CounselorMeetingTable}>
      <div className="meeting-toolbar">
        {showToolbar ? <h2 className="meeting-header">{onlyUpcoming ? 'Upcoming Meetings' : 'Meetings'}</h2> : <div />}
        <div className="wisernet-toolbar">
          {counselorMeetings.length ? (
            <Checkbox.Group
              className="meeting-checkbox-group"
              options={checkboxOptions}
              value={selectedCheckboxes}
              onChange={setCheckboxes}
            />
          ) : (
            ''
          )}
          {counselorMeetings.length ? (
            <div className="search-container">
              <Input.Search
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                allowClear
              />
            </div>
          ) : (
            ''
          )}
          {showToolbar && isCounselorOrAdmin && (
            <Button
              className="add-meeting-btn"
              type="primary"
              onClick={() => dispatch(showModal({ modal: MODALS.COUNSELOR_MEETING, props: { studentID } }))}
            >
              <PlusCircleOutlined />
              Add Meeting
            </Button>
          )}
        </div>
      </div>
      {!isCounselorOrAdmin && (
        <h3>
          <small>
            Please note that meetings are shown in your local timezone: <u>{timezone}</u>
          </small>
        </h3>
      )}
      {loading && <Skeleton loading />}
      {isCounselorOrAdmin && !sortedMeetings.length && !roadmapsApplied && studentID && !loading && (
        <Empty description="No meetings yet">
          <Button
            type="primary"
            onClick={() => dispatch(showModal({ modal: MODALS.APPLY_ROADMAP, props: { studentID } }))}
          >
            <ThunderboltFilled />
            Apply a Roadmap
          </Button>
        </Empty>
      )}
      {isCounselorOrAdmin && !sortedMeetings.length && roadmapsApplied && !loading && (
        <Empty description="A roadmap has been applied. Use the + button above to schedule a meeting" />
      )}
      {isCounselorOrAdmin && !sortedMeetings.length && !studentID && !loading && (
        <Empty description="No meetings scheduled. Visit a student page to schedule a meeting with them." />
      )}
      {sortedMeetings.length ? (
        <Table columns={columns} dataSource={sortedMeetings} loading={loading} {...tableProps} />
      ) : (
        ''
      )}
      {meetingCount > DEFAULT_MEETINGS_TO_SHOW && (
        <div className="show-all-container center">
          <Button type="link" onClick={() => setShowAll(!showAll)}>
            Show {showAll ? 'Fewer' : `All ${meetingCount} Meetings`}
          </Button>
        </div>
      )}
    </div>
  )
}
