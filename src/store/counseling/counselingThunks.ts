// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Dispatch } from '@reduxjs/toolkit'
import { flatten, map, values } from 'lodash'
import moment from 'moment'
import API from 'store/api'
import { FileUpload, Platform } from 'store/common/commonTypes'
import errorHandler from 'store/errorHandler'
import { RootState } from 'store/rootReducer'
import { ReduxDispatch } from 'store/store'
import { addTasks, removeTasks } from 'store/task/tasksSlice'
import { BackendTask, extractTask, fetchTasksForStudent } from 'store/task/tasksThunks'
import { IsApplying } from 'store/university/universityTypes'
import { addStudent } from 'store/user/usersSlice'
import { fetchStudent } from 'store/user/usersThunks'
import { Student, UserType } from 'store/user/usersTypes'
import {
  addCounselingFileUpload,
  addCounselingFileUploads,
  addCounselingHoursGrant,
  addCounselingHoursGrants,
  addCounselorMeeting,
  addCounselorMeetingAgendaItems,
  addCounselorMeetingAgendaItemTemplate,
  addCounselorMeetingAgendaItemTemplates,
  addCounselorMeetings,
  addCounselorMeetingTemplate,
  addCounselorMeetingTemplates,
  addCounselorNote,
  addCounselorNotes,
  addCounselorTimeCard,
  addCounselorTimeCards,
  addCounselorTimeEntries,
  addCounselorTimeEntry,
  addRoadmap,
  addRoadmaps,
  addStudentActivities,
  addStudentActivity,
  addStudentCounselingHours,
  removeCounselingFileUpload,
  removeCounselingHoursGrant,
  removeCounselorMeeting,
  removeCounselorMeetings,
  removeCounselorNote,
  removeCounselorTimeCard,
  removeCounselorTimeEntry,
  removeStudentActivity,
  addTaskRoadmaps,
} from './counselingSlice'
import {
  AgendaItem,
  AgendaItemTemplate,
  CounselingHoursGrant,
  CounselorMeeting,
  CounselorMeetingTemplate,
  CounselorNote,
  CounselorTimeCard,
  CounselorTimeEntry,
  Roadmap,
  StudentActivity,
  StudentCounselingHours,
} from './counselingTypes'

const COUNSELING_HOURS_GRANT_ENDPOINT = (pk?: number) =>
  pk ? `/counseling/counseling-hours-grants/${pk}/` : '/counseling/counseling-hours-grants/'

const STUDENT_COUNSELING_HOURS_ENDPOINT = (pk?: number) =>
  pk ? `/counseling/counseling-hours-grants/${pk}/` : '/counseling/counseling-hours-grants/'
const COUNSELOR_MEETING_ENDPOINT = (pk?: number | string) =>
  pk ? `/counseling/counselor-meetings/${pk}/` : '/counseling/counselor-meetings/'

const SEND_COUNSELOR_MEETING_NOTES_ENDPOINT = (pk: number) => `${COUNSELOR_MEETING_ENDPOINT(pk)}send-notes-message/`

const COUNSELOR_MEETING_TEMPLATE_ENDPOINT = (pk?: number | string) =>
  pk ? `/counseling/counselor-meeting-templates/${pk}/` : '/counseling/counselor-meeting-templates/'

const COUNSELOR_NOTE_ENDPOINT = (pk?: number | string) =>
  pk ? `/counseling/counselor-notes/${pk}/` : '/counseling/counselor-notes/'

const NON_MEETING_NOTE_TITLE_ENDPOINT = '/counseling/counselor-notes/update-note-title/'

const COUNSELOR_FILE_UPLOAD_ENDPOINT = (slug?: string) =>
  slug ? `/cw/upload-list-update/${slug}/` : '/cw/upload-list-update/'

