import { Platform } from 'store/common/commonTypes'
import { Location } from 'store/tutoring/tutoringTypes'

export enum UserType {
  Student = 'student',
  Counselor = 'counselor',
  Tutor = 'tutor',
  Administrator = 'administrator',
  Parent = 'parent',
}

export enum UsersType {
  Students = 'students',
  Counselors = 'counselors',
  Tutors = 'tutors',
  Parents = 'parents',
}

export enum CourseLevels {
  re = 'Regular',
  ho = 'Honors',
  ap = 'AP',
  ib = 'IB',
}

export enum Semesters {
  Winter = 1,
  Spring,
  Summer,
  Fall,
}

export type User = Counselor | Parent | Student | Tutor | Administrator

export interface CommonUser {
  pk: number
  slug: string
  first_name: string
  last_name: string
  email: string
  phone?: number
  address: string
  address_line_two: string
  city: string
  zip_code: string
  state: string
  country: string
  user_type: string
  user_id: number
  timezone?: string // trying out undefined instead of null for several fields in this slice
  set_timezone?: string
  account_is_created: boolean
  accept_invite_url?: string // Admin read only
  accepted_invite?: string // Admin read only; string representing date
  last_invited?: string // Admin read only; string representing date
  calendar_url: string
  notification_recipient: number
  is_active?: boolean // Admin read/write

  profile_picture: string // Read Only
  update_profile_picture?: string | null // Write-only. Slug of FileUpload
}

export enum CounselingStudentType {
  PAYGO = 'PAYGO',
  'Comprehensive Admission Counseling 8' = 'Comprehensive Admission Counseling 8',
  'Comprehensive Admission Counseling 12' = 'Comprehensive Admission Counseling 12',
  'Upgrade to CAC 12' = 'Upgrade to CAC 12',
  'Premier Admissions Counseling' = 'Premier Admissions Counseling',
  'Upgrade to Premier' = 'Upgrade to Premier',
  'International PAYGO' = 'International PAYGO',
  'International Comprehensive Admissions Counseling' = 'International Comprehensive Admissions Counseling',
  'International Premier Admissions Counseling' = 'International Premier Admissions Counseling',
  'Wiser Summer Planning' = 'Wiser Summer Planning',
  'Applications Lite' = 'Applications Lite',
  'Small Group Counseling' = 'Small Group Counseling',
  'Portfolio Review/Build' = 'Portfolio Review/Build',
  'Arts Application Fee' = 'Arts Application Fee',
  'Additional Application' = 'Additional Application',
  'Athletic Recruiting Fee' = 'Athletic Recruiting Fee',
  'UK Application' = 'UK Application',
  'BS-MD Fee' = 'BS-MD Fee',
  'NYC Bootcamp' = 'NYC Bootcamp',
  'CAP Ultimate' = 'CAP Ultimate',
  'Transfer 2' = 'Transfer 2',
  'UC Essay Package' = 'UC Essay Package',
  'Essay Package Lite' = 'Essay Package Lite',
  'Single School Supplement Essay Package' = 'Single School Supplement Essay Package',
  'Essay Package' = 'Essay Package',
  'CAP 8' = 'CAP 8',
  'CAP 10' = 'CAP 10',
  'CAP 12' = 'CAP 12',
  'All Inclusive 8' = 'All Inclusive 8',
  'All Inclusive 12' = 'All Inclusive 12',
  'Foundations' = 'Foundations',
  'CAP Optimal' = 'CAP Optimal',
  'Scholarship' = 'Scholarship',
}
export enum CounselingStudentTypeLabels {
  Optimal = 'Optimal',
  PAYGO = 'PAYGO',
  ALL_INCLUSIVE_12 = 'All Inclusive 12',
  ALL_INCLUSIVE_8 = 'All Inclusive 8',
  NOT_TOO_LATE = 'Not Too Late',
  FOUNDATIONS = 'Foundations',
  ESSAY = 'Essay',
  PAYGO_ESSAY = 'Paygo + Essay',
  'CAP 8' = 'CAP 8',
  'CAP 10' = 'CAP 10',
  'CAP 12' = 'CAP 12',
  'All Inclusive 8' = 'All Inclusive 8',
  'All Inclusive 12' = 'All Inclusive 12',
  'Foundations' = 'Foundations',
  'CAP Optimal' = 'CAP Optimal',
  'Comprehensive Admission Counseling 8' = 'Comprehensive Admission Counseling 8',
  'Comprehensive Admission Counseling 12' = 'Comprehensive Admission Counseling 12',
  'Upgrade to CAC 12' = 'Upgrade to CAC 12',
  'Premier Admissions Counseling' = 'Premier Admissions Counseling',
  'Upgrade to Premier' = 'Upgrade to Premier',
  'International PAYGO' = 'International PAYGO',
  'International Comprehensive Admissions Counseling' = 'International Comprehensive Admissions Counseling',
  'International Premier Admissions Counseling' = 'International Premier Admissions Counseling',
  'Wiser Summer Planning' = 'Wiser Summer Planning',
  'Applications Lite' = 'Applications Lite',
  'Small Group Counseling' = 'Small Group Counseling',
  'Portfolio Review/Build' = 'Portfolio Review/Build',
  'Arts Application Fee' = 'Arts Application Fee',
  'Additional Application' = 'Additional Application',
  'Athletic Recruiting Fee' = 'Athletic Recruiting Fee',
  'UK Application' = 'UK Application',
  'BS-MD Fee' = 'BS-MD Fee',
  'NYC Bootcamp' = 'NYC Bootcamp',
  'CAP Ultimate' = 'CAP Ultimate',
  'Transfer 2' = 'Transfer 2',
  'UC Essay Package' = 'UC Essay Package',
  'Essay Package Lite' = 'Essay Package Lite',
  'Single School Supplement Essay Package' = 'Single School Supplement Essay Package',
  'Essay Package' = 'Essay Package',
  'Scholarship' = 'Scholarship',
}

