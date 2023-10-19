// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { CloseCircleOutlined } from '@ant-design/icons'
import { Button, Tag } from 'antd'
import { AutocompleteCustomValue } from 'components/common/FormItems/AutocompleteCustomValue'
import { flatten, map, values } from 'lodash'
import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getCounselorMeetings, getCounselorMeetingTemplates } from 'store/counseling/counselingSelectors'
import { RootState } from 'store/rootReducer'
import { useReduxDispatch } from 'store/store'
import { CreateMeetingAgendaItem, useCounselorMeetingCtx } from './counselorMeetingContext'
import styles from './styles/CounselorMeetingModal.scss'

const CounselorMeetingAgendaItems = () => {
  const dispatch = useReduxDispatch()

  const context = useCounselorMeetingCtx()

  const counselorMeetings = useSelector(getCounselorMeetings)
  const counselorMeetingTemplates = useSelector(getCounselorMeetingTemplates)

  // We actually store agenda item templates in state since we need to reload them whenever selected meeting
  // template changes
  const agendaItemTemplates = useSelector((state: RootState) => {
    const allAIT = values(state.counseling.agendaItemTemplates)
    // If we are editing a meeting that had a template, we return all AIT. Otherwise we return none
    if (!context.templatePK) return context.editMeetingTemplateID ? allAIT : []
    const selectedRoadmap = state.counseling.counselorMeetingTemplates[context.templatePK]?.roadmap
    if (!selectedRoadmap) return []
    const agendaItemTemplatePKs = flatten(
      map(
        values(state.counseling.counselorMeetingTemplates).filter(m => m.roadmap === selectedRoadmap),
        'agenda_item_templates',
      ),
    )

    // Filter out undefineds so we don't get weird errors
    return agendaItemTemplatePKs.map(pk => state.counseling.agendaItemTemplates[pk]).filter(t => t)
  })
  const agendaItems = useSelector((state: RootState) => {
    if (!context.editMeeting) return []
    const meeting = state.counseling.counselorMeetings[context.editMeeting]
    return meeting.agenda_items.map(pk => state.counseling.agendaItems[pk])
  })
  const { templatePK, setMeetingAgendaItems, meetingAgendaItems, addAgendaItem } = context
  const templateAgendaItems = agendaItemTemplates.filter(ait => ait && ait.counselor_meeting_template === templatePK)
  // Whenever selected template changes, we update our selected agenda items to be the one for the selected template
  useEffect(() => {
    // We don't change agenda items automatically when editing a meeting
    if (!context.editMeeting) {
      context.setAgendaItems(templateAgendaItems.map(t => ({ agendaItemTemplate: t.pk })))
    }
  }, [JSON.stringify(templateAgendaItems), dispatch, setMeetingAgendaItems]) // eslint-disable-line react-hooks/exhaustive-deps

  // Remove an agenda item from meeting
  const removeAgendaItem = (idx: number) => setMeetingAgendaItems(meetingAgendaItems.filter((_, i) => i !== idx))

  const renderMeetingTitleTag = (meetingTitle: string) => {
    if (meetingTitle.length > 0) {
      return <Tag>{meetingTitle}</Tag>
    }
    return null
  }

  // Render a row in our table for a non-custom agenda item
  const renderAgendaItemRow = (agendaItem: CreateMeetingAgendaItem, idx: number) => {
    const existingAgendaItem = agendaItems.find(t => t.pk === agendaItem.agendaItem)
    const agendaItemTemplate = existingAgendaItem?.agenda_item_template
      ? agendaItemTemplates.find(t => t && t.pk === existingAgendaItem.agenda_item_template)
      : agendaItemTemplates.find(t => t && t.pk === agendaItem.agendaItemTemplate)

    const name =
      agendaItem.customAgendaItem || existingAgendaItem?.counselor_title || agendaItemTemplate?.counselor_title || ''

    let meetingTitle = ''
    if (existingAgendaItem) {
      const meetingPK = existingAgendaItem?.counselor_meeting
      meetingTitle = counselorMeetings[meetingPK]?.title
    }
    if (agendaItemTemplate) {
      const meetingPK = agendaItemTemplate?.counselor_meeting_template
      meetingTitle = counselorMeetingTemplates[meetingPK]?.title
    }

    return (
      <div className="agenda-item-row" key={idx}>
        <div className="close">
          <Button
            shape="circle"
            type="link"
            className="removeitem"
            icon={<CloseCircleOutlined />}
            onClick={() => removeAgendaItem(idx)}
          />
        </div>
        <div className="agenda-item">
          {name}
          {renderMeetingTitleTag(meetingTitle)}
        </div>
        <div className="tasks">{agendaItemTemplate ? agendaItemTemplate.pre_meeting_task_templates.length : ''}</div>
      </div>
    )
  }
  const availableAgendaItems = agendaItemTemplates
  return (
    <div className={styles.counselorMeetingAgendaItems}>
      <div className="section-header">
        <h2>Agenda</h2>
        <div className="instructions">Add agenda items below. You will be able to edit tasks on the next page.</div>
      </div>
      <div className="agenda-items-table">
        <div className="table-header">
          <div className="agenda-item">
            <h4>Agenda Item</h4>
          </div>
          <div className="tasks">
            <h4>Tasks</h4>
          </div>
        </div>
        {meetingAgendaItems.map(renderAgendaItemRow)}
        <div className="agenda-item-row add-custom">
          <div className="close" />
          <div className="agenda-item">
            <AutocompleteCustomValue
              options={availableAgendaItems.map(t => ({ label: t.counselor_title, value: t.pk }))}
              onSelect={v => context.addAgendaItem({ agendaItemTemplate: Number(v) })}
              onSelectCustomValue={v => context.addAgendaItem({ customAgendaItem: v })}
            />
          </div>
          <div className="tasks" />
        </div>
      </div>
    </div>
  )
}
export default CounselorMeetingAgendaItems
