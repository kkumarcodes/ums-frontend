import { FileUpload } from 'store/common/commonTypes'

export enum TutorNotifications {
  task_complete = 'Task Completed',
  individual_tutoring_session_tutor = 'Individual Tutoring Session Created',
  tutor_tutoring_session_cancelled = 'Individual Tutoring Session Cancelled',
  tutor_tutoring_session_rescheduled = 'Individual Tutoring Session Rescheduled',
  tutor_tutoring_session_reminder = 'Individual Tutoring Session Reminder',
  group_tutoring_session_cancelled = 'Group Tutoring Session Cancelled',
  tutor_daily_digest = 'Daily Digest with Sessions and Messages',
}

export enum StudentNotifications {
  tutoring_session_notes = 'Tutoring Session Note Updated',
  student_task_reminder = 'Task Reminder',
  task = 'New Task Assigned',
  task_digest = 'New Task Assigned (Daily)',
  student_diagnostic_result = 'Diagnostic Reviewed',
  student_tutoring_session_reminder = 'Individual Tutoring Session Reminder',
  student_tutoring_session_cancelled = 'Individual Tutoring Session Cancelled',
  student_tutoring_session_rescheduled = 'Individual Tutoring Session Rescheduled',
  group_tutoring_session_cancelled = 'Group Tutoring Session Cancelled',
  student_counselor_meeting_confirmed = 'Meeting with Counselor Scheduled',
  student_counselor_meeting_rescheduled = 'Meeting with Counselor Rescheduled',
  student_counselor_meeting_cancelled = 'Meeting with Counselor Cancelled',
  student_counselor_session_reminder = 'Reminder for Meetings with Counselor',
}

export enum AdministratorNotifications {
  diagnostic_result = 'Diagnostic Submitted',
  diagnostic_score_required = 'Diagnostic Score Required',
  diagnostic_recommendation_required = 'Diagnostic Recommendation Required',
  tutor_altered_availability = 'Tutor Availability Updated',
  first_individual_tutoring_session_daily_digest = 'First Individual Tutoring Session Notes',
  student_self_assigned_diagnostic = 'Student Self Assigned Diagnostic',
  ops_student_diagnostic_registration = 'Student Diagnostic Registration',
  ops_failed_charge = 'Payment Charge Failed',
  ops_magento_webhook = 'Magento Webhook',
  ops_magento_webhook_failure = 'Magento Webhook Failure',
  ops_paygo_payment_success = 'Paygo Payment Success',
  ops_paygo_payment_failure = 'Paygo Payment Failed',
  last_meeting = 'Last Meeting',
  ops_upcoming_course = 'Upcoming Course',
  cas_magento_student_created = 'CAS Magento Student Created',
  cap_magento_student_created = 'CAP Magento Student Created',
}

export enum CounselorNotifications {
  counselor_diagnostic_result = 'Diagnostic Reviewed',
  task_complete = 'Task Completed',
  counselor_file_upload = 'New File Upload',
  counselor_weekly_digest = 'Weekly Digest (Upcoming Meetings)',
  counselor_task_digest = 'Daily Coming Due Task Digest (for students with upcoming meeting)',
  counselor_forward_student_message = 'Text for each new message from a student',
  counselor_completed_tasks = 'Daily Completed Task Digest (tasks completed by students)',
}

export interface NotificationRecipient {
  phone_number_is_confirmed: boolean
  phone_number: string
  receive_texts: boolean
  receive_emails: boolean
  unsubscribed_email_notifications: string[]
  unsubscribed_text_notifications: string[]
  // List of notification types that user can unsubscribe from
  unsubscribable_notifications: string[]
  user: number
  pk: number
  // Read Only
  unread_conversations: number
}

export interface Bulletin {
  pk: number
  slug: string
  visible: boolean
  pinned: boolean
  priority: number
  visible_to_notification_recipients: number[]
  created_by: number
  title: string
  content: string // HTML
  created: string // datetime string

  // Used to determine which people get the bulletin on create, if visible_to_notification_recipients
  // is not set
  send_notification: boolean
  class_years: number[]
  all_class_years: boolean
  counseling_student_types: string[]
  all_counseling_student_types: boolean
  cas: boolean
  cap: boolean
  students: boolean
  parents: boolean
  counselors: boolean
  tutors: boolean
  evergreen: boolean
  evergreen_expiration: string | null
  read_student_names?: string[]
  read_parent_names?: string[]
  update_file_uploads?: string[] // Array of slugs of file uploads to update on Bulletin object
  tags: string[]

  // Read Only
  admin_announcement: boolean
  file_uploads: FileUpload[]
}

export interface Notification {
  slug: string
  actor_name: string
  activity_log_title: string
  activity_log_description: string
  notification_type: string
  created: string // datetime
  emailed: string | null
  texted: string | null
}

export interface NotificationState {
  notificationRecipients: {
    [pk: number]: NotificationRecipient
  }
  bulletins: {
    [pk: number]: Bulletin
  }
}