export type StudentNextDeadline = {
  date: string // datetime
  universities_description: string // comma sep list of universities with this deadline
}

export interface Student extends CommonUser {
  high_school: string
  high_schools: string[] // List of previously attended high schools
  gpa?: number | string
  counselor?: number
  counselor_name?: string
  program_advisor?: string
  pronouns: string
  parent?: number
  admin_note?: string
  graduation_year: number
  tutors: number[]
  location?: Location | number
  location_id?: number
  visible_resources: number[]
  visible_resource_groups: number[]
  accommodations: string
  // PKs of courses student is involved in
  courses: number[]

  // Hours and payment settings
  individual_test_prep_hours: number
  group_test_prep_hours: number
  individual_curriculum_hours: number
  total_individual_test_prep_hours?: number
  total_group_test_prep_hours?: number
  total_individual_curriculum_hours?: number
  counselor_pay_rate?: string // Decimal string; Admin only

  is_paygo?: boolean
  last_paygo_purchase_id?: string
  wellness_history?: string
  counseling_student_types_list: Array<CounselingStudentType>
  school_list_finalized: boolean

  // Counseling only fields
  school_count?: number
  overdue_task_count?: number
  next_counselor_meeting: string | null
  counselor_note?: string
  activities_notes?: string
  is_cas_student?: boolean
  is_prompt_active: boolean
  cw_gpa?: number
  has_access_to_cap?: boolean
  roadmaps?: number[] // Roadmaps that have been applied to student
  hide_target_reach_safety: boolean
  // Read only field that is only available in condensed mode (when loading on admin platform)
  purchased_hours?: number

  // Admin/tutor only fields
  basecamp_attachments?: string
  basecamp_documents?: string

  // Array of slugs of counseling file uploads (in our counselingFileUploads slice)
  counseling_file_uploads?: string[]
  // Tags are used in determining what announcements/bulletins are viewable by the student/parent
  tags: string[]
  // Datetime strings
  // These fields are tutor specific (i.e. next meeting with the student's tutor)
  next_meeting?: string
  most_recent_meeting?: string

  last_paid_meeting?: string

  // Frontend only
  loaded_tutoring_data?: boolean

  schools_page_note: string
  cpp_notes: string // File/URL

  //Hubspot
  hubspot_id: string
}

export enum StudentHighSchoolCourseGradingScale {
  'A-F' = 'A-F',
  '1-100' = '1-100',
  '0.0-4.0' = '0.0-4.0',
  '0.0-5.0' = '0.0-5.0',
  '1-7' = '1-7',
  '1-10' = '1-10',
  '1-11' = '1-11',
  '1-20' = '1-20',
  'Other' = 'Other',
}

export enum StudentHighSchoolCourseSchedule {
  'Semesters' = 'Semesters',
  'Trimesters' = 'Trimesters',
  'Quarters' = 'Quarters',
  'Yearly' = 'Yearly',
  'Other' = 'Other',
}

export enum StudentHighSchoolCourseSubject {
  'Pre-Algebra' = 'Pre-Algebra',
  'Algebra' = 'Algebra',
  'Geometry' = 'Geometry',
  'Trigonometry' = 'Trigonometry',
  'Pre-Calculus' = 'Pre-Calculus',
  'Calculus' = 'Calculus',
  'Math (Other)' = 'Math (Other)',
  'Biology' = 'Biology',
  'Chemistry' = 'Chemistry',
  'Physics' = 'Physics',
  'Earth/Environmental Science' = 'Earth/Environmental Science',
  'Science (Other)' = 'Science (Other)',
  'English' = 'English',
  'History/Social Science' = 'History/Social Science',
  'Foreign/World Language' = 'Foreign/World Language',
  'Physical Education/Health' = 'Physical Education/Health',
  'Art (Visual or Performing)' = 'Art (Visual or Performing)',
  'Computer Science' = 'Computer Science',
  'Religion' = 'Religion',
  'Other/Elective' = 'Other/Elective',
}

