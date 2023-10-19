// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { message, Modal, Select, Skeleton } from 'antd'
import { getFullName } from 'components/administrator'
import Loading from 'components/common/Loading'
import { each, find, flatten, map, orderBy, some, values, zipObject } from 'lodash'
import React, { useEffect, useState } from 'react'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import {
  selectCounselorMeetingTemplatesForRoadmap,
  selectRoadmap,
  selectRoadmaps,
} from 'store/counseling/counselingSelectors'
import {
  applyRoadmap,
  ApplyRoadmapMeeting,
  fetchAgendaItemTemplates,
  fetchRoadmaps,
} from 'store/counseling/counselingThunks'
import { selectActiveModal, selectVisibleModal } from 'store/display/displaySelectors'
import { closeModal } from 'store/display/displaySlice'
import { CreateRoadmapProps, MODALS } from 'store/display/displayTypes'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { selectStudent } from 'store/user/usersSelector'
import { RoadmapModalContextProvider, useCreateRoadmapModalCtx } from './RoadmapModalContext'
import RoadmapModalCounselorMeeting from './RoadmapModalCounselorMeeting'
import styles from './styles/RoadmapModal.scss'

const RoadmapModal = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const dispatch = useReduxDispatch()

  const visible = useSelector(selectVisibleModal(MODALS.APPLY_ROADMAP))
  const props = useSelector(selectActiveModal)?.modalProps as CreateRoadmapProps
  const student = useSelector(selectStudent(props?.studentID))

  const roadmaps = orderBy(
    useSelector(selectRoadmaps).filter(r => r.active),
    'title',
  )
  const contextValue = useCreateRoadmapModalCtx()

  const selectedRoadmap = useSelector(selectRoadmap(contextValue.roadmap))

  // All meeting templates for our selected roadmap
  const meetingTemplates = orderBy(
    useSelector(selectCounselorMeetingTemplatesForRoadmap(contextValue.roadmap)).filter(
      m => m.create_when_applying_roadmap,
    ),
    'order',
    'asc',
  )

  // All of the agenda items that can be added to meetings
  const availableAgendaItems = useSelector((state: RootState) => {
    const usedTemplates = flatten(map(values(contextValue.meetings), 'agenda_item_templates'))
    return values(state.counseling.agendaItemTemplates)
      .filter(t => selectedRoadmap?.counselor_meeting_templates.includes(t.counselor_meeting_template))
      .filter(t => t.repeatable || !usedTemplates.includes(t.pk))
  })

  useEffect(() => {
    if (visible) {
      setLoading(true)
      dispatch(fetchRoadmaps()).then(() => setLoading(false))
    }
  }, [dispatch, visible])

  const selectedRoadmapPK = selectedRoadmap?.pk
  useEffect(() => {
    if (visible && selectedRoadmapPK) {
      setLoading(true)
      dispatch(fetchAgendaItemTemplates({ roadmap: selectedRoadmapPK })).then(() => setLoading(false))
    }
  }, [visible, dispatch, selectedRoadmapPK])

  // When the selected roadmap changes, we update our meetings and agenda item selections
  useEffect(() => {
    if (selectedRoadmap) {
      contextValue.setMeetings(
        zipObject(
          map(meetingTemplates, 'pk'),
          meetingTemplates.map(template => ({
            include: true,
            agenda_item_templates: template?.agenda_item_templates || [],
            removed_agenda_item_templates: [],
            custom_agenda_items: [],
          })),
        ),
      )
    }
  }, [selectedRoadmap]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Apply our roadmap! How very fun! */
  const onSubmit = () => {
    if (!selectedRoadmap) return
    const counselorMeetings: ApplyRoadmapMeeting[] = []
    each(contextValue.meetings, (val, key) => {
      if (val.include) {
        counselorMeetings.push({
          counselor_meeting_template: Number(key),
          agenda_item_templates: val.agenda_item_templates,
        })
      }
    })
    setSaving(true)
    dispatch(applyRoadmap({ roadmapID: selectedRoadmap.pk, studentID: props.studentID, counselorMeetings }))
      .then(() => {
        dispatch(closeModal())
        contextValue.setRoadmap(undefined)
      })
      .catch(e => {
        message.warn('Failed to apply roadmap')
      })
      .finally(() => setSaving(false))
  }

  const onDragEnd = (result: DropResult) => {
    // Abort if draggable destination not valid or draggable destination == source column
    if (!result.destination || result.destination?.droppableId === result.source.droppableId) return

    const agendaItemType = result.draggableId.split('_')[0]
    const newMeetingTemplatePK = Number(result.destination.droppableId)
    const oldMeetingTemplatePK = Number(result.source.droppableId)

    if (agendaItemType === 'custom') {
      const agendaItemIdx = Number(result.draggableId.split('_')[1])
      const agendaItem = contextValue.meetings[oldMeetingTemplatePK].custom_agenda_items[agendaItemIdx]
      contextValue.moveCustomAgendaItem(agendaItem, newMeetingTemplatePK, oldMeetingTemplatePK)
    } else {
      const agendaItem = Number(result.draggableId.split('_')[1])
      contextValue.moveAgendaItem(agendaItem, newMeetingTemplatePK, oldMeetingTemplatePK)
    }
  }
  const hasRoadmapApplied = some(student?.roadmaps ?? [], r => {
    const roadmap = find(roadmaps, rm => rm.pk === r)
    return roadmap && !roadmap.repeatable
  })
  const roadmapOptions = hasRoadmapApplied ? roadmaps.filter(r => r.repeatable) : roadmaps

  return (
    <Modal
      width={960}
      className={styles.roadmapModal}
      visible={visible}
      onCancel={() => dispatch(closeModal())}
      okText="Apply Roadmap"
      okButtonProps={{ disabled: !selectedRoadmap || saving }}
      onOk={onSubmit}
    >
      <RoadmapModalContextProvider value={contextValue}>
        {loading && <Skeleton />}
        {saving && (
          <div className="center">
            <Loading message="Saving roadmap..." />
          </div>
        )}
        {!loading && !saving && (
          <>
            <div className="selector">
              <label>Select a roadmap to apply:</label>
              <Select
                value={contextValue.roadmap}
                onChange={contextValue.setRoadmap}
                showSearch
                optionFilterProp="children"
              >
                {roadmapOptions.map(r => (
                  <Select.Option value={r.pk} key={r.slug}>
                    {r.title}
                  </Select.Option>
                ))}
              </Select>
            </div>
            {hasRoadmapApplied && (
              <p className="center help">
                Options for roadmaps are restricted because a roadmap has already been applied to this student. Please
                reach out to an admin if you need to delete a roadmap from a student.
              </p>
            )}
            {selectedRoadmap && (
              <div className="meetings-container">
                <div className="instructions">
                  {meetingTemplates.length > 0 ? (
                    <>
                      <p>
                        Below are all of the meetings that are apart of the {selectedRoadmap.title} roadmap. Use the
                        toggle next to a meeting&apos;s title to control whether or not an instance of the meeting is
                        created. Within each meeting are its agenda items; you can drog and drop agenda items between
                        meetings, or use the X icon to remove an agenda item.
                      </p>
                      <p>
                        You will be able to add, remove, and edit meetings - as well as their agenda items - after
                        applying this roadmap.
                      </p>
                    </>
                  ) : (
                    <p>
                      This roadmap only includes meetings that can be created on an individual basis. Click "Apply
                      Roadmap" to get access to this roadmap's meeting templates when creating meetings for{' '}
                      {getFullName(student)}
                    </p>
                  )}
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="meetings-inner-container">
                    {meetingTemplates.map(t => (
                      <Droppable key={t.pk} droppableId={t.pk.toString()}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={`meeting-droppable ${snapshot.isDraggingOver ? 'drag' : ''}`}
                          >
                            {snapshot.isDraggingOver && (
                              <div className="drag-overlay">
                                <span>Drop to add agenda item to this meeting</span>
                              </div>
                            )}
                            <RoadmapModalCounselorMeeting
                              meetingTemplatePK={t.pk}
                              availableAgendaItems={availableAgendaItems}
                            />
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
              </div>
            )}
          </>
        )}
      </RoadmapModalContextProvider>
    </Modal>
  )
}
export default RoadmapModal
