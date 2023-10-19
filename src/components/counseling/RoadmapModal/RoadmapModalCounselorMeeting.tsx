// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Skeleton, Switch } from 'antd'
import { each } from 'lodash'
import React from 'react'
import { Draggable } from 'react-beautiful-dnd'
import { useSelector } from 'react-redux'
import { AgendaItemTemplate, CounselorMeetingTemplate } from 'store/counseling/counselingTypes'
import { RootState } from 'store/rootReducer'
import RoadmapModalAgendaItem from './RoadmapModalAgendaItem'
import { useRoadmapModalCtx } from './RoadmapModalContext'
import styles from './styles/RoadmapModal.scss'

type Props = {
  meetingTemplatePK: number // The PK of the meeting we're supposed to render
  // Agenda items that can be added to this counselor meeting
  availableAgendaItems: AgendaItemTemplate[]
}

const RoadmapModalCounselorMeeting = ({ meetingTemplatePK, availableAgendaItems }: Props) => {
  const context = useRoadmapModalCtx()

  const contextMeeting = context.meetings[meetingTemplatePK]
  const counselorMeetingTemplate = useSelector(
    (state: RootState) => state.counseling.counselorMeetingTemplates[meetingTemplatePK],
  )
  const agendaItemTemplates = useSelector((state: RootState) =>
    contextMeeting
      ? [
          ...contextMeeting.agenda_item_templates.map(t => state.counseling.agendaItemTemplates[t]),
          ...contextMeeting.removed_agenda_item_templates.map(t => state.counseling.agendaItemTemplates[t]),
        ]
      : [],
  )

  const availableMeetings = useSelector((state: RootState) => {
    const meetings: CounselorMeetingTemplate[] = []
    each(context.meetings, (val, key) => {
      if (val.include && Number(key) !== meetingTemplatePK) {
        meetings.push(state.counseling.counselorMeetingTemplates[Number(key)])
      }
    })
    return meetings
  })

  // Set whether an agenda item is included or excluded
  const onSetIncludeAgendaItem = (include: boolean, aitPK: number) => {
    const idx = contextMeeting.agenda_item_templates.findIndex(a => a === aitPK)
    let updatedAIT: number[] = []
    let excludeAIT: number[] = []
    if (include && idx === -1) {
      updatedAIT = [...contextMeeting.agenda_item_templates, aitPK]
      excludeAIT = contextMeeting.removed_agenda_item_templates.filter(t => t !== aitPK)
    } else {
      updatedAIT = contextMeeting.agenda_item_templates.filter(a => a !== aitPK)
      excludeAIT = [aitPK, ...contextMeeting.removed_agenda_item_templates]
    }
    context.setMeetings({
      ...context.meetings,
      [meetingTemplatePK]: {
        ...contextMeeting,
        agenda_item_templates: updatedAIT,
        removed_agenda_item_templates: excludeAIT,
      },
    })
  }

  // An agenda item gets moved from one meeting to another
  const onMoveAgendaItem = (agendaItemTemplate: number, meetingTemplate: number) =>
    context.moveAgendaItem(agendaItemTemplate, meetingTemplate, meetingTemplatePK)

  // Toggle contextMeeting.include (whether or not a meeting will be created from our meeting template when
  // roadmap is applied)
  const toggleIncludeMeeting = () => {
    context.setMeetings({
      ...context.meetings,
      [meetingTemplatePK]: { ...contextMeeting, include: !contextMeeting.include },
    })
  }

  const removeCustomAgendaItem = (val: string) => {
    context.setMeetings({
      ...context.meetings,
      [meetingTemplatePK]: {
        ...contextMeeting,
        custom_agenda_items: contextMeeting.custom_agenda_items.filter(i => i !== val),
      },
    })
  }

  const addCustomAgendaItem = (val: string) => {
    context.setMeetings({
      ...context.meetings,
      [meetingTemplatePK]: {
        ...contextMeeting,
        custom_agenda_items: [...contextMeeting.custom_agenda_items, val],
      },
    })
  }

  if (!contextMeeting) return <Skeleton loading={true} />

  return (
    <div
      className={`roadmap-counselor-meeting ${styles.roadmapModalCounselorMeeting} ${
        contextMeeting.include ? '' : styles.roadmapModalCounselorMeetingExcluded
      }`}
    >
      <div className="title">
        <Switch size="small" onChange={toggleIncludeMeeting} checked={contextMeeting.include} />
        <h3 className="title-inner">{counselorMeetingTemplate.title}</h3>
      </div>
      <div className="agenda-items-container">
        {agendaItemTemplates.map((t, i) => (
          <Draggable index={i} key={t.pk.toString()} draggableId={`template_${t.pk}`}>
            {(provided, snapshot) => (
              <RoadmapModalAgendaItem
                agendaItemTemplate={t}
                provided={provided}
                innerRef={provided?.innerRef}
                include={!contextMeeting.removed_agenda_item_templates.includes(t.pk)}
                onSetInclude={v => onSetIncludeAgendaItem(v, t.pk)}
                availableMeetings={availableMeetings}
                onMoveAgendaItem={ai => onMoveAgendaItem(t.pk, ai)}
                isDragging={snapshot.isDragging}
              />
            )}
          </Draggable>
        ))}
        {contextMeeting.custom_agenda_items.map((t, i) => (
          <Draggable index={i} key={i} draggableId={`custom_${i}`}>
            {(provided, snapshot) => (
              <RoadmapModalAgendaItem
                customAgendaItem={t}
                provided={provided}
                innerRef={provided?.innerRef}
                include={true}
                onSetInclude={_ => removeCustomAgendaItem(t)}
                availableMeetings={availableMeetings}
                onMoveAgendaItem={meetingTemplate =>
                  context.moveCustomAgendaItem(t, meetingTemplate, meetingTemplatePK)
                }
                isDragging={snapshot.isDragging}
              />
            )}
          </Draggable>
        ))}
        {/* <div className="custom-agenda-item-container">
          {availableAgendaItems && (
            <AutcompleteCustomValue
              onSelectCustomValue={addCustomAgendaItem}
              onSelect={pk => onSetIncludeAgendaItem(true, Number(pk))}
              options={availableAgendaItems.map(ai => ({ label: ai.counselor_title, value: ai.pk }))}
              placeholder="Add an additional agenda item..."
              filterOption={(input, option) =>
                Boolean(option?.label && option.label.toString().toLowerCase().includes(input.toLowerCase()))
              }
            />
          )}
        </div> */}
      </div>
    </div>
  )
}
export default RoadmapModalCounselorMeeting