export enum StudentHighSchoolCourseLevel {
  'Regular/Standard' = 'Regular/Standard',
  'Accelerated' = 'Accelerated',
  'Advanced' = 'Advanced',
  'Advanced Placement (AP)' = 'Advanced Placement (AP)',
  'AS/A-level/International A-level, Cambridge AICE' = 'AS/A-level/International A-level, Cambridge AICE',
  'College Prep' = 'College Prep',
  'Dual Enrollment' = 'Dual Enrollment',
  'Enriched' = 'Enriched',
  'GCSE,IGCSE' = 'GCSE,IGCSE',
  'Gifted' = 'Gifted',
  'High Honors' = 'High Honors',
  'Honors' = 'Honors',
  'Intensive' = 'Intensive',
  'International Baccalaureate (IB)' = 'International Baccalaureate (IB)',
  'Pre-IB' = 'Pre-IB',
  'Regents' = 'Regents',
  'N/A' = 'N/A',
}

export interface StudentHighSchoolCourse {
  pk: number
  slug: string
  student: number
  name: string
  course_level: StudentHighSchoolCourseLevel
  school_year: number
  grading_scale: StudentHighSchoolCourseGradingScale
  schedule: StudentHighSchoolCourseSchedule
  subject: StudentHighSchoolCourseSubject
  high_school: string
  grades: string[]
  credits: string[]
  credits_na: boolean
  course_notes: string

  // Only available to counselors/admins
  cw_equivalent_grades: number[]
  include_in_cw_gpa: boolean

  // Whether course appears in course planning section or with all other courses
  planned_course: boolean
}

export interface StudentUpdate extends Student {
  pending_enrollment_course: number
}
export interface Counselor extends CommonUser {
  students: Array<number>
  location?: Location
  has_connected_outlook: boolean
  is_admin: boolean
  hourly_rate?: number
  prompt?: boolean
  part_time?: boolean
  email_header: string // HTML
  email_signature: string // HTML

  minutes_between_meetings: number
  max_meetings_per_day: number
  // Whether or not counselor is cc'd on notes to parents
  cc_on_meeting_notes: boolean
  student_schedule_meeting_buffer_hours: number
  student_reschedule_hours_required: number | null
}

// Optional fields for zoom users. These fields are only for admins
export enum ZoomAccountType {
  Basic = 1,
  Licensed = 2,
}

interface ZoomUser extends CommonUser {
  zoom_pmi?: string
  zoom_url?: string
  zoom_phone?: string
  zoom_userid?: string
  zoom_type?: ZoomAccountType
}

export interface Tutor extends ZoomUser {
  students: Array<number>
  university?: number
  degree: string
  bio: string
  remote_tutoring_link: string
  can_tutor_remote: boolean
  location?: Location
  has_recurring_availability: boolean
  // Date through which recurring availability has been created
  is_curriculum_tutor: boolean
  is_test_prep_tutor: boolean
  tutoring_services: number[]
  students_can_book: boolean
  hourly_rate?: number // Only visible to admins
  is_diagnostic_evaluator: boolean
  has_connected_outlook: boolean
  is_admin: boolean
}

export interface Parent extends CommonUser {
  students: Array<number>
  phone_number: string
  cc_email: string
  secondary_parent_first_name: string
  secondary_parent_last_name: string
  secondary_parent_phone_number: string
}

// Todo: Will add fields here in the future
export interface Administrator extends CommonUser {
  is_tutor: boolean
  is_counselor: boolean
  is_cap_administrator: boolean
  is_cas_administrator: boolean
}

export interface ActiveUser {
  userID: number
  cwUserID: number
  userType: UserType
  platform?: Platform
}

export type UsersState = {
  activeUser: ActiveUser | null
  selectedStudent: Student | null
  students: {
    [pk: number]: Student
  }
  counselors: {
    [pk: number]: Counselor
  }
  tutors: {
    [pk: number]: Tutor
  }
  parents: {
    [pk: number]: Parent
  }
  administrators: {
    [pk: number]: Administrator
  }
  courses: {
    [pk: number]: StudentHighSchoolCourse
  }
  proZoomURLs: string[]
  recentStudents: number[]
}

// Type that makes a partial of a type, and tacks on 'invite' property.
// Use this to create the type that we submit when creating a user
export type CreateUser<T> = {
  [P in keyof T]?: T[P]
} & { invite?: boolean }

export type SetCurrentUserPayload = {
  cwUserID: number // This is ID of a cwuser model object
  userType: UserType
  userID: number // This is ID of django.auth.User object
  platform?: Platform
}
