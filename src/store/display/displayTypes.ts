import { has } from 'lodash'
import { RecurringAvailabilityLocations, Trimesters } from 'store/availability/availabilityTypes'
import { CounselorMeeting } from 'store/counseling/counselingTypes'
import { TaskType } from 'store/task/tasksTypes'
import { Course, StudentTutoringSession } from 'store/tutoring/tutoringTypes'

export enum MODALS {
  SUBMIT_TASK,
  SUBMIT_DIAGNOSTIC_RESULT,
  REVIEW_DIAGNOSTIC_RESULT,
  CREATE_TUTORING_SESSION,
  CREATE_TASK,
  EDIT_TASK_DUE_DATE,
  CREATE_RESOURCE,
  EDIT_RESOURCE,
  EDIT_STUDENT_TUTORING_SESSION,
  EDIT_TUTORING_SESSION,
  GROUP_TUTORING_SESSION,
  SELF_ASSIGN_DIAGNOSTIC,
  CREATE_TUTORING_SESSION_NOTE,
  EDIT_TUTORING_SESSION_NOTE,
  CREATE_TUTORING_PACKAGE_PURCHASE,
  HIGH_SCHOOL_COURSE,
  GOOGLE_CAL_INSTRUCTIONS,
  AVAILABILITY,
  TIME_CARD,
  LOCATION,
  TEST_RESULT,
  HAMBURGER_MENU,
  PURCHASE_TUTORING_PACKAGE,
  COURSE,
  PAYGO_PURCHASE,
  LATE_CANCEL_CONFIRMATION,
  CREATE_STUDENT_UNIVERSITY_DECISION,
  COUNSELOR_MEETING,
  COUNSELOR_MEETING_TASK,
  DIAGNOSTIC_REGISTRATION_DETAILS,
  COUNSELING_FILE_UPLOAD,
  APPLY_ROADMAP,
  CREATE_ROADMAP,
  COUNSELING_CALENDAR_EVENT,
  COUNSELOR_MEETING_NOTE,
  CREATE_COUNSELOR_MEETING_TEMPLATE,
  CREATE_COUNSELING_TASK,
  COUNSELOR_MEETING_INFO,
  COUNSELOR_TIME_ENTRY_MODAL,
  CREATE_COUNSELOR_TIME_CARD,
  SEND_COUNSELOR_MEETING_NOTES,
  SUD_NOTES,
  CREATE_BULLETIN,
  VIEW_BULLETIN,
  SCHEDULE_COUNSELOR_MEETING,
  RESOURCE_MODAL,
  TASK_TEMPLATE_MODAL,
  ADD_EDIT_AGENDA_ITEM_TEMPLATE,
  VIMEO_RESOURCE_MODAL,
  COUNSELING_HOURS_GRANT_MODAL,
  BULK_ASSIGN_TASK_MODAL,
}

export type CounselingHoursGrantModalProps = {
  editCounselingHoursGrantID?: number
  studentID?: number
}

export type TaskTemplateModalProps = {
  taskTemplateID?: number
  agendaItemTemplateID?: number
}

export type ScheduleCounselorMeetingProps = {
  meetingID: number
}

export type CreateBulletinProps = {
  bulletinID?: number
}
export type ViewBulletinProps = {
  bulletinID: number
}

export type SendCounselorMeetingNotesProps = {
  counselorMeetingID: number
}

export type SUDNotesProps = {
  // Modal supports editing multiple school notes. To edit a single school note, just include that SUD PK in this array
  studentUniversityDecisionIDs: number[]
  studentPK: number
}

export type CreateCounselorTimeCardProps = {
  counselors?: number[]
}

export type CounselorTimeEntryProps = {
  counselorTimeEntryPK?: number
  addingTime?: boolean // If true, we create a negative time entry (add time for student)
  studentPK?: number // Default value for creating a new entry
  counselorPK?: number // Default value for creating a new entry
  timeCard?: number // If set, then creating the time entry will add it to this time card
}

