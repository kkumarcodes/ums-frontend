// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { FileUpload } from 'store/common/commonTypes'
import { Resource } from 'store/resource/resourcesTypes'

export enum RoadmapSemesters {
  One = 1,
  OneTwo = 1.5,
  Two = 2,
  TwoSummer = 2.5,
  Summer = 3,
  SummerOne = 3.5,
}

export type CounselorMeeting = {
  pk: number
  slug: string
  title: string
  start: string | null
  end: string | null
  duration_minutes: number | null
  student: number
  student_name: string
  cancelled: string | null
  counselor_meeting_template: number
  counselor_meeting_template_name?: string // Counselor-only field
  student_notes: string
  student_resources: Resource[]
  student_instructions: string
  private_notes?: string // Counselor field
  counselor_instructions?: string // Counselor field
  tasks: number[] // Pre-meting tasks
  assigned_task_count: number // Number of tasks[] that have a due date set
  agenda_items: number[]
  student_schedulable: boolean // Whether or not a student can schedule this meeting
  // Fields related to counselor notes. Set these fields BEFORE hitting send notes endpoint
  notes_message_note: string
  notes_message_subject: string
  notes_finalized: boolean
  // Lists of tasks (PKs) to enumerate within email
  notes_message_upcoming_tasks: number[]
  notes_message_completed_tasks: number[]
  notes_message_last_sent: string // datetime
  link_schedule_meeting_pk: number
  file_uploads: FileUpload[]
  update_file_uploads?: string[] // Only for create/update. Array of slugs of FileUpload objects

  // Read only fields from CounselorMeetingTemplate
  order: number
  grade: number
  semester: RoadmapSemesters // Really a number -- see enum
  description: string
  use_agenda: boolean

  location: number | null

  // From counselor
  zoom_url: string
}

export enum CounselorTimeEntryCategory {
  MeetingGeneral = 'meeting_general',
  MeetingCollegeResearch = 'meeting_college_research',
  MeetingActivityReview = 'meeting_activity_review',
  MeetingCourseSelection = 'meeting_course_selection',
  MeetingEssayBrainstorming = 'meeting_essay_brainstorming',
  OtherGeneral = 'other_general',
  OtherEssayReviewAndEditing = 'other_essay_review_and_editing',
  OtherPhoneCall = 'other_phone_call',
  OtherFollowUpEmailNotes = 'other_follow_up_email_or_notes',
  OtherCollegeResearchPrep = 'other_college_research_prep',
  OtherActivityReviewPrep = 'other_activity_review_prep',
  OtherGeneralMeetingPrep = 'other_general_meeting_prep',
  OtherCourseSelectionPrep = 'other_course_selection_prep',
  AdminTraining = 'admin_training',
  AdminFreshmenForum = 'admin_freshmen_forum',
  AdminTheGutCheck = 'admin_the_gut_check',
  AdminOfficeHours = 'admin_office_hours',
  AdminCounselingCall = 'admin_counseling_call',
  AdminMeetingWithManager = 'admin_meeting_with_manager',
  AdminMiscellaneousAdminTasks = 'admin_miscellaneous_admin_tasks',
}

export type CounselorTimeEntry = {
  pk: number
  slug: string
  date: string // datetime
  hours: number // Note this decimal on the backend
  category: CounselorTimeEntryCategory
  note: string
  student: number
  counselor: number
  counselor_time_card: number | null
  amount_paid: number
  marked_paid: boolean
  include_in_hours_bank: boolean
}

export type CounselorTimeCard = {
  pk: number
  slug: string
  counselor_time_entries: number[]
  admin_approval_time: string | null
  counselor_approval_time: string | null
  counselor: number
  hourly_rate: number
  admin_has_approved: boolean
  start: string
  end: string
  total: number
  total_hours: number
}

export enum CounselorNoteCategory {
  Academics = 'academics',
  Activities = 'activities',
  Colleges = 'colleges',
  Majors = 'majors',
  Other = 'other',
  ApplicationWork = 'application_work',
  Private = 'private',
  Testing = 'testing',
}

export type CounselorNote = {
  pk: number
  slug: string
  title: string
  counselor_meeting: number | null
  category: CounselorNoteCategory
  visible_to_student: boolean
  visible_to_parent: boolean
  note: string
  student: number | null // Defined for meeting-notes
  meeting_date: string | null // Start of associated counselor meeting
  note_date: string | null // datestring (for non-meeting notes)
  note_student: number | null // Defined for non-meeting notes
  note_title: string // Counselor custom title on a non-meeting note
}

export type CounselorMeetingTemplate = {
  pk: number
  slug: string
  title: string
  order: number
  counselor_instructions: string // Rich text - HTML
  student_instructions: string // Rich text - HTML
  counselor_resources: number[]
  roadmap?: number
  agenda_item_templates: AgendaItemTemplate[]
  create_when_applying_roadmap: boolean
  grade: number
  semester: RoadmapSemesters
  use_agenda: boolean
}