const COUNSELOR_ROADMAP_ENDPOINT = (pk?: number) => (pk ? `/counseling/roadmaps/${pk}/` : '/counseling/roadmaps/')
const APPLY_ROADMAP_ENDPOINT = (roadmapPK: number) => `${COUNSELOR_ROADMAP_ENDPOINT(roadmapPK)}apply-roadmap/`
const UNAPPLY_ROADMAP_ENDPOINT = (roadmapPK: number) => `${COUNSELOR_ROADMAP_ENDPOINT(roadmapPK)}unapply-roadmap/`
const TASK_ROADMAP_ENDPOINT = () => `${COUNSELOR_ROADMAP_ENDPOINT()}task_roadmap/`

const STUDENT_ACTIVITY_ENDPOINT = (pk?: number) =>
  pk ? `/counseling/student-activity/${pk}/` : `/counseling/student-activity/`

const AGENDA_ITEM_TEMPLATES_ENDPOINT = (pk?: number) =>
  pk ? `/counseling/agenda-item-templates/${pk}/` : '/counseling/agenda-item-templates/'

const AGENDA_ITEMS_ENDPOINT = (counselorMeetingID?: number) =>
  counselorMeetingID ? `/counseling/agenda-items/?counselor_meeting=${counselorMeetingID}` : '/counseling/agenda-items/'

const COUNSELOR_TIME_CARDS = (pk?: number) =>
  pk ? `/counseling/counselor-time-card/${pk}/` : '/counseling/counselor-time-card/'

const COUNSELOR_TIME_ENTRIES = (pk?: number) =>
  pk ? `/counseling/counselor-time-entry/${pk}/` : '/counseling/counselor-time-entry/'

const APPLYING_STUDENTS = (pk: number) => `/university/universities/${pk}/applying-students/`

// Helper function to turn decimal strings into numbers
const mapCounselorTimeCard = (d: CounselorTimeCard) => ({
  ...d,
  total: Number(d.total),
  total_hours: Number(d.total_hours),
})
export type CreateCounselorTimeCardParams = {
  counselors: number[]
  start: string
  end: string
}
// Create one or more time cards
export const createCounselorTimeCards = (postData: CreateCounselorTimeCardParams) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorTimeCard[] } = await API.post(COUNSELOR_TIME_CARDS(), postData)
    const mappedData: CounselorTimeCard[] = data.map(mapCounselorTimeCard)
    dispatch(addCounselorTimeCards(mappedData))
    return mappedData
  } catch (err) {
    throw errorHandler(err)
  }
}

export type ApplyingStudentsList = {
  [IsApplying.Yes]: number[]
  [IsApplying.No]: number[]
  [IsApplying.Maybe]: number[]
}

export const fetchApplyingStudents = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: ApplyingStudentsList } = await API.get(APPLYING_STUDENTS(pk))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export type FetchCounselorTimeCardParams = {
  counselor?: number
  start?: string // date
  end?: string // date
}
export const fetchCounselorTimeCards = (filter?: FetchCounselorTimeCardParams) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorTimeCard[] } = await API.get(COUNSELOR_TIME_CARDS(), { params: filter })
    const mappedData: CounselorTimeCard[] = data.map(mapCounselorTimeCard)
    dispatch(addCounselorTimeCards(mappedData))
    return mappedData
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Approve a CounselorTimeCard, either as  */
export const approveTimeCard = (pk: number, note?: string) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorTimeCard } = await API.post(`${COUNSELOR_TIME_CARDS(pk)}approve/`, { note })
    const mappedData = mapCounselorTimeCard(data)
    dispatch(addCounselorTimeCard(mappedData))
    return mappedData
  } catch (err) {
    throw errorHandler(err)
  }
}

// Fetch a single CounselorTime Card
export const fetchCounselorTimeCard = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorTimeCard } = await API.get(COUNSELOR_TIME_CARDS(pk))
    const mappedData = mapCounselorTimeCard(data)
    dispatch(addCounselorTimeCard(mappedData))
    return mappedData
  } catch (err) {
    throw errorHandler(err)
  }
}