export type CounselingFileUploadProps = {
  studentID: number
  tags?: string[] // New props to use
  editFileUploadSlug?: string // ID of FileUPload to edit (instad of creating a new one)
}

export type CreateStudentUniversityDecisionProps = {
  studentPK?: number
}

export type CounselorMeetingInfoProps = {
  counselorMeetingPK: number
}

export type DiagnosticRegistrationDetailsProps = {
  diagnosticRegistrationPK?: number
  diagnosticResultPK?: number
}

export type LateCancelModalProps = {
  studentTutoringSessionPK: number
}

export type PurchaseTutoringPackageModalProps = {
  studentID: number
}

export type SubmitTaskModalProps = {
  taskID: number
}

export type DiagnosticResultModalProps = {
  diagnosticResultID?: number // Editing existing DiagnosticResult
  diagnosticID?: number
  showSelectStudentDiagnostic?: boolean // Whether or not we should show dropdowns for choosing a student/diag
  studentID?: number // Can be used when creating a new DiagnosticResult
}

/** Can optionally define student and package, and whether each is shown */
export type CreateTutoringPackagePurchaseProps = {
  student?: number
  package?: number
  hideStudent?: boolean
  hidePackage?: boolean
}

export type CreateTaskModalProps = {
  diagnosticID?: number
  studentID: number // Student task is going to be for

  // If Editing
  taskID?: number

  // If creating a new task
  taskTemplateID?: number
}

export type EditTaskDueDateModalProps = {
  taskID: number
}

export type SelfAssignDiagnosticModalProps = {
  studentID: number
}

export type CreateTutoringSessionModalProps = {
  studentID: number // Student session is for
  tutorID?: number // Tutor session is with
  group?: boolean // Whether or not this is to be a group session (show group options) or individual (default)
  start?: string // If admin or tutor, then we'll use this datetime string as the start of the session instead
  // of allowing choosing a time
}

export type EditTutoringSessionModalProps = {
  sessionID: number
  studentID: number
  tutorID?: number
  group?: boolean
  start?: string
  sessionDetails?: StudentTutoringSession // Used to set initial session type and subject value when rescheduling
}

// custom typeguard
export const isEditType = (val: any): val is EditTutoringSessionModalProps => has(val, 'sessionID')
export const isCreateType = (val: any): val is CreateTutoringSessionModalProps => !has(val, 'sessionID')

export type ResourceModalProps = {
  resourceID?: number
  studentID?: number // If creating a resource, the student to add it to
  resourceGroupID?: number // If creating a resource, default to this group
}

// DEPRECATED
export type CreateResourceModalProps = {
  type: 'resources' | 'resourceGroups' // What type of resource
  student?: number // If set, then we will add resource to student when created
}

export type EditResourceModalProps = {
  type: 'resources' | 'resourceGroups' // What type of resource and id of resource to edit
  id: number
}

/** takes in a resource pk for display modal*/
export type VimeoResourceModalProps = {
  pk: number
}

export type EditStudentTutoringSessionModalProps = {
  sessionID: number
}

export type GoogleCalInstructionsModalProps = {
  link: string // Link to user's calendar
}

export type GroupTutoringSessionModalProps = {
  sessionID?: number
}

export type CreateTutoringSessionNoteModalProps = {
  groupTutoringSessionID?: number
  individualTutoringSessionID?: number
  tutorID: number
}

export type EditTutoringSessionNoteModalProps = {
  sessionNoteID: number
  groupTutoringSessionID?: number
  individualTutoringSessionID?: number
  tutorID: number
}

export type PaygoPurchaseModalProps = {
  individualTutoringSessionID: number
}

export type HighSchoolCourseModalProps = { studentID: number; courseID?: number; year: number; coursePlanning: boolean }

