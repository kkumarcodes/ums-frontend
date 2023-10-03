// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { EditOutlined, MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Col, Popconfirm, Spin, Tabs, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAgendaItemTemplatesForMeetingTemplate } from 'store/counseling/counselingSelectors'
import { fetchAgendaItemTemplates, updateAgendaItemTemplate } from 'store/counseling/counselingThunks'
import { AgendaItemTemplate } from 'store/counseling/counselingTypes'
import { showModal } from 'store/display/displaySlice'
import { MODALS } from 'store/display/displayTypes'
import { useReduxDispatch } from 'store/store'
import { fetchAllTaskTemplates } from 'store/task/tasksThunks'
import styles from './styles/CounselorMeetingTemplateExpandedRow.scss'
import { RenderTaskList } from './RenderTaskList'

const { TabPane } = Tabs

/**@meetingTemplateID is the PK for the the CounselorMeetingTemplate */

type Props = {
  meetingTemplateID: number
}

/**Componet that renders the expanded row for each CounselorMeetingTemplate on the CounselorMeetingTemplateTable */

export const CounselorMeetingTemplateExpandedRow = ({ meetingTemplateID }: Props) => {
  const dispatch = useReduxDispatch()
  const agendaItems = useSelector(selectAgendaItemTemplatesForMeetingTemplate(meetingTemplateID))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      dispatch(fetchAgendaItemTemplates({ counselor_meeting_template: meetingTemplateID })),
      dispatch(fetchAllTaskTemplates()),
    ]).finally(() => setLoading(false))
  }, [dispatch, meetingTemplateID])

  /**Event handler for adding or editing an AgendaItemTemplate to a CounselorMeetingTemplate*/
  const handleAgendaItem = (agendaItem?: AgendaItemTemplate) => {
    !agendaItem
      ? dispatch(
          showModal({
            props: { meetingTemplateID },
            modal: MODALS.ADD_EDIT_AGENDA_ITEM_TEMPLATE,
          }),
        )
      : dispatch(
          showModal({
            props: { meetingTemplateID: meetingTemplateID, agendaItemTemplateID: agendaItem.pk },
            modal: MODALS.ADD_EDIT_AGENDA_ITEM_TEMPLATE,
          }),
        )
  }

  /**Event handler for adding a TaskTemplate to an AgendaItemTemplate */
  const handleAddTaskTemplate = (agendaItem: AgendaItemTemplate) => {
    dispatch(
      showModal({
        props: { agendaItemTemplateID: agendaItem.pk },
        modal: MODALS.TASK_TEMPLATE_MODAL,
      }),
    )
  }

  return (
    <div>
      <Tabs tabPosition="left">
        <TabPane
          key={meetingTemplateID.toString()}
          tab={
            <div className={styles.agendaItemTab}>
              <PlusCircleOutlined
                className="add-icon"
                onClick={e => {
                  e.stopPropagation()
                  handleAgendaItem()
                }}
              />
              <h4 className={styles.agendaHeader}>Agenda Items</h4>
            </div>
          }
        >
          <h5 className={styles.taskHeader}>Agenda Content</h5>
          <p>Select an Agenda Item from the list on the left to view each item&apos;s Tasks. </p>
        </TabPane>
        {agendaItems.map(agendaItem => {
          return (
            <TabPane
              tab={
                <div className={styles.existingAgendaTab}>
                  <EditOutlined
                    className="edit-icon"
                    onClick={e => {
                      e.stopPropagation()
                      handleAgendaItem(agendaItem)
                    }}
                  />
                  <span className="agenda-title-link">{agendaItem.counselor_title}</span>
                </div>
              }
              key={agendaItem.slug}
            >
              <h5 className={styles.taskHeader}>Agenda Content</h5>
              <div className={styles.agendaDataContainer}>
                <Col className="counselor-instruction-column" span={12}>
                  <h3 className="column-title-headers">Counselor Instructions</h3>
                  <p className="counselor-instruction-text">
                    {agendaItem?.counselor_instructions || <i>No Instructions</i>}
                  </p>
                </Col>
                <Col className="task-item-column" span={12}>
                  <h3 className="column-title-headers">Task Item Templates</h3>
                  <h3 className="before-and-after">Before the Meeting:</h3>
                  {loading && <Spin size="small" />}
                  {!loading &&
                    agendaItem.pre_meeting_task_templates.map(taskID => (
                      <RenderTaskList taskID={taskID} agendaItem={agendaItem} fieldValue={'pre'} />
                    ))}
                  {!loading && !agendaItem.pre_meeting_task_templates.length && (
                    <p>
                      <i className="no-task-text">No Tasks</i>
                    </p>
                  )}
                  <h3 className="before-and-after">After the Meeting:</h3>
                  {loading && <Spin size="small" />}
                  {!loading &&
                    agendaItem.post_meeting_task_templates.map(taskID => (
                      <RenderTaskList taskID={taskID} agendaItem={agendaItem} fieldValue={'post'} />
                    ))}
                  {!loading && !agendaItem.post_meeting_task_templates.length && (
                    <p>
                      <i className="no-task-text">No Tasks</i>
                    </p>
                  )}
                  <Button className="add-task-button" type="primary" onClick={() => handleAddTaskTemplate(agendaItem)}>
                    Add Task Template
                  </Button>
                </Col>
              </div>
            </TabPane>
          )
        })}
      </Tabs>
    </div>
  )
}
export default CounselorMeetingTemplateExpandedRow
