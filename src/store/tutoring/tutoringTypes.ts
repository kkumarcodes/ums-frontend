import { FileUpload } from 'store/common/commonTypes'
import { Resource } from 'store/resource/resourcesTypes'

export interface Location {
  pk: number
  slug: string
  name: string
  description: string
  offers_tutoring: boolean
  offers_admissions: boolean
  address: string
  address_line_two: string
  city: string
  zip_code: string
  state: string
  is_remote: boolean
  default_zoom_url: string
  timezone: string
  tutoring_services: number[]
}

export interface TutoringService {
  pk: number
  slug: string
  name: string
  locations: number[]
  tutors: number[]
  student_tutoring_sessions?: number[]
  session_type: TutoringSessionType
  applies_to_group_sessions: boolean
  applies_to_individual_sessions: boolean
  level: string
}

export interface StudentTutoringSession {
  duration_minutes: number
  pk: number
  slug: string
  // All dates
  start: string
  end: string

  student: number
  group_tutoring_session?: number | null
  individual_session_tutor?: number | null

  cancelled: boolean | null
  set_cancelled?: boolean //write-only field
  late_cancel: boolean
  missed: boolean
  tutoring_session_notes: number | null
  notes_skipped: boolean
  title: string
  note: string
  // Array of PKs
  resources: number[]
  // Student's location
  location: number | null

  // Only present if session is completed and notes have been provided
  notes_url: string

  // Only present for remote meetings
  zoom_url: string
  is_remote: boolean

  session_type: TutoringSessionType
  // Info on service offered
  tutoring_service: number
  tutoring_service_name: string

  verbose_title: string
  primary_tutor: number

  // Package to use to pay for session
  paygo_tutoring_package?: number
  paygo_transaction_id: string

  // Late cancel charge id
  late_cancel_charge_transaction_id: string

  is_tentative: boolean
}

export interface GroupTutoringSession {
  pk: number
  slug: string
  start: string
  end: string
  capacity: number
  primary_tutor: number
  support_tutors: number[]
  resources: Resource[]
  location: number
  // Used for writing only
  location_id?: number
  title: string
  description: string
  cancelled: boolean
  tutoring_session_notes: number | null
  notes_skipped: boolean
  zoom_url: string
  is_remote: boolean
  is_course_session: boolean
  verbose_title: string
  enrolled_students: string[]
  tutoring_service: number
  tutoring_service_name: string
  set_charge_student_duration?: number | null
  set_pay_tutor_duration?: number | null
  requires_hours?: boolean | number
  diagnostic: number
}

export interface TutoringSessionNote {
  pk: number
  slug: string
  author: number
  notes: string
  resources: Resource[]
  file_uploads: FileUpload[]
  student_tutoring_sessions: number[]
  group_tutoring_session: number | null
  visible_to_student: boolean
  visible_to_parent: boolean
  cc_email: string
}
export interface TutorTutoringSession {
  individual_tutoring_sessions: StudentTutoringSession[]
  group_tutoring_sessions: GroupTutoringSession[]
}

/**
 * Package of individual and group tutoring hours that a student can purchase (or be given by an admin)
 */
export interface TutoringPackage {
  pk: number
  slug: string
  product_id: string
  created: string
  locations: number[] // All locations where package is available
  group_tutoring_sessions: number[] // Group sessions that come with the package
  resource_groups: number[] // Resource groups made available to student as part of package
  title: string
  description: string
  all_locations: boolean
  price: number
  available: string // datetime
  expires: string // datetime
  number_of_students?: number
  individual_test_prep_hours: number
  group_test_prep_hours: number
  individual_curriculum_hours: number
  active: boolean
  sku: string
  magento_purchase_link: string
  // If set, then this package can only be used for sessions with this tutor
  restricted_tutor?: number
  allow_self_enroll: boolean
  is_paygo_package: boolean
}

/**
 * An instance of a student purchasing a TutoringPackage (or package being given to student)
 */
export interface TutoringPackagePurchase {
  pk: number
  slug: string
  tutoring_package: number // PK
  tutoring_package_name: string
  individual_test_prep_hours: number
  group_test_prep_hours: number
  individual_curriculum_hours: number
  student: number
  created: string

  // Admin only fields
  purchased_by?: string // Name
  purchase_reversed_by?: string //Name
  price_paid: number
  purchase_reversed: string //date
  payment_completed: string //date
  payment_confirmation: string // Magento link? TBD
  admin_note: string
}

export type TutorTimeCardLineItem = {
  pk: number
  slug: string
  title: string
  group_tutoring_session: string | null
  individual_tutoring_session: number | null
  time_card: number
  date: string
  hours: number
  hourly_rate: number
  created_by: number
  category: string // See LineItemCategories
}

export type TutorTimeCard = {
  pk: number
  slug: string
  line_items: TutorTimeCardLineItem[]
  tutor: number
  start: string
  end: string
  tutor_approval_time: string | null
  tutor_note: string
  admin_approval_time?: string | null
  admin_approver?: number | null
  admin_note?: string
  hourly_rate: number
  total: number
  admin_has_approved?: boolean
}

export enum Categories {
  AdvanceRefresherFull = 'Advanced Refresher - Full',
  AdvancedRefresherSection = 'Advanced Refresher - Section',
  FullACT_SAT = 'Full ACT/SAT',
  AcademicBridge = 'Academic Bridge',
  HowToSucceedInHS = 'How to Succeed in HS',
  Diagnostics = 'Diagnostics',
  'AP Course' = 'AP Course',
  'Academic Enrichment' = 'Academic Enrichment',
  'Test Prep' = 'Test Prep',
}

export type Course = {
  // Read only
  location: Location
  resources: number[]
  primary_tutor?: number
  primary_tutor_name?: string
  package?: number
  group_tutoring_sessions: GroupTutoringSession[]
  pk: number
  slug: string
  name: string
  description: string
  category: string
  price: number
  available: boolean
  display_on_landing_page: boolean
  time_description: string
  magento_purchase_link?: string
  is_remote: boolean
  students: number[]
  first_session?: string // Only read (from backend) - not writeable
}

// Write version of course, some fields expect IDs
export type PostCourse = {
  // Read only
  location_id: number
  resources?: number[]
  primary_tutor?: number
  package?: number
  group_tutoring_session_ids: number[]
  name: string
  description: string
  available?: boolean
  display_on_landing_page?: boolean
}

export interface TutoringState {
  // this is NOT an object because not all entities will have PK!!!
  studentTutoringSessions: {
    [pk: number]: StudentTutoringSession
  }
  groupTutoringSessions: {
    [pk: number]: GroupTutoringSession
  }
  tutoringSessionNotes: {
    [pk: number]: TutoringSessionNote
  }
  locations: {
    [pk: number]: Location
  }
  tutoringPackages: {
    [pk: number]: TutoringPackage
  }
  tutoringPackagePurchases: {
    [pk: number]: TutoringPackagePurchase
  }
  timeCards: {
    [pk: number]: TutorTimeCard
  }
  courses: {
    [pk: number]: Course
  }
  tutoringServices: {
    [pk: number]: TutoringService
  }
}

export interface TutoringPackageFetchParams {
  location?: number
  student?: number
}

// These are the different types of tutoring sessions. Each has a different type of hours associated with
// it (see Student interface in userTypes)
export enum TutoringSessionType {
  TestPrep = 't',
  Curriculum = 'c',
}

export enum TutoringType {
  Locations = 'Locations',
  ResourceGroups = 'Resource Groups',
  Resources = 'Resources',
  TutoringPackages = 'Tutoring Packages',
  TimeCards = 'Time Cards',
  Courses = 'Courses',
}