export const deleteCounselorTimeCard = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(COUNSELOR_TIME_CARDS(pk))
    dispatch(removeCounselorTimeCard({ pk }))
    return true
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Fetch all CounselorTimeEntry objects from the backend. Supports some fancy filtering */
export type FetchCounselorTimeEntryParams = {
  student?: number
  counselor?: number
  start?: string // date
  end?: string // date
  counselor_time_card?: number
  paygo?: boolean
  paid?: string
}
export const fetchCounselorTimeEntries = (filter?: FetchCounselorTimeEntryParams) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorTimeEntry[] } = await API.get(COUNSELOR_TIME_ENTRIES(), { params: filter })
    const mappedData: CounselorTimeEntry[] = data.map(d => ({ ...d, hours: Number(d.hours) }))
    dispatch(addCounselorTimeEntries(mappedData))
    return mappedData
  } catch (err) {
    throw errorHandler(err)
  }
}

export const createCounselorTimeEntry = (timeEntry: Partial<CounselorTimeEntry>) => async (dispatch: ReduxDispatch) => {
  try {
    const { data }: { data: CounselorTimeEntry } = await API.post(COUNSELOR_TIME_ENTRIES(), timeEntry)
    data.hours = Number(data.hours)
    dispatch(addCounselorTimeEntry(data))
    // Update time card to ensure hours/total are correct
    if (data.counselor_time_card) {
      await dispatch(fetchCounselorTimeCard(data.counselor_time_card))
    }
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export const updateCounselorTimeEntry =
  (timeEntry: Omit<Partial<CounselorTimeEntry>, 'pk'> & { pk: number }) => async (dispatch: ReduxDispatch) => {
    try {
      const { data }: { data: CounselorTimeEntry } = await API.patch(COUNSELOR_TIME_ENTRIES(timeEntry.pk), timeEntry)
      data.hours = Number(data.hours)
      dispatch(addCounselorTimeEntry(data))
      // Re-fetch time ards for counselor to make sure their totals are correct
      if (data.counselor) {
        await dispatch(fetchCounselorTimeCards({ counselor: data.counselor }))
      }
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

export const deleteCounselorTimeEntry = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(COUNSELOR_TIME_ENTRIES(pk))
    dispatch(removeCounselorTimeEntry({ pk }))
    return true
  } catch (err) {
    throw errorHandler(err)
  }
}

/** Fetch all of the agenda item templates (which include nested task templates) for a given meeting template */
type FetchAgendaItemTemplatParams = {
  counselor_meeting_template?: number
  roadmap?: number
  student?: number
}
export const fetchAgendaItemTemplates = (filterParams: FetchAgendaItemTemplatParams) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: AgendaItemTemplate[] } = await API.get(AGENDA_ITEM_TEMPLATES_ENDPOINT(), {
      params: filterParams,
    })
    dispatch(addCounselorMeetingAgendaItemTemplates(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Creates new Agenda Item Template
 * @param postData is what becomes an Agenda Item Template.
 * @returns
 */
export const createAgendaItemTemplate = (postData: Partial<AgendaItemTemplate>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: AgendaItemTemplate } = await API.post(AGENDA_ITEM_TEMPLATES_ENDPOINT(), postData)
    dispatch(addCounselorMeetingAgendaItemTemplate(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Edits an existing Agenda Item Template
 * @param agendaItemTemplateID used to identify the AIT to be edited.
 * @param postData is sent to the BE and updates the AIT entry.
 * @returns
 */
export const updateAgendaItemTemplate =
  (agendaItemTemplateID: number, postData: Partial<AgendaItemTemplate>) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: AgendaItemTemplate } = await API.patch(
        AGENDA_ITEM_TEMPLATES_ENDPOINT(agendaItemTemplateID),
        postData,
      )
      dispatch(addCounselorMeetingAgendaItemTemplate(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/**
 * Fetch a counselor note, identified by @param counselorNoteID
 */
export const fetchCounselorNote = (counselorNoteID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorNote } = await API.get(COUNSELOR_NOTE_ENDPOINT(counselorNoteID))
    dispatch(addCounselorNote(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

type CounselorNoteFilter = {
  student?: number
  counselor?: number
}

/**
 * Fetch all counselor notes
 */
export const fetchCounselorNotes = (filter?: CounselorNoteFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorNote[] } = await API.get(COUNSELOR_NOTE_ENDPOINT(), { params: filter })
    dispatch(addCounselorNotes(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a counselor note: @param newCounselorNote
 */
export const createCounselorNote = (newCounselorNote: Partial<CounselorNote>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorNote } = await API.post(COUNSELOR_NOTE_ENDPOINT(), newCounselorNote)
    dispatch(addCounselorNote(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a counselor note identified by @param counselorNoteID with payload @param updatedCounselorNote
 */
export const updateCounselorNote =
  (counselorNoteID: number, updatedCounselorNote: Partial<CounselorNote>) => async (dispatch: Dispatch) => {
    // Not sure why, but need to be explicit regarding content-type
    try {
      const { data }: { data: CounselorNote } = await API.patch(
        COUNSELOR_NOTE_ENDPOINT(counselorNoteID),
        updatedCounselorNote,
      )
      dispatch(addCounselorNote(data))
      return data
    } catch (err) {
      return errorHandler(err)
    }
  }

type UpdateNonMeetingNoteTitleParams = {
  student: number
  note_date: string // YYYY-MM-DD
}
/**
 * Bulk update @param note_title on all non-meeting counselor notes for @param student {PK} on @param note_date
 */
export const updateNonMeetingNoteTitle =
  (note_title: string, params: UpdateNonMeetingNoteTitleParams) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: CounselorNote[] } = await API.patch(
        NON_MEETING_NOTE_TITLE_ENDPOINT,
        { note_title },
        { params },
      )
      dispatch(addCounselorNotes(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/**
 * Delete counselor note with @param pk
 */
export const deleteCounselorNote = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const deletedPK: number = await API.delete(COUNSELOR_NOTE_ENDPOINT(pk))
    dispatch(removeCounselorNote({ pk }))
    return deletedPK
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a counselor meeting, identified by @param counselorMeetingID
 */
export const fetchCounselorMeeting = (counselorMeetingID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorMeeting } = await API.get(COUNSELOR_MEETING_ENDPOINT(counselorMeetingID))
    dispatch(addCounselorMeeting(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

export type FetchCounselorMeetingFilter = {
  start?: string // date not DATETIME
  end?: string // date not DATETIME
  student?: number
  counselor?: number
  dontFetchNotes?: boolean
}

/**
 * Fetch all counselor meetings
 */
export const fetchCounselorMeetings = (filter?: FetchCounselorMeetingFilter) => async (dispatch: ReduxDispatch) => {
  try {
    const { data }: { data: CounselorMeeting[] } = await API.get(COUNSELOR_MEETING_ENDPOINT(), { params: filter })
    dispatch(addCounselorMeetings(data))
    if (!filter?.dontFetchNotes) {
      dispatch(fetchCounselorNotes({ student: filter?.student, counselor: filter?.counselor }))
    }
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// Send notes for counselor meeting. Make sure that CounselorMeeting object has already been updated
// with correct note message and subject!
export const sendCounselorMeetingNotes =
  (pk: number, send_to_student = true, send_to_parent = true, link_schedule_meeting_pk?: number) =>
  async (dispatch: ReduxDispatch, getState: () => RootState) => {
    try {
      const { data }: { data: CounselorMeeting } = await API.post(SEND_COUNSELOR_MEETING_NOTES_ENDPOINT(pk), {
        send_to_student,
        send_to_parent,
        link_schedule_meeting_pk,
      })
      if (send_to_student || send_to_parent) {
        const counselorMeeting = getState().counseling.counselorMeetings[pk]
        dispatch(addCounselorMeeting({ ...counselorMeeting, notes_message_last_sent: moment().toISOString() }))
      }
      // Need to also refresh the meeting we include a link to schedule (if such a link was indeed included)
      // since its student_schedulable field should be updated
      if (link_schedule_meeting_pk) await dispatch(fetchCounselorMeeting(link_schedule_meeting_pk))
      dispatch(addCounselorMeeting(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/**
 * Create a counselor meeting: @param newCounselorMeeting
 */
export interface PostCounselorMeeting extends CounselorMeeting {
  agenda_item_templates?: number[]
  custom_agenda_items?: string[]
  send_notification?: boolean
}
type CreateCounselingMeetingResponse = {
  meeting: CounselorMeeting
  tasks: BackendTask[]
  agenda_items: AgendaItem[]
}
export const createCounselorMeeting =
  (newCounselorMeeting: Partial<PostCounselorMeeting>) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: CreateCounselingMeetingResponse } = await API.post(
        COUNSELOR_MEETING_ENDPOINT(),
        newCounselorMeeting,
      )
      dispatch(addCounselorMeeting(data.meeting))
      dispatch(addTasks(data.tasks.map(t => extractTask(t, dispatch))))
      dispatch(addCounselorMeetingAgendaItems(data.agenda_items))
      return data.meeting
    } catch (err) {
      return errorHandler(err)
    }
  }

/**
 * Update a counselor meeting identified by @param counselorMeetingID with payload @param updatedCounselorMeeting
 */
export const updateCounselorMeeting =
  (
    counselorMeetingID: number,
    updatedCounselorMeeting: Partial<CounselorMeeting> & { send_notification?: boolean },
    updateTasksAndAgendaItems = true,
  ) =>
  async (dispatch: ReduxDispatch, getState: () => RootState) => {
    try {
      const { data }: { data: CreateCounselingMeetingResponse } = await API.patch(
        COUNSELOR_MEETING_ENDPOINT(counselorMeetingID),
        updatedCounselorMeeting,
      )
      dispatch(addCounselorMeeting(data.meeting))
      if (updateTasksAndAgendaItems) {
        dispatch(addTasks(data.tasks.map(t => extractTask(t, dispatch))))
        dispatch(addCounselorMeetingAgendaItems(data.agenda_items))
      }
      // Non-blocking request to re-fetch tasks if meeting is being scheduled/rescheduled, so task list remains in sync
      // Note: We only refetch task if the activeUser is a student (i.e. tasks were automatically scheduled/rescheduled)
      if (
        updatedCounselorMeeting.start &&
        counselorMeetingID &&
        getState().user.activeUser?.userType === UserType.Student
      ) {
        const counselorMeeting = getState().counseling.counselorMeetings[counselorMeetingID]
        dispatch(fetchTasksForStudent(counselorMeeting.student))
      }
      // Non-blocking request to re-fetch the student that meeting is for so that next_counselor_meeting is correct
      dispatch(fetchStudent(data.meeting.student, Platform.CAP))
      return data.meeting
    } catch (err) {
      return errorHandler(err)
    }
  }

/**
 * Delete counselor meeting with @param pk
 */
export const deleteCounselorMeeting = (pk: number) => async (dispatch: ReduxDispatch, getState: () => RootState) => {
  try {
    const meeting = getState().counseling.counselorMeetings[pk]
    const deletedPK: number = await API.delete(COUNSELOR_MEETING_ENDPOINT(pk))
    dispatch(removeCounselorMeeting({ pk }))
    // Non-blocking request to re-fetch the student that meeting is for so that next_counselor_meeting is correct
    if (meeting) dispatch(fetchStudent(meeting.student, Platform.CAP))

    return deletedPK
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch a counselor meeting template, identified by @param counselorMeetingTemplateID
 */
export const fetchCounselorMeetingTemplate = (counselorMeetingTemplateID: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorMeetingTemplate } = await API.get(
      COUNSELOR_MEETING_TEMPLATE_ENDPOINT(counselorMeetingTemplateID),
    )
    dispatch(addCounselorMeetingTemplate(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// Fetch agenda items for a specific counselor meeting, or for all of the current user's meetings
export const fetchAgendaItems = (counselorMeetingID?: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: AgendaItem[] } = await API.get(AGENDA_ITEMS_ENDPOINT(counselorMeetingID))
    dispatch(addCounselorMeetingAgendaItems(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all counselor meeting templates
 */
export const fetchCounselorMeetingTemplates = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselorMeetingTemplate[] } = await API.get(COUNSELOR_MEETING_TEMPLATE_ENDPOINT())
    dispatch(addCounselorMeetingTemplates(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Creates new CMT
 * @param postData is what becomes a CMT.
 * @returns
 */
export const createCounselorMeetingTemplate =
  (postData: Partial<CounselorMeetingTemplate>) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: CounselorMeetingTemplate } = await API.post(
        COUNSELOR_MEETING_TEMPLATE_ENDPOINT(),
        postData,
      )
      dispatch(addCounselorMeetingTemplate(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/**
 * Edits a CMT
 * @param meetingID is used to identify the CMT to be edited.
 * @param postData is sent to the BE and updates the CMT entry.
 * @returns
 */
export const updateCounselorMeetingTemplate =
  (meetingID: number, postData: Partial<CounselorMeetingTemplate>) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: CounselorMeetingTemplate } = await API.patch(
        COUNSELOR_MEETING_TEMPLATE_ENDPOINT(meetingID),
        postData,
      )
      dispatch(addCounselorMeetingTemplate(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/** Update a FileUPload that's associated with a student through counseling_student
 *  We require counselor_student to enforce that we're actually updating a CounselingFileUpload
 *  and not one of those ~other~ file uploads
 */
type CounselingFileUploadUpdateParam = Partial<FileUpload> & { counseling_student: number; slug: string }
export const updateCounselingFileUpload =
  (updateData: CounselingFileUploadUpdateParam) => async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      if (!updateData.counseling_student) {
        throw new Error('Attempting to update file upload with no counseling student!')
      }
      const { data }: { data: FileUpload } = await API.patch(
        COUNSELOR_FILE_UPLOAD_ENDPOINT(updateData.slug),
        updateData,
      )
      dispatch(addCounselingFileUpload(data))
      // Update student to ensure this file upload is associated with them within store
      const oldStudent = getState().user.students[updateData.counseling_student]
      if (oldStudent) {
        dispatch(
          addStudent({
            ...oldStudent,
            counseling_file_uploads: [...(oldStudent.counseling_file_uploads || []), updateData.slug],
          }),
        )
      }
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/** Delete a file upload. If counseling_student ID is provided, then we remove this file upload from that student's
 * list of counseling_file_uploads
 */
export const deleteFileUpload =
  (fileUploadSlug: string, counselingStudent?: number) => async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      await API.delete(COUNSELOR_FILE_UPLOAD_ENDPOINT(fileUploadSlug))
      dispatch(removeCounselingFileUpload(fileUploadSlug))
      if (counselingStudent && getState().user.students[counselingStudent]) {
        const oldStudent = getState().user.students[counselingStudent]
        dispatch(
          addStudent({
            ...oldStudent,
            counseling_file_uploads: oldStudent.counseling_file_uploads?.filter(cfu => cfu !== fileUploadSlug),
          }),
        )
      }
    } catch (err) {
      throw errorHandler(err)
    }
  }

type CounselingFileUploadListFilter = {
  counseling_student?: number
  counselor_meeting?: number
}
export const fetchCounselingFileUploads = (filter: CounselingFileUploadListFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: FileUpload[] } = await API.get(COUNSELOR_FILE_UPLOAD_ENDPOINT(), { params: filter })
    dispatch(addCounselingFileUploads(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Fetch all roadmaps
 */
interface RoadmapPayload extends Omit<Roadmap, 'counselor_meeting_templates'> {
  counselor_meeting_templates: CounselorMeetingTemplate[]
}
export const fetchRoadmaps = () => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Roadmap[] } = await API.get(COUNSELOR_ROADMAP_ENDPOINT())

    dispatch(addCounselorMeetingTemplates(flatten(map(data, 'counselor_meeting_templates'))))

    // Roadmaps come with nest
    dispatch(addRoadmaps(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Creates new Roadmap
 * @param postData is what becomes a roadmap.
 * @returns
 */
export const createRoadmap = (postData: Partial<Roadmap>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Roadmap } = await API.post(COUNSELOR_ROADMAP_ENDPOINT(), postData)
    dispatch(addRoadmap(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Edits a roadmap
 * @param roadmapID is used to identify the roadmap to be edited.
 * @param postData is sent to the BE and updates the roadmap entry.
 * @returns
 */
export const updateRoadmap = (roadmapID: number, postData: Partial<Roadmap>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Roadmap } = await API.patch(COUNSELOR_ROADMAP_ENDPOINT(roadmapID), postData)
    dispatch(addRoadmap(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// Applying a roadmap requires specifying which agenda items are being used for each meeting.
// An array of these objects specifies those agenda items
export type ApplyRoadmapMeeting = {
  counselor_meeting_template: number
  agenda_item_templates: number[]
}

type RoadmapParams = {
  roadmapID: number
  studentID: number
  counselorMeetings: ApplyRoadmapMeeting[]
}

type RoadmapResponse = {
  tasks: BackendTask[]
  meetings: CounselorMeeting[]
}
/**
 * Apply a roadmap with @param roadmapID for a student with @param studentID
 * Including @param meeting_templates and @param task_templates allows creation of custom roadmap
 */
export const applyRoadmap =
  ({ roadmapID, studentID, counselorMeetings }: RoadmapParams) =>
  async (dispatch: Dispatch, getState: () => RootState) => {
    try {
      const { data }: { data: RoadmapResponse } = await API.post(APPLY_ROADMAP_ENDPOINT(roadmapID), {
        student_id: studentID,
        counselor_meetings: counselorMeetings,
      })
      dispatch(addTasks(data.tasks.map(t => extractTask(t, dispatch))))
      dispatch(addCounselorMeetings(data.meetings))
      // We need to add roadmap to student's list of roadmaps
      const student = getState().user.students[studentID]
      if (student) {
        dispatch(addStudent({ ...student, roadmaps: [...(student.roadmaps || []), roadmapID] }))
      }
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/** Unapply a roadmap from a student. Refreshes tasks and counselor meetings for student afterwards */
export const unapplyRoadmap =
  ({ roadmapID, studentID }: { roadmapID: number; studentID: number }) =>
  async (dispatch: ReduxDispatch, getState: () => RootState) => {
    try {
      const { data }: { data: Student } = await API.post(UNAPPLY_ROADMAP_ENDPOINT(roadmapID), {
        student_id: studentID,
      })
      // Delete all tasks and counselormeetings for student. We intentionally don't await refetching here (because
      // stale items are removed synchronously)
      const badTasks = values(getState().task.tasks).filter(t => t.for_user === data.user_id)
      dispatch(removeTasks(map(badTasks, 'pk')))
      if (badTasks) dispatch(fetchTasksForStudent(studentID))

      const badMeetings = values(getState().counseling.counselorMeetings).filter(m => m.student === studentID)
      dispatch(removeCounselorMeetings(map(badMeetings, 'pk')))
      if (badMeetings) dispatch(fetchCounselorMeetings({ student: studentID }))

      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

type StudentActivityFilter = {
  student_pk?: number
}

/**
 * Fetch all student activities that user can access
 * If student_pk query param is defined, fetches all activities for given student
 */
export const fetchStudentActivities = (filter?: StudentActivityFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: StudentActivity[] } = await API.get(STUDENT_ACTIVITY_ENDPOINT(), { params: filter })
    dispatch(addStudentActivities(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

/**
 * Create a student activity: @param newStudentActivity
 */
export const createStudentActivity = (newStudentActivity: Partial<StudentActivity>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: StudentActivity } = await API.post(STUDENT_ACTIVITY_ENDPOINT(), newStudentActivity)
    dispatch(addStudentActivity(data))
    return data
  } catch (err) {
    return errorHandler(err)
  }
}

/**
 * Update a student activity identified by @param studentActivityID with payload @param updatedStudentActivity
 */
export const updateStudentActivity =
  (studentActivityID: number, updatedStudentActivity: Partial<StudentActivity>) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: StudentActivity } = await API.patch(
        STUDENT_ACTIVITY_ENDPOINT(studentActivityID),
        updatedStudentActivity,
      )
      dispatch(addStudentActivity(data))
      return data
    } catch (err) {
      return errorHandler(err)
    }
  }

/**
 * Delete student activity with @param pk
 */
export const deleteStudentActivity = (pk: number) => async (dispatch: Dispatch) => {
  try {
    const deletedPK: number = await API.delete(STUDENT_ACTIVITY_ENDPOINT(pk))
    dispatch(removeStudentActivity({ pk }))
    return deletedPK
  } catch (err) {
    throw errorHandler(err)
  }
}

// Create a new CounselingHoursGrant object
export const createCounselingHoursGrant = (grant: Partial<CounselingHoursGrant>) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselingHoursGrant } = await API.post(COUNSELING_HOURS_GRANT_ENDPOINT(), grant)
    dispatch(addCounselingHoursGrant(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// Update a CounselorHoursGrant object. PK must be specified on argument object
export const updateCounselingHoursGrant =
  (grant: Partial<CounselingHoursGrant> & { pk: number }) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: CounselingHoursGrant } = await API.patch(COUNSELING_HOURS_GRANT_ENDPOINT(grant.pk), grant)
      dispatch(addCounselingHoursGrant(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

// Filter parameters that get used as query params for fetching counseling hours grants
export type FetchCounselingHoursGrantsFilter = {
  student?: number
}
// Fetch CounselingHoursGrant objects
export const fetchCounselingHoursGrants = (params?: FetchCounselingHoursGrantsFilter) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: CounselingHoursGrant[] } = await API.get(COUNSELING_HOURS_GRANT_ENDPOINT(), { params })
    dispatch(addCounselingHoursGrants(data))
    return data
  } catch (err) {
    throw errorHandler(err)
  }
}

// Delete a CounselingHoursGrant object
export const deleteCounselingHoursGrant = (pk: number) => async (dispatch: Dispatch) => {
  try {
    await API.delete(COUNSELING_HOURS_GRANT_ENDPOINT(pk))
    dispatch(removeCounselingHoursGrant(pk))
  } catch (err) {
    throw errorHandler(err)
  }
}

// Filter parameters that get used as query params for fetching student counseling hours
export type FetchStudentCounselingHoursFilter = {
  student?: number
}

export const fetchStudentCounselingHours =
  (params?: FetchStudentCounselingHoursFilter) => async (dispatch: Dispatch) => {
    try {
      const { data }: { data: StudentCounselingHours[] } = await API.get(STUDENT_COUNSELING_HOURS_ENDPOINT(), {
        params,
      })
      dispatch(addStudentCounselingHours(data))
      return data
    } catch (err) {
      throw errorHandler(err)
    }
  }

/** Fetch all roadmap that contain task  */
export const fetchTaskRoadmap = (task_id: number) => async (dispatch: Dispatch) => {
  try {
    const { data }: { data: Roadmap[] } = await API.post(`${TASK_ROADMAP_ENDPOINT()}`, { task_id })
    dispatch(addTaskRoadmaps(data))
  } catch (err) {
    throw errorHandler(err)
  }
}
