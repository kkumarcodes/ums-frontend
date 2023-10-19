// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Button, Card, Empty, Row, Skeleton, Space, Switch, Timeline } from 'antd'
import { getFullName } from 'components/administrator'
import { useRoadmap } from 'components/counseling/Roadmap/useRoadmap'
import useActiveStudent from 'libs/useActiveStudent'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsCounselor } from 'store/user/usersSelector'
import moment from 'moment'
import { orderBy } from 'lodash'
import { EditOutlined } from '@ant-design/icons'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import styles from './styles/VerticalRoadmap.scss'

const COMPONENT_VERTICAL_SPACING = 32 // in px
const CARD_BODY_VERTICAL_SPACING = 32 // in px

/**
 * A vertical timeline represetantion of a student's roadmap
 * Render on a Counselor's student profile Application Tab
 * if the student's school list is not finalized
 */
export const VerticalRoadmap = () => {
  const activeStudent = useActiveStudent()
  const isCounselor = useSelector(selectIsCounselor)
  const { loading, showPast, setShowPast, meetings, dispatch } = useRoadmap()
  const orderedMeetings = orderBy(
    meetings.filter(m => !m.cancelled),
    ['grade', 'semester', 'start', 'pk'],
    ['asc', 'asc', 'asc', 'asc'],
  )

  // Keeps JSX a little cleaner if we just return upon loading here
  if (loading || !activeStudent) {
    return (
      <div className={styles.roadmap}>
        <Skeleton loading={true} />
      </div>
    )
  }
  if (!meetings.length) {
    return (
      <div className={styles.roadmap}>
        <Empty description="No roadmap has been created yet" />
      </div>
    )
  }

  return (
    <div className={styles.verticalRoadmap}>
      <Space direction="vertical" size={COMPONENT_VERTICAL_SPACING}>
        <div className="header">
          <h2>{isCounselor && activeStudent && <span>{getFullName(activeStudent)}&apos;s&nbsp;</span>}Roadmap</h2>
        </div>
        <div>
          <Switch checked={showPast} onChange={setShowPast} />
          &nbsp; Show Past Meetings
        </div>
        <Timeline>
          {orderedMeetings.map(meeting => {
            const url = isCounselor
              ? `#/tasks/student/${meeting.student}/?meeting=${meeting.pk}`
              : `#/tasks/?meeting=${meeting.pk}`

            return (
              <Timeline.Item key={meeting.pk}>
                <Card className={meeting.start && moment(meeting.start).isBefore() ? 'past' : ''}>
                  <Row justify="space-between" align="middle">
                    <h3>{meeting.title}</h3>
                    <div>
                      {meeting.start ? <h3>{moment(meeting.start).format('MM/DD/YYYY')}</h3> : <h3>Unscheduled</h3>}
                    </div>
                  </Row>
                  <Space direction="vertical" size={CARD_BODY_VERTICAL_SPACING}>
                    {meeting.description && <div>{meeting.description}</div>}
                    <Row justify="space-between" align="middle">
                      {meeting.assigned_task_count ? (
                        <Button type="link" href={url}>
                          <span>{meeting.assigned_task_count}&nbsp;</span>
                          <span>{meeting.assigned_task_count === 1 ? 'Task' : 'Tasks'}</span>
                        </Button>
                      ) : (
                        <span>No assigned tasks</span>
                      )}
                      <Button
                        type="link"
                        onClick={() =>
                          dispatch(
                            showModal({
                              modal: MODALS.COUNSELOR_MEETING_NOTE,
                              props: { counselorMeetingID: meeting.pk },
                            }),
                          )
                        }
                      >
                        View Notes
                      </Button>
                      <Button
                        type="link"
                        onClick={() =>
                          dispatch(
                            showModal({
                              modal: MODALS.COUNSELOR_MEETING_INFO,
                              props: { counselorMeetingPK: meeting.pk },
                            }),
                          )
                        }
                      >
                        <span>View Agenda&nbsp;</span>
                        <span>({meeting.agenda_items.length})</span>
                      </Button>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() =>
                          dispatch(
                            showModal({
                              modal: MODALS.COUNSELOR_MEETING,
                              props: { counselorMeetingID: meeting.pk, studentID: meeting.student },
                            }),
                          )
                        }
                      >
                        Edit Meeting
                      </Button>
                    </Row>
                  </Space>
                </Card>
              </Timeline.Item>
            )
          })}
        </Timeline>
      </Space>
    </div>
  )
}
