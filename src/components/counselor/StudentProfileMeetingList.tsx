// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons'
import { Tabs, Empty, Skeleton, Button } from 'antd'
import moment from 'moment'
import { RenderTaskBatch } from 'components/applicationPlan/RenderTaskBatch'
import { ApplicationPlanView } from 'components/applicationPlan/StudentAppPlanPage'
import { CounselorMeetingNoteForm } from 'components/counselor/CounselorMeetingNoteForm'
import React, { useState } from 'react'
import { CounselorMeeting, CounselorNote } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { Task } from 'store/task/tasksTypes'

type Props = {
  loading: boolean
  counselorMeetings: CounselorMeeting[]
  counselorNotes: CounselorNote[]
  tasks: Task[]
  studentPK: number
}

export const StudentProfileMeetingList = ({ loading, counselorMeetings, counselorNotes, tasks, studentPK }: Props) => {
  const dispatch = useReduxDispatch()

  const [selectedExpandedMeeting, setExpandedMeeting] = useState<number>()
  const meetingExists = !!counselorMeetings?.length

  const toggleExpandedMeeting = (pk: number) => {
    // If meeting item that was just clicked was already selected (i.e. expanded), collapse all meetings
    if (selectedExpandedMeeting === pk) {
      setExpandedMeeting(null)
    } else {
      // Otherwise, we expand the selected meeting
      setExpandedMeeting(pk)
    }
  }

  return (
    <div className="meetings-container">
      {/* Loading case */}
      {loading && <Skeleton active />}
      {/* Empty case */}
      {!loading && !meetingExists && <Empty />}
      {/* Success case */}
      {!loading && meetingExists && (
        <div className="meeting-list">
          <div key="header" className="meeting-item-header">
            <div className="task-header-item">Tasks</div>
          </div>
          {counselorMeetings.map(cm => {
            const tasksOnThisMeeting = tasks.filter(
              t => t.for_student === studentPK && cm?.roadmap_task_keys.includes(t.roadmap_task_key) && !t.archived,
            )
            const completedTaskCount = tasksOnThisMeeting.filter(t => t.completed).length
            const totalTaskCount = tasksOnThisMeeting.length
            const notesOnThisMeeting = counselorNotes.filter(cn => cn.counselor_meeting === cm.pk)
            const taskExistsOnMeeting = !!tasksOnThisMeeting.length
            const hasNotes = !!notesOnThisMeeting.length

            return (
              <div key={cm.slug} className="meeting-item-container">
                <button className="meeting-item-content" type="button" onClick={() => toggleExpandedMeeting(cm.pk)}>
                  <div className="left-content">
                    <div className="toggle-icon">
                      <CaretDownOutlined
                        className={`expand-icon ${selectedExpandedMeeting === cm.pk ? 'rotate' : ''}`}
                      />
                    </div>
                    <div className="meeting-date">{moment(cm.start).format('MMM D')}</div>
                    <div className="meeting-title">{cm.title}</div>
                  </div>
                  <div className="right-content">
                    {taskExistsOnMeeting ? (
                      <div className="task-count">{`${completedTaskCount}/${totalTaskCount}`}</div>
                    ) : (
                      <div className="task-count">0</div>
                    )}
                    <div className="note-count">{`${notesOnThisMeeting.length} Notes`}</div>
                  </div>
                </button>
                <Tabs
                  className={`tab-row ${selectedExpandedMeeting === cm.pk ? 'show' : 'hide'}`}
                  defaultActiveKey="Tasks"
                  animated={false}
                >
                  <Tabs.TabPane tab={<h3 className="tab-title">Tasks</h3>} key="Tasks">
                    {!taskExistsOnMeeting && <Empty />}
                    {taskExistsOnMeeting && (
                      <div className="task-container">
                        <RenderTaskBatch
                          taskBatch={tasksOnThisMeeting}
                          activeView={ApplicationPlanView.Month}
                          showHeader={false}
                        />
                      </div>
                    )}
                  </Tabs.TabPane>
                  <Tabs.TabPane
                    tab={<h3 className="tab-title">Counselor Instructions</h3>}
                    key="Counselor Instructions"
                  >
                    {cm.counselor_instructions ? (
                      // eslint-disable-next-line react/no-danger
                      <div className="instructions" dangerouslySetInnerHTML={{ __html: cm.counselor_instructions }} />
                    ) : (
                      <Empty />
                    )}
                  </Tabs.TabPane>
                  <Tabs.TabPane tab={<h3 className="tab-title">Student Instructions</h3>} key="Student Instructions">
                    {cm.student_instructions ? (
                      // eslint-disable-next-line react/no-danger
                      <div className="instructions" dangerouslySetInnerHTML={{ __html: cm.student_instructions }} />
                    ) : (
                      <Empty />
                    )}
                  </Tabs.TabPane>
                  <Tabs.TabPane tab={<h3 className="tab-title">Notes</h3>} key="Notes">
                    {counselorNotes
                      .filter(cn => cn.counselor_meeting === cm.pk)
                      .map(cn => (
                        <CounselorMeetingNoteForm
                          key={cn.pk}
                          counselorMeetingID={cm.pk}
                          counselorNote={cn}
                          isReadOnly={true}
                        />
                      ))}
                    {!hasNotes && <Empty />}
                    <div className="new-note-container">
                      <Button
                        type="link"
                        className="new-note-btn"
                        onClick={() =>
                          dispatch(
                            showModal({ modal: MODALS.COUNSELOR_MEETING_NOTE, props: { counselorMeetingID: cm.pk } }),
                          )
                        }
                      >
                        Click To Add A New Note...
                      </Button>
                    </div>
                  </Tabs.TabPane>
                </Tabs>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