export type AvailabilityModalProps = {
  tutor?: number
  counselor?: number
  isRecurring: boolean
  recurringTrimester?: Trimesters
  start: string
  end: string
  day?: string
  defaultLocation?: number | null
}

export type TimeCardModalProps = { pk?: number; tutorID?: number; adminID?: number }

export type LocationModalProps = { pk?: number }

export type TestResultModalProps = { pk?: number; student: number }

export type HamburgerMenuModalProps = {}

export type CourseModalProps = {
  course: Course
}

export type CounselorMeetingProps = {
  counselorMeetingID?: number
  studentID?: number
}

export type CounselorMeetingTaskProps = {
  userID?: number
  related_task_types?: TaskType[]
  roadmap_task_keys?: string[]
}

export type CreateCounselorMeetingTemplateProps = {
  meetingTemplateID?: number
}

export type CreateRoadmapProps = {
  studentID: number
}

export type CounselingCalendarEventProps = {
  item: CounselorMeeting
}

export type CounselorMeetingNoteProps = {
  counselorMeetingID?: number
  nonMeetingNoteDate?: string | null
  studentPK?: number
}

export type CreateRoadmapsProps = {
  roadmapID?: number
}

export type AddEditAgendaItemTemplateModalProps = {
  meetingTemplateID: number
  agendaItemTemplateID?: number
}

export type BulkAssignTaskModalProps = {}

export type AllModalPropsTypes =
  | SubmitTaskModalProps
  | DiagnosticResultModalProps
  | CreateTaskModalProps
  | EditTaskDueDateModalProps
  | CreateTutoringSessionModalProps
  | CreateResourceModalProps
  | EditResourceModalProps
  | EditStudentTutoringSessionModalProps
  | EditTutoringSessionModalProps
  | GroupTutoringSessionModalProps
  | SelfAssignDiagnosticModalProps
  | CreateTutoringSessionNoteModalProps
  | EditTutoringSessionNoteModalProps
  | CreateTutoringPackagePurchaseProps
  | HighSchoolCourseModalProps
  | GoogleCalInstructionsModalProps
  | AvailabilityModalProps
  | TimeCardModalProps
  | LocationModalProps
  | PurchaseTutoringPackageModalProps
  | CourseModalProps
  | PaygoPurchaseModalProps
  | LateCancelModalProps
  | CreateStudentUniversityDecisionProps
  | CounselorMeetingProps
  | CounselorMeetingTaskProps
  | DiagnosticRegistrationDetailsProps
  | CounselingFileUploadProps
  | CreateRoadmapProps
  | CounselingCalendarEventProps
  | CounselorMeetingNoteProps
  | CounselorMeetingInfoProps
  | CounselorTimeEntryProps
  | CreateCounselorTimeCardProps
  | SendCounselorMeetingNotesProps
  | SUDNotesProps
  | CreateBulletinProps
  | ViewBulletinProps
  | ScheduleCounselorMeetingProps
  | ResourceModalProps
  | TaskTemplateModalProps
  | CreateRoadmapsProps
  | CreateCounselorMeetingTemplateProps
  | AddEditAgendaItemTemplateModalProps
  | VimeoResourceModalProps
  | CounselingHoursGrantModalProps
  | BulkAssignTaskModalProps

export type DisplayStateType = {
  activeModalIndex: number
  modals: ModalInstance[]
}

export type ShowModalPayload = {
  modal: MODALS
  props: AllModalPropsTypes
}
export type CloseModalPayload = {
  // Whether or not history (modalProps/modalTypes) should be kept. If omitted, history is deleted
  keepHistory?: boolean
}

export enum ModalVisibility {
  Visible,
  Minimized, // Appears as tab at bottom of screen
  Hidden,
}

export type ModalInstance = {
  modalType: MODALS
  modalProps: AllModalPropsTypes
  state: object
  visibility: ModalVisibility
  title?: string
}

export const DisplayState: DisplayStateType = {
  activeModalIndex: -1,
  modals: [],
}
