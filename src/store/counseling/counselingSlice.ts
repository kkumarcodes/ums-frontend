// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import _, { filter } from 'lodash'
import { FileUpload } from 'store/common/commonTypes'
import {
  CounselingState,
  CounselorMeeting,
  AgendaItem,
  AgendaItemTemplate,
  CounselorMeetingTemplate,
  CounselorNote,
  Roadmap,
  StudentActivity,
  CounselorTimeEntry,
  CounselorTimeCard,
  CounselingHoursGrant,
  StudentCounselingHours,
} from './counselingTypes'

const initialState: CounselingState = {
  counselorMeetings: {},
  counselorMeetingTemplates: {},
  counselorNotes: {},
  counselingFileUploads: {},
  roadmaps: {},
  taskRoadmaps: {},
  studentActivities: {},
  agendaItemTemplates: {},
  agendaItems: {},
  counselorTimeEntries: {},
  counselingHoursGrants: {},
  counselorTimeCards: {},
  studentCounselingHours: {},
}

const counselingSlice = createSlice({
  name: 'counseling',
  initialState,
  reducers: {
    addCounselorMeeting(state, action: PayloadAction<CounselorMeeting>) {
      state.counselorMeetings[action.payload.pk] = action.payload
    },
    addCounselorMeetings(state, action: PayloadAction<Array<CounselorMeeting>>) {
      state.counselorMeetings = {
        ...state.counselorMeetings,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCounselorMeeting(state, action: PayloadAction<{ pk: number }>) {
      delete state.counselorMeetings[action.payload.pk]
    },
    removeCounselorMeetings(state, action: PayloadAction<number[]>) {
      state.counselorMeetings = filter(state.counselorMeetings, cm => !action.payload.includes(cm.pk))
    },
    addCounselorMeetingTemplate(state, action: PayloadAction<CounselorMeetingTemplate>) {
      state.counselorMeetingTemplates[action.payload.pk] = action.payload
    },
    addCounselorMeetingTemplates(state, action: PayloadAction<Array<CounselorMeetingTemplate>>) {
      state.counselorMeetingTemplates = {
        ...state.counselorMeetingTemplates,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addCounselorMeetingAgendaItemTemplates(state, action: PayloadAction<AgendaItemTemplate[]>) {
      state.agendaItemTemplates = {
        ...state.agendaItemTemplates,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addCounselorMeetingAgendaItemTemplate(state, action: PayloadAction<AgendaItemTemplate>) {
      state.agendaItemTemplates[action.payload.pk] = action.payload
    },
    addCounselorMeetingAgendaItems(state, action: PayloadAction<AgendaItem[]>) {
      state.agendaItems = {
        ...state.agendaItems,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addCounselorMeetingAgendaItem(state, action: PayloadAction<AgendaItem>) {
      state.agendaItems[action.payload.pk] = action.payload
    },
    addCounselorNote(state, action: PayloadAction<CounselorNote>) {
      state.counselorNotes[action.payload.pk] = action.payload
    },
    addCounselorNotes(state, action: PayloadAction<Array<CounselorNote>>) {
      state.counselorNotes = {
        ...state.counselorNotes,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCounselorNote(state, action: PayloadAction<{ pk: number }>) {
      delete state.counselorNotes[action.payload.pk]
    },
    // Note that counseling file uploads are keyed on slugs! (not PKs)
    addCounselingFileUpload(state, action: PayloadAction<FileUpload>) {
      state.counselingFileUploads[action.payload.slug] = action.payload
    },
    removeCounselingFileUpload(state, action: PayloadAction<string>) {
      delete state.counselingFileUploads[action.payload]
    },
    addCounselingFileUploads(state, action: PayloadAction<FileUpload[]>) {
      state.counselingFileUploads = {
        ...state.counselingFileUploads,
        ..._.zipObject(_.map(action.payload, 'slug'), action.payload),
      }
    },
    addRoadmaps(state, action: PayloadAction<Roadmap[]>) {
      state.roadmaps = {
        ...state.roadmaps,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addTaskRoadmaps(state, action: PayloadAction<Roadmap[]>) {
      state.taskRoadmaps = {
        ...state.taskRoadmaps,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    addRoadmap(state, action: PayloadAction<Roadmap>) {
      state.roadmaps[action.payload.pk] = action.payload
    },
    addStudentActivity(state, action: PayloadAction<StudentActivity>) {
      state.studentActivities[action.payload.pk] = action.payload
    },
    addStudentActivities(state, action: PayloadAction<Array<StudentActivity>>) {
      state.studentActivities = {
        ...state.studentActivities,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeStudentActivity(state, action: PayloadAction<{ pk: number }>) {
      delete state.studentActivities[action.payload.pk]
    },
    addCounselorTimeEntry(state, action: PayloadAction<CounselorTimeEntry>) {
      state.counselorTimeEntries[action.payload.pk] = action.payload
    },
    addCounselorTimeEntries(state, action: PayloadAction<CounselorTimeEntry[]>) {
      state.counselorTimeEntries = {
        ...state.counselorTimeEntries,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCounselorTimeEntry(state, action: PayloadAction<{ pk: number }>) {
      delete state.counselorTimeEntries[action.payload.pk]
    },
    addCounselorTimeCard(state, action: PayloadAction<CounselorTimeCard>) {
      state.counselorTimeCards[action.payload.pk] = action.payload
    },
    addCounselorTimeCards(state, action: PayloadAction<CounselorTimeCard[]>) {
      state.counselorTimeCards = {
        ...state.counselorTimeCards,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCounselorTimeCard(state, action: PayloadAction<{ pk: number }>) {
      delete state.counselorTimeCards[action.payload.pk]
    },
    addCounselingHoursGrant(state, action: PayloadAction<CounselingHoursGrant>) {
      state.counselingHoursGrants[action.payload.pk] = action.payload
    },
    addCounselingHoursGrants(state, action: PayloadAction<CounselingHoursGrant[]>) {
      state.counselingHoursGrants = {
        ...state.counselingHoursGrants,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
    removeCounselingHoursGrant(state, action: PayloadAction<number>) {
      delete state.counselingHoursGrants[action.payload]
    },
    addStudentCounselingHours(state, action: PayloadAction<StudentCounselingHours[]>) {
      state.studentCounselingHours = {
        ...state.studentCounselingHours,
        ..._.zipObject(_.map(action.payload, 'pk'), action.payload),
      }
    },
  },
})

export const {
  addCounselorMeeting,
  addCounselorMeetings,
  removeCounselorMeeting,
  removeCounselorMeetings,
  addCounselorMeetingTemplate,
  addCounselorMeetingTemplates,
  addCounselorNote,
  addCounselorNotes,
  removeCounselorNote,
  addCounselingFileUpload,
  removeCounselingFileUpload,
  addCounselingFileUploads,
  addRoadmaps,
  addRoadmap,
  addTaskRoadmaps,
  addStudentActivity,
  addStudentActivities,
  removeStudentActivity,
  addCounselorMeetingAgendaItem,
  addCounselorMeetingAgendaItemTemplate,
  addCounselorMeetingAgendaItemTemplates,
  addCounselorMeetingAgendaItems,
  addCounselorTimeEntry,
  addCounselorTimeEntries,
  removeCounselorTimeEntry,
  addCounselorTimeCard,
  addCounselorTimeCards,
  removeCounselorTimeCard,
  addCounselingHoursGrant,
  addCounselingHoursGrants,
  removeCounselingHoursGrant,
  addStudentCounselingHours,
} = counselingSlice.actions

export default counselingSlice.reducer
