// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createCtx } from 'components/administrator'
import { useState } from 'react'
import { ApplyRoadmapMeeting } from 'store/counseling/counselingThunks'

export type ApplyRoadmapModalMeeting = {
  include: boolean // Whether or not meeting is included
  agenda_item_templates: number[] // Agenda item templates that should be used to create agenda items for this meeting
  // Counselors can choose NOT to include an agenda item; we add those to this list to track them since
  // they're still displayed with a strikethrough
  removed_agenda_item_templates: number[]
  custom_agenda_items: string[]
}

export function useCreateRoadmapModalCtx() {
  const [meetings, setMeetings] = useState<{ [meetingTemplatePK: number]: ApplyRoadmapModalMeeting }>({})
  const [roadmap, setRoadmap] = useState<number>()

  // Helper method to move an agenda item from one meeting to another
  const moveAgendaItem = (agendaItemPK: number, newMeetingPK: number, oldMeetingPK: number) => {
    // Check to ensure both meetings are valid
    if (!(meetings.hasOwnProperty(newMeetingPK) && meetings.hasOwnProperty(oldMeetingPK))) {
      console.warn(`Attempting to move agenda item between invalid meetings: ${oldMeetingPK} to ${newMeetingPK}`)
      return
    }
    setMeetings({
      ...meetings,
      [oldMeetingPK]: {
        ...meetings[oldMeetingPK],
        agenda_item_templates: meetings[oldMeetingPK].agenda_item_templates.filter(i => i !== agendaItemPK),
      },
      [newMeetingPK]: {
        ...meetings[newMeetingPK],
        agenda_item_templates: [...meetings[newMeetingPK].agenda_item_templates, agendaItemPK],
      },
    })
  }

  // Helper for moving a custom agenda item
  const moveCustomAgendaItem = (customAgendaItem: string, newMeetingPK: number, oldMeetingPK: number) => {
    // Check to ensure both meetings are valid
    if (!(meetings.hasOwnProperty(newMeetingPK) && meetings.hasOwnProperty(oldMeetingPK))) {
      console.warn(`Attempting to move agenda item between invalid meetings: ${oldMeetingPK} to ${newMeetingPK}`)
      return
    }
    setMeetings({
      ...meetings,
      [oldMeetingPK]: {
        ...meetings[oldMeetingPK],
        custom_agenda_items: meetings[oldMeetingPK].custom_agenda_items.filter(i => i !== customAgendaItem),
      },
      [newMeetingPK]: {
        ...meetings[newMeetingPK],
        custom_agenda_items: [...meetings[newMeetingPK].custom_agenda_items, customAgendaItem],
      },
    })
  }

  return {
    meetings,
    setMeetings,
    roadmap, // PK of roadmap being applied
    setRoadmap,
    moveAgendaItem,
    moveCustomAgendaItem,
  }
}

export const [useRoadmapModalCtx, RoadmapModalContextProvider] = createCtx<
  ReturnType<typeof useCreateRoadmapModalCtx>
>()