export enum CounselingUploadFileTags {
  Transcript = 'Transcript',
  Testing = 'Testing',
  Recommendation = 'Recommendation',
  Resource = 'Resource',
  Other = 'Other',

  // These tags are used for categorization amongst the student dashboard tabs
  Academics = 'Academics',
  Colleges = 'Colleges',
  Activities = 'Activities',
}

export type Roadmap = {
  pk: number
  slug: string
  title: string
  description: string // HTML
  counselor_meeting_templates: CounselorMeetingTemplate[]
  active: boolean
  repeatable: boolean
  category: string
}

export interface AgendaItemTemplate {
  pk: number
  slug: string
  order: number
  counselor_title: string
  student_title: string
  pre_meeting_task_templates: number[]
  post_meeting_task_templates: number[]
  counselor_meeting_template: number
  repeatable: boolean
  counselor_instructions: string
}

export type AgendaItem = {
  pk: number
  slug: string
  counselor_title: string
  student_title: string
  counselor_meeting: number
  agenda_item_template: number | null
  counselor_instructions: string
}

export enum StudentActivityCategories {
  SummerActivity = 'Summer Activity',
  WorkExperience = 'Work Experience',
  Award = 'Award',
  Other = 'Other',
}

export enum StudentActivityRecognition {
  School = 'School',
  'State/Regional' = 'State/Regional',
  National = 'National',
  International = 'International',
}

export enum CommonAppActivityCategories {
  Academic = 'Academic',
  Art = 'Art',
  'Athletics: Club' = 'Athletics: Club',
  'Athletics: JV/Varsity' = 'Athletics: JV/Varsity',
  'Career Oriented' = 'Career Oriented',
  'Community Service (Volunteer)' = 'Community Service (Volunteer)',
  'Computer/Technology' = 'Computer/Technology',
  Cultural = 'Cultural',
  Dance = 'Dance',
  'Debate/Speech' = 'Debate/Speech',
  Environmental = 'Environmental',
  'Family Responsibilities' = 'Family Responsibilities',
  'Foreign Exchange' = 'Foreign Exchange',
  'Foreign Language' = 'Foreign Language',
  Internship = 'Internship',
  'Journalism/Publication' = 'Journalism/Publication',
  'Junior R.O.T.C.' = 'Junior R.O.T.C.',
  LGBT = 'LGBT',
  'Music: Instrumental' = 'Music: Instrumental',
  'Music: Vocal' = 'Music: Vocal',
  Religious = 'Religious',
  Research = 'Research',
  Robotics = 'Robotics',
  'School Spirit' = 'School Spirit',
  'Science/Math' = 'Science/Math',
  'Social Justice' = 'Social Justice',
  'Student Govt./Politics' = 'Student Govt./Politics',
  'Theater/Drama' = 'Theater/Drama',
  'Work (Paid)' = 'Work (Paid)',
  'Other Club/Activity' = 'Other Club/Activity',
}

export type StudentActivity = {
  pk: number
  slug: string
  name: string
  description: string
  category?: StudentActivityCategories
  awards: string
  student: number
  years_active: number[]
  hours_per_week: number
  weeks_per_year: number
  intend_to_participate_college: boolean
  during_school_year: boolean
  during_school_break: boolean
  all_year: boolean
  position: string
  common_app_category?: CommonAppActivityCategories
  order?: number

  // These fields are just for awards
  recognition?: StudentActivityRecognition
  post_graduate: boolean
}

export type CounselingHoursGrant = {
  pk: number
  slug: string
  number_of_hours: number
  student: number
  note: string
  amount_paid: number
  marked_paid: boolean
  created: string
  magento_id: string
  include_in_hours_bank: boolean
}

export type StudentCounselingHours = {
  pk: number
  slug: string
  student_name: string
  student_email: string
  counselor_name: string
  counselor_email: string
  is_counselor_part_time: boolean
  is_paygo: boolean
  total_hours: number
  spent_hours: number
}

export type CounselingState = {
  counselorMeetings: {
    [pk: number]: CounselorMeeting
  }
  counselorMeetingTemplates: {
    [pk: number]: CounselorMeetingTemplate
  }
  counselorNotes: {
    [pk: number]: CounselorNote
  }
  // Look! Slugs are keys here not PKs (since everywhere else in our API we use slugs to identify file uploads)
  counselingFileUploads: {
    [slug: string]: FileUpload
  }
  roadmaps: {
    [pk: number]: Roadmap
  }
  taskRoadmaps: {
    [pk: number]: Roadmap
  }
  studentActivities: {
    [pk: number]: StudentActivity
  }
  agendaItems: {
    [pk: number]: AgendaItem
  }
  agendaItemTemplates: {
    [pk: number]: AgendaItemTemplate
  }
  counselorTimeEntries: {
    [pk: number]: CounselorTimeEntry
  }
  counselorTimeCards: {
    [pk: number]: CounselorTimeCard
  }
  counselingHoursGrants: {
    [pk: number]: CounselingHoursGrant
  }
  studentCounselingHours: {
    [pk: number]: StudentCounselingHours
  }
}
